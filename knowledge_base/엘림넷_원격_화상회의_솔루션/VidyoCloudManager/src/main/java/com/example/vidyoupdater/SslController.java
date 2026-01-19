package com.example.vidyoupdater;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/ssl")
public class SslController {

    private final Path sslDir;
    private final SslInstallService sslInstallService;

    public SslController(
            @Value("${vidyo.ssl.dir:ssl}") String sslDir,
            SslInstallService sslInstallService
    ) {
        this.sslDir = Paths.get(sslDir).toAbsolutePath().normalize();
        this.sslInstallService = sslInstallService;
    }

    // =========================
    // Mode1) PFX 업로드
    // =========================
    @PostMapping("/upload-pfx")
    public Map<String, Object> uploadPfx(@RequestParam("file") MultipartFile file) throws IOException {
        ensureSslDir();

        String original = StringUtils.cleanPath(
                Objects.requireNonNull(file.getOriginalFilename(), "filename")
        );
        if (original.isBlank()) throw new IllegalArgumentException("Empty filename");

        String lower = original.toLowerCase(Locale.ROOT);
        if (!(lower.endsWith(".pfx") || lower.endsWith(".p12"))) {
            throw new IllegalArgumentException("Only .pfx/.p12 allowed");
        }

        String storedName = UUID.randomUUID() + "_" + original;
        Path target = sslDir.resolve(storedName).normalize();
        if (!target.startsWith(sslDir)) {
            throw new IllegalArgumentException("Invalid path");
        }

        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        Map<String, Object> res = new HashMap<>();
        res.put("storedName", storedName);
        res.put("originalName", original);
        return res;
    }

    // =========================
    // Mode1) PFX install
    // =========================
    @PostMapping("/install-from-upload")
    public Map<String, Object> installFromUpload(@RequestBody SslInstallRequest req) {
        validateInstallRequest(req);

        String component = normalizeComponent(req.getComponent());
        if (!isAllowedComponent(component)) {
            throw new IllegalArgumentException("Invalid component for SSL: " + req.getComponent());
        }

        Path pfxPath = sslDir.resolve(req.getStoredName()).normalize();
        if (!pfxPath.startsWith(sslDir)) {
            throw new IllegalArgumentException("Invalid storedName path");
        }

        File pfx = pfxPath.toFile();
        if (!pfx.exists()) {
            throw new IllegalArgumentException("Stored file not found: " + req.getStoredName());
        }

        String jobId = sslInstallService.startJob(
                component,
                pfx,
                req.getPassword(),
                req.getServers()
        );

        Map<String, Object> res = new HashMap<>();
        res.put("jobId", jobId);
        return res;
    }

    // =========================
    // Mode2) KEY + CRT → PFX → install
    // =========================
    @PostMapping("/create-pfx-and-install")
    public Map<String, Object> createPfxAndInstall(
            @RequestParam("component") String component,
            @RequestParam("servers") List<String> servers,
            @RequestParam("keyFile") MultipartFile keyFile,
            @RequestParam("crtFile") MultipartFile crtFile
    ) throws IOException {

        ensureSslDir();

        String normalized = normalizeComponent(component);
        if (!isAllowedComponent(normalized)) {
            throw new IllegalArgumentException("Invalid component for SSL: " + component);
        }
        if (servers == null || servers.isEmpty()) throw new IllegalArgumentException("No servers");
        if (keyFile == null || keyFile.isEmpty()) throw new IllegalArgumentException("KEY file required");
        if (crtFile == null || crtFile.isEmpty()) throw new IllegalArgumentException("CRT file required");

        String keyOriginal = safeName(keyFile.getOriginalFilename(), "privkey.key");
        String crtOriginal = safeName(crtFile.getOriginalFilename(), "fullchain.crt");

        String keyStored = UUID.randomUUID() + "_" + keyOriginal;
        String crtStored = UUID.randomUUID() + "_" + crtOriginal;

        Path keyPath = sslDir.resolve(keyStored).normalize();
        Path crtPath = sslDir.resolve(crtStored).normalize();
        if (!keyPath.startsWith(sslDir) || !crtPath.startsWith(sslDir)) {
            throw new IllegalArgumentException("Invalid path");
        }

        Files.copy(keyFile.getInputStream(), keyPath, StandardCopyOption.REPLACE_EXISTING);
        Files.copy(crtFile.getInputStream(), crtPath, StandardCopyOption.REPLACE_EXISTING);

        String password = sslInstallService.generateStrongPassword(16);

        File outPfx = sslInstallService.makePfxFromKeyAndCrt(
                sslDir.toFile(),
                keyPath.toFile(),
                crtPath.toFile(),
                password,
                "bundle"
        );

        String jobId = sslInstallService.startJob(
                normalized,
                outPfx,
                password,
                servers
        );

        Map<String, Object> res = new HashMap<>();
        res.put("jobId", jobId);
        res.put("storedName", outPfx.getName());
        res.put("password", password);
        return res;
    }

    // =========================
    // 진행 조회
    // =========================
    @GetMapping("/progress/{jobId}")
    public Map<String, Object> progress(@PathVariable String jobId) {
        Map<String, Map<String, Object>> st = sslInstallService.getJobStatus(jobId);

        Map<String, Object> res = new HashMap<>();
        res.put("jobId", jobId);
        res.put("servers", st == null ? Collections.emptyMap() : st);
        return res;
    }

    // =========================
    // Helpers
    // =========================
    private void ensureSslDir() throws IOException {
        if (!Files.exists(sslDir)) Files.createDirectories(sslDir);
    }

    private static boolean isAllowedComponent(String c) {
        return c.equals("portal")
                || c.equals("router")
                || c.equals("event")
                || c.equals("replay")
                || c.equals("gateway");
    }

    private static String normalizeComponent(String c) {
        if (c == null) return "";
        return c.trim().toLowerCase(Locale.ROOT);
    }

    private static String safeName(String original, String fallback) {
        String s = (original == null) ? "" : StringUtils.cleanPath(original);
        return s.isBlank() ? fallback : s;
    }

    private static void validateInstallRequest(SslInstallRequest req) {
        if (req == null) throw new IllegalArgumentException("Empty request");
        if (req.getServers() == null || req.getServers().isEmpty()) throw new IllegalArgumentException("No servers");
        if (req.getStoredName() == null || req.getStoredName().isBlank()) throw new IllegalArgumentException("No storedName");
        if (req.getPassword() == null || req.getPassword().isBlank()) throw new IllegalArgumentException("No password");
        if (req.getComponent() == null || req.getComponent().isBlank()) throw new IllegalArgumentException("No component");
    }

    // ===== Request DTO =====
    public static class SslInstallRequest {
        private String component;
        private String storedName;
        private String password;
        private List<String> servers;

        public String getComponent() { return component; }
        public void setComponent(String component) { this.component = component; }

        public String getStoredName() { return storedName; }
        public void setStoredName(String storedName) { this.storedName = storedName; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public List<String> getServers() { return servers; }
        public void setServers(List<String> servers) { this.servers = servers; }
    }
}
