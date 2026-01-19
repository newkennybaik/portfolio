package com.example.vidyoupdater;

import com.example.vidyoupdater.config.ComponentConfigService;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;

@Controller
public class VidyoUpdateController {

    private static final Logger log =
            LoggerFactory.getLogger(VidyoUpdateController.class);

    // AuthController 와 같은 세션 키
    public static final String SESSION_USER_ID  = "LOGIN_USER_ID";
    public static final String SESSION_USERNAME = "LOGIN_USERNAME";

    private final VidyoUpdateService vidyoUpdateService;
    private final ComponentConfigService componentConfigService;

    // JAR 실행 위치 기준 업로드 경로
    private final File uploadDir;

    public VidyoUpdateController(
            VidyoUpdateService vidyoUpdateService,
            ComponentConfigService componentConfigService,
            @Value("${vidyo.upload.dir:upload}") String uploadDirName
    ) {
        this.vidyoUpdateService = vidyoUpdateService;
        this.componentConfigService = componentConfigService;

        // jar 가 있는 디렉터리 기준으로 upload 디렉터리 생성
        File jarDir = new File(
                System.getProperty("java.class.path")
        ).getAbsoluteFile().getParentFile();

        this.uploadDir = new File(jarDir, uploadDirName);

        if (!uploadDir.exists() && !uploadDir.mkdirs()) {
            throw new RuntimeException(
                    "upload 폴더 생성 실패: " + uploadDir.getAbsolutePath()
            );
        }
        log.info("Upload dir = {}", uploadDir.getAbsolutePath());
    }

    // ---------- 로그인 체크 유틸 ----------

    private boolean isLoggedIn(HttpSession session) {
        return session.getAttribute(SESSION_USER_ID) != null;
    }

    private String getLoginUsername(HttpSession session) {
        Object name = session.getAttribute(SESSION_USERNAME);
        return name != null ? name.toString() : "";
    }

    private String redirectUpdateOrLogin(HttpSession session) {
        if (!isLoggedIn(session)) {
            return "redirect:/login";
        }
        return "redirect:/update";
    }

    // ---------- 루트 ----------

    @GetMapping("/")
    public String root(HttpSession session) {
        return redirectUpdateOrLogin(session);
    }

    // ---------- 통합 업데이트 페이지 ----------

    @GetMapping("/update")
    public String updatePage(HttpSession session, Model model) {
        if (!isLoggedIn(session)) {
            return "redirect:/login";
        }
        model.addAttribute("loginUsername", getLoginUsername(session));
        return "update";   // templates/update.html
    }

    // 기존 URL로 들어와도 /update 로 보내기
    @GetMapping("/update/portal")
    public String legacyPortal(HttpSession session) {
        return redirectUpdateOrLogin(session);
    }

    @GetMapping("/update/router")
    public String legacyRouter(HttpSession session) {
        return redirectUpdateOrLogin(session);
    }

    @GetMapping("/update/replay")
    public String legacyReplay(HttpSession session) {
        return redirectUpdateOrLogin(session);
    }

    @GetMapping("/update/gateway")
    public String legacyGateway(HttpSession session) {
        return redirectUpdateOrLogin(session);
    }

    @GetMapping("/update/event")
    public String legacyEvent(HttpSession session) {
        return redirectUpdateOrLogin(session);
    }

    @GetMapping("/update/insights")
    public String legacyInsights(HttpSession session) {
        return redirectUpdateOrLogin(session);
    }

    // ---------- (1단계) 파일만 업로드 ----------

    @PostMapping("/upload-file")
    @ResponseBody
    public Map<String, String> uploadFile(@RequestParam("file") MultipartFile file)
            throws IOException {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("업그레이드할 파일이 비어 있습니다.");
        }

        String originalName = file.getOriginalFilename();
        String storedName = UUID.randomUUID() + "_" +
                (originalName == null ? "upload.bin" : originalName);

        File target = new File(uploadDir, storedName);
        file.transferTo(target);

        log.info("UPLOAD OK: original={} stored={} size={}",
                originalName, storedName, file.getSize());

        Map<String, String> resp = new HashMap<>();
        resp.put("storedName", storedName);
        resp.put("originalName", originalName);
        return resp;
    }

    // ---------- (2단계) 업로드된 파일로 업그레이드 시작 ----------

    public static class UpgradeFromUploadRequest {
        private String component;
        private String storedName;
        private List<String> servers;

        public String getComponent() {
            return component;
        }
        public void setComponent(String component) {
            this.component = component;
        }
        public String getStoredName() {
            return storedName;
        }
        public void setStoredName(String storedName) {
            this.storedName = storedName;
        }
        public List<String> getServers() {
            return servers;
        }
        public void setServers(List<String> servers) {
            this.servers = servers;
        }
    }

    @PostMapping("/upgrade-from-upload")
    @ResponseBody
    public Map<String, String> upgradeFromUpload(
            @RequestBody UpgradeFromUploadRequest req
    ) {

        if (req.getComponent() == null || req.getComponent().isBlank()) {
            throw new IllegalArgumentException("component 파라미터가 비어 있습니다.");
        }
        if (req.getStoredName() == null || req.getStoredName().isBlank()) {
            throw new IllegalArgumentException("storedName 파라미터가 비어 있습니다.");
        }
        if (req.getServers() == null || req.getServers().isEmpty()) {
            throw new IllegalArgumentException("서버가 하나도 선택되지 않았습니다.");
        }

        File file = new File(uploadDir, req.getStoredName());
        if (!file.isFile()) {
            throw new IllegalArgumentException(
                    "업로드된 파일을 찾을 수 없습니다: " + req.getStoredName());
        }

        log.info("UPGRADE START: component={} storedName={} servers={}",
                req.getComponent(), req.getStoredName(), req.getServers());

        String jobId = vidyoUpdateService.startJob(
                req.getComponent(), file, req.getServers()
        );

        Map<String, String> result = new HashMap<>();
        result.put("jobId", jobId);
        return result;
    }

    // ---------- 진행 상태 조회 ----------

    @GetMapping("/progress/{jobId}")
    @ResponseBody
    public Map<String, Object> progress(@PathVariable String jobId) {

        Map<String, Map<String, Object>> servers =
                vidyoUpdateService.getJobStatus(jobId);

        Map<String, Object> resp = new HashMap<>();
        resp.put("jobId", jobId);
        resp.put("servers", servers != null ? servers : new HashMap<>());
        return resp;
    }

    // ---------- (참고) 기존 /upgrade 단일 multipart 방식은 더 이상 사용 안 함 ----------
    // FileCountLimit 문제 때문에 UI 에서 /upload-file + /upgrade-from-upload 를 사용하도록 변경했다.
}
