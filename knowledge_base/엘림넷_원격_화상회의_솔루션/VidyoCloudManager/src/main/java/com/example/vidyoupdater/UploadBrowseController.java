package com.example.vidyoupdater;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Stream;
import java.util.Comparator;

@RestController
public class UploadBrowseController {

    private final Path uploadDir;
    private final Path sslDir;

    public UploadBrowseController(
            @Value("${vidyo.upload.dir:upload}") String uploadDir,
            @Value("${vidyo.ssl.dir:ssl}") String sslDir
    ) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.sslDir = Paths.get(sslDir).toAbsolutePath().normalize();
    }

    // =========================
    // Updater files (upload/)
    // =========================
    @GetMapping("/api/upload-files")
    public List<String> listUploadedFiles() throws IOException {
        return listFiles(uploadDir);
    }

    @DeleteMapping("/api/upload-files/{fileName:.+}")
    public ResponseEntity<String> deleteUploadByName(@PathVariable String fileName) throws IOException {
        return deleteByName(uploadDir, fileName);
    }

    @DeleteMapping("/api/upload-files/oldest")
    public ResponseEntity<String> deleteUploadOldest() throws IOException {
        return deleteOldest(uploadDir);
    }

    // =========================
    // SSL files (ssl/)
    // =========================
    @GetMapping("/api/ssl-files")
    public List<String> listSslFiles() throws IOException {
        return listFiles(sslDir);
    }

    @DeleteMapping("/api/ssl-files/{fileName:.+}")
    public ResponseEntity<String> deleteSslByName(@PathVariable String fileName) throws IOException {
        return deleteByName(sslDir, fileName);
    }

    @DeleteMapping("/api/ssl-files/oldest")
    public ResponseEntity<String> deleteSslOldest() throws IOException {
        return deleteOldest(sslDir);
    }

    // =========================
    // Helpers
    // =========================
    private static List<String> listFiles(Path dir) throws IOException {
        if (dir == null || !Files.exists(dir)) return Collections.emptyList();
        try (Stream<Path> stream = Files.list(dir)) {
            return stream
                    .filter(Files::isRegularFile)
                    .map(p -> p.getFileName().toString())
                    .sorted()
                    .toList();
        }
    }

    private static ResponseEntity<String> deleteByName(Path dir, String fileName) throws IOException {
        if (fileName == null || fileName.isBlank()) return ResponseEntity.badRequest().body("EMPTY");
        if (dir == null) return ResponseEntity.status(500).body("NO_DIR");

        Path target = dir.resolve(fileName).normalize();
        if (!target.startsWith(dir)) return ResponseEntity.status(403).body("FORBIDDEN");
        if (!Files.exists(target)) return ResponseEntity.notFound().build();

        Files.deleteIfExists(target);
        return ResponseEntity.ok("OK");
    }

    private static ResponseEntity<String> deleteOldest(Path dir) throws IOException {
        if (dir == null || !Files.exists(dir)) return ResponseEntity.ok("NO_DIR");

        Optional<Path> oldest;
        try (Stream<Path> s = Files.list(dir)) {
            oldest = s.filter(Files::isRegularFile)
                    .min(Comparator.comparingLong(p -> {
                        try { return Files.getLastModifiedTime(p).toMillis(); }
                        catch (IOException e) { return Long.MAX_VALUE; }
                    }));
        }

        if (oldest.isEmpty()) return ResponseEntity.ok("NO_FILE");
        Files.deleteIfExists(oldest.get());
        return ResponseEntity.ok("OK");
    }
}
