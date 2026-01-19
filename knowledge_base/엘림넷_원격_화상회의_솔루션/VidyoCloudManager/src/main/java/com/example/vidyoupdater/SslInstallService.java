package com.example.vidyoupdater;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

@Service
public class SslInstallService {

    @Value("${vidyo.ssh.key}")
    private String sshKey;

    @Value("${vidyo.ssl.max-concurrent:${vidyo.max-concurrent:4}}")
    private int maxConcurrent;

    private ExecutorService executor;
    private Semaphore semaphore;

    private final ConcurrentMap<String, Map<String, Map<String, Object>>> jobs =
            new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        executor = Executors.newFixedThreadPool(maxConcurrent);
        semaphore = new Semaphore(maxConcurrent);
    }

    @PreDestroy
    public void shutdown() {
        if (executor != null) executor.shutdown();
    }

    public String startJob(String component, File pfxFile, String password, List<String> ips) {
        String jobId = UUID.randomUUID().toString();

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

        for (String ip : ips) {
            executor.submit(() -> runInstall(jobId, component, pfxFile, password, ip));
        }

        return jobId;
    }

    private void runInstall(String jobId, String component, File pfxFile, String password, String ip) {
        Map<String, Map<String, Object>> map = jobs.get(jobId);
        if (map == null) return;

        Map<String, Object> st = map.get(ip);
        if (st == null) return;

        try {
            semaphore.acquire();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            fail(st, "[" + ip + "] ERROR: interrupted while waiting for slot\n");
            return;
        }

        try {
            boolean isEvent = component != null && component.trim().equalsIgnoreCase("event");

            // 1) VidyoUpload
            update(st, "UPLOADING", 10, "[" + ip + "] VidyoUpload start\n");
            String up = SshExecutor.uploadWithCat(pfxFile, sshKey, ip);
            appendLog(st, up);
            if (extractExitCode(up) != 0) {
                fail(st, "[" + ip + "] VidyoUpload failed\n");
                return;
            }

            // 2) SSL_InstallPFX
            update(st, "INSTALLING", 45, "[" + ip + "] SSL_InstallPFX start\n");
            String inst = SshExecutor.runSslInstallPfx(sshKey, ip, password);
            appendLog(st, inst);
            if (extractExitCode(inst) != 0) {
                fail(st, "[" + ip + "] SSL_InstallPFX failed\n");
                return;
            }

            if (isEvent) {
                // 3) (EVENT) VidyoEventService createKeystore
                update(st, "EVENT_KEYSTORE", 70, "[" + ip + "] VidyoEventService createKeystore start\n");
                String ks = SshExecutor.runEventCreateKeystore(sshKey, ip, password);
                appendLog(st, ks);
                if (extractExitCode(ks) != 0) {
                    fail(st, "[" + ip + "] VidyoEventService createKeystore failed\n");
                    return;
                }

                // 4) (EVENT) reboot
                update(st, "REBOOTING", 85, "[" + ip + "] reboot start\n");
                String reboot = SshExecutor.runRemoteSimple(sshKey, ip, "reboot");
                appendLog(st, reboot);

                int rb = extractExitCode(reboot);
                if (!(rb == 0 || rb == 255)) {
                    fail(st, "[" + ip + "] reboot failed (EXIT_CODE=" + rb + ")\n");
                    return;
                }

                update(st, "DONE", 100, "[" + ip + "] DONE\n");
                return;
            }

            // 3) (NORMAL) apache2 reload
            update(st, "RELOADING", 70, "[" + ip + "] apache2 reload start\n");
            String reload = SshExecutor.runRemoteSimple(sshKey, ip, "apache2 reload");
            appendLog(st, reload);
            if (extractExitCode(reload) != 0) {
                fail(st, "[" + ip + "] apache2 reload failed\n");
                return;
            }

            // 4) (NORMAL) reboot
            update(st, "REBOOTING", 85, "[" + ip + "] reboot start\n");
            String reboot = SshExecutor.runRemoteSimple(sshKey, ip, "reboot");
            appendLog(st, reboot);

            int rb = extractExitCode(reboot);
            if (!(rb == 0 || rb == 255)) {
                fail(st, "[" + ip + "] reboot failed (EXIT_CODE=" + rb + ")\n");
                return;
            }

            update(st, "DONE", 100, "[" + ip + "] DONE\n");

        } catch (Exception e) {
            fail(st, "[" + ip + "] ERROR: " + e.getMessage() + "\n");
        } finally {
            semaphore.release();
        }
    }

    // =========================
    // Mode2: KEY + CRT(fullchain) -> PFX 생성 (로컬 openssl)
    // =========================
    public File makePfxFromKeyAndCrt(File uploadDir, File keyFile, File crtFile, String password, String outNameHint) {
        if (uploadDir == null) throw new IllegalArgumentException("uploadDir is null");
        if (keyFile == null || !keyFile.exists()) throw new IllegalArgumentException("keyFile not found");
        if (crtFile == null || !crtFile.exists()) throw new IllegalArgumentException("crtFile not found");
        if (password == null || password.isBlank()) throw new IllegalArgumentException("password is empty");

        String base = (outNameHint != null && !outNameHint.isBlank()) ? outNameHint.trim() : "bundle";
        String storedName = UUID.randomUUID() + "_" + base + ".pfx";
        File out = new File(uploadDir, storedName);

        String cmd = "openssl pkcs12 -export"
                + " -inkey " + shellQuote(keyFile.getAbsolutePath())
                + " -in " + shellQuote(crtFile.getAbsolutePath())
                + " -out " + shellQuote(out.getAbsolutePath())
                + " -passout pass:" + shellQuote(password);

        String result = LocalCmdExecutor.run(cmd);
        int exit = extractExitCode(result);
        if (exit != 0) {
            throw new RuntimeException("PFX create failed. output=\n" + result);
        }

        if (!out.exists() || out.length() <= 0) {
            throw new RuntimeException("PFX create failed: output file missing/empty: " + out.getAbsolutePath());
        }

        return out;
    }

    // =========================
    // Password generator
    // =========================
    public String generateStrongPassword(int len) {
        int n = Math.max(12, len);
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+=";
        SecureRandom r = new SecureRandom();
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) {
            sb.append(chars.charAt(r.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private static String shellQuote(String s) {
        if (s == null) return "''";
        return "'" + s.replace("'", "'\"'\"'") + "'";
    }

    // =========================
    // common
    // =========================
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
        st.put("log", old + (log == null ? "" : log));
    }

    private void fail(Map<String, Object> st, String log) {
        st.put("phase", "FAILED");
        st.put("progress", 100);
        appendLog(st, log);
    }

    public Map<String, Map<String, Object>> getJobStatus(String jobId) {
        return jobs.get(jobId);
    }
}
