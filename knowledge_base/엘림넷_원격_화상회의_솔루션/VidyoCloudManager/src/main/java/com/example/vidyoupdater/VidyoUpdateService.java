package com.example.vidyoupdater;

import com.example.vidyoupdater.config.ComponentConfigService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;

@Service
public class VidyoUpdateService {

    // SSH 키 경로 (application.properties 에서 주입)
    @Value("${vidyo.ssh.key}")
    private String sshKey;

    // 전체 동시 실행 상한 (기본 4)
    @Value("${vidyo.max-concurrent:4}")
    private int maxConcurrent;

    private final ComponentConfigService componentConfigService;

    // 전역 스레드풀: 최대 maxConcurrent 개까지만 실제로 실행
    private ExecutorService executor;

    // 동시 실행 제어용 세마포어 (maxConcurrent 개만 permit)
    private Semaphore semaphore;

    /**
     * jobId -> ( ip -> 상태맵 )
     * 상태맵 구조:
     *   {
     *     "ip": "192.168.0.100",
     *     "phase": "UPLOADING" / "UPDATING" / "DONE" / "FAILED" / "WAITING",
     *     "progress": 0~100 (Integer),
     *     "log": "... 누적 문자열 ..."
     *   }
     */
    private final ConcurrentMap<String, Map<String, Map<String, Object>>> jobs =
            new ConcurrentHashMap<>();

    public VidyoUpdateService(ComponentConfigService componentConfigService) {
        this.componentConfigService = componentConfigService;
    }

    @PostConstruct
    public void init() {
        // 스레드풀은 maxConcurrent 만큼
        executor = Executors.newFixedThreadPool(maxConcurrent);
        semaphore = new Semaphore(maxConcurrent);
    }

    @PreDestroy
    public void shutdown() {
        if (executor != null) {
            executor.shutdown();
        }
    }

    /**
     * 업그레이드 Job 시작
     *
     * @param component portal/router/replay/gateway/event/insights
     * @param file      업로드된 파일
     * @param ips       선택된 서버 목록 (프론트에서 체크한 서버들 전부)
     * @return jobId
     */
    public String startJob(String component, File file, List<String> ips) {

        // ▶ “컴포넌트별 동시 실행 수 제한”과는 별개로,
        //    프론트는 10개/20개를 보내도 되고,
        //    여기서는 그냥 전부 job 에 등록한다.
        //    실제 동시 실행 개수는 semaphore + executor 가 제한한다.

        String jobId = UUID.randomUUID().toString();

        // 상태 초기화
        Map<String, Map<String, Object>> serverMap = new ConcurrentHashMap<>();

        for (String ip : ips) {
            Map<String, Object> st = new ConcurrentHashMap<>();
            st.put("ip", ip);
            st.put("phase", "WAITING");
            st.put("progress", 0);
            st.put("log", "");
            serverMap.put(ip, st);
        }

        jobs.put(jobId, serverMap);

        // 서버별 작업 제출
        for (String ip : ips) {
            final String targetIp = ip;
            executor.submit(() -> runUpdate(jobId, file, targetIp));
        }

        return jobId;
    }

    /**
     * 개별 서버에 대해 업로드 + 업데이트 실행
     * 동시 실행 상한은 semaphore 가 잡는다.
     */
    private void runUpdate(String jobId, File file, String ip) {

        Map<String, Map<String, Object>> map = jobs.get(jobId);
        if (map == null) return;

        Map<String, Object> st = map.get(ip);
        if (st == null) return;

        // 여기서부터는 “실행 슬롯”을 확보해야 들어간다.
        try {
            // 슬롯 얻기 (최대 maxConcurrent 개까지 허용)
            semaphore.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            fail(st, "[" + ip + "] ERROR: interrupted while waiting for slot\n");
            return;
        }

        try {
            update(st, "UPLOADING", 10, "[" + ip + "] Upload start\n");

            // 업로드
            String uploadResult = SshExecutor.uploadWithCat(file, sshKey, ip);
            appendLog(st, uploadResult);

            int uploadExit = extractExitCode(uploadResult);
            if (uploadExit != 0) {
                fail(st, "[" + ip + "] Upload failed (EXIT_CODE=" + uploadExit + ")\n");
                return;
            }

            update(st, "UPDATING", 60, "[" + ip + "] Update start\n");

            // 업데이트
            String updateResult = SshExecutor.runVidyoUpdate(sshKey, ip);
            appendLog(st, updateResult);

            int updateExit = extractExitCode(updateResult);

            // 0: 정상, 255: SSH 가 remote host 에서 종료된 경우지만 성공 케이스로 간주
            if (updateExit == 0) {
                // OK
            } else if (updateExit == 255) {
                appendLog(st, "[" + ip + "] SSH EXIT_CODE=255 (connection closed by remote host) - treated as SUCCESS\n");
            } else {
                fail(st, "[" + ip + "] Update failed (EXIT_CODE=" + updateExit + ")\n");
                return;
            }

            update(st, "DONE", 100, "[" + ip + "] DONE\n");

        } catch (IOException | InterruptedException e) {
            fail(st, "[" + ip + "] ERROR: " + e.getMessage() + "\n");
            Thread.currentThread().interrupt();
        } catch (Exception e) {
            fail(st, "[" + ip + "] ERROR: " + e.getMessage() + "\n");
        } finally {
            // 작업 끝났으니 슬롯 반환
            semaphore.release();
        }
    }

    /**
     * SshExecutor 출력에서 EXIT_CODE 값을 파싱
     */
    private int extractExitCode(String output) {
        if (output == null) return -999;
        int idx = output.lastIndexOf("EXIT_CODE=");
        if (idx < 0) return -999;
        String tail = output.substring(idx + "EXIT_CODE=".length()).trim();
        String[] parts = tail.split("\\s+");
        try {
            return Integer.parseInt(parts[0]);
        } catch (NumberFormatException e) {
            return -999;
        }
    }

    private void update(Map<String, Object> st, String phase, int progress, String log) {
        st.put("phase", phase);
        st.put("progress", progress);
        appendLog(st, log);
    }

    private void appendLog(Map<String, Object> st, String log) {
        String old = (String) st.get("log");
        if (old == null) old = "";
        st.put("log", old + log);
    }

    private void fail(Map<String, Object> st, String log) {
        st.put("phase", "FAILED");
        st.put("progress", 100);
        appendLog(st, log);
    }

    /**
     * /progress/{jobId} 에서 그대로 JSON 으로 나갈 데이터
     */
    public Map<String, Map<String, Object>> getJobStatus(String jobId) {
        return jobs.get(jobId);
    }
}
