package com.example.vidyoupdater;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;

public class SshPortStore {

    // 저장 파일: (JAR 위치)/config/ssh-port.txt
    private static Path resolveStoreFile() {
        Path jarDir;
        try {
            jarDir = new java.io.File(System.getProperty("java.class.path"))
                    .getAbsoluteFile()
                    .getParentFile()
                    .toPath();
        } catch (Exception e) {
            jarDir = Paths.get(".").toAbsolutePath().normalize();
        }

        Path cfgDir = jarDir.resolve("config");
        return cfgDir.resolve("ssh-port.txt");
    }

    public static int getPort() {
        // 우선순위: System property > file > default(22)
        String prop = System.getProperty("vidyo.ssh.port");
        if (prop != null && !prop.isBlank()) {
            Integer p = parsePort(prop.trim());
            if (p != null) return p;
        }

        Path f = resolveStoreFile();
        if (!Files.exists(f)) return 22;

        try {
            String s = Files.readString(f, StandardCharsets.UTF_8).trim();
            Integer p = parsePort(s);
            return p != null ? p : 22;
        } catch (Exception e) {
            return 22;
        }
    }

    public static void setPort(int port) {
        if (port <= 0) port = 22;
        if (port > 65535) throw new IllegalArgumentException("Invalid port: " + port);

        Path f = resolveStoreFile();
        try {
            Files.createDirectories(f.getParent());
            Files.writeString(f, String.valueOf(port), StandardCharsets.UTF_8,
                    StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to save ssh port: " + e.getMessage(), e);
        }
    }

    private static Integer parsePort(String s) {
        try {
            int p = Integer.parseInt(s);
            if (p <= 0) return 22;
            if (p > 65535) return null;
            return p;
        } catch (Exception e) {
            return null;
        }
    }
}
