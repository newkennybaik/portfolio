package com.example.qumu;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Stream;

public class QumuAutoUploader {

    // Qumu
    private static final String INSTANCE   = env("QUMU_INSTANCE", "demo");
    private static final String USERNAME   = env("QUMU_USERNAME", "you@example.com");
    private static final String PASSWORD   = env("QUMU_PASSWORD", "password");
    private static final String TYPE_GUID  = env("QUMU_TYPE_GUID", "");
    private static final String TYPE_TITLE = env("QUMU_TYPE_TITLE", "");

    // Vidyo (제목 조회)
    private static final String VIDYO_BASE = env("VIDYO_BASE", "");
    private static final String VIDYO_USER = env("VIDYO_USER", "");
    private static final String VIDYO_PASS = env("VIDYO_PASS", "");

    private static final boolean STRICT_TITLE = Boolean.parseBoolean(env("STRICT_TITLE", "true"));

    private static final String WATCH_PATH = env("WATCH_PATH",
            Paths.get(System.getProperty("user.home"), "qumu-watch").toString());
    private static final long   POLL_MS    = Long.parseLong(env("QUMU_POLL_MS", "15000"));

    public static void main(String[] args) throws Exception {
        System.out.println("[CONFIG] INSTANCE=" + INSTANCE);
        System.out.println("[CONFIG] WATCH_PATH=" + WATCH_PATH);
        System.out.println("[CONFIG] STRICT_TITLE=" + STRICT_TITLE);

        Files.createDirectories(Path.of(WATCH_PATH));

        try (QumuClient qumu = new QumuClient(INSTANCE, USERNAME, PASSWORD);
             VidyoReplayClient vidyo = new VidyoReplayClient(
                     VIDYO_BASE, VIDYO_USER, VIDYO_PASS)) {

            // Vidyo 로그인 (제목 조회용)
            if (!VIDYO_BASE.isBlank()) {
                vidyo.login();
            }

            final String resolvedTypeGuid = resolveTypeGuidOrAuto(qumu, TYPE_GUID, TYPE_TITLE);
            System.out.println("[CONFIG] TYPE_GUID=" + resolvedTypeGuid);

            // 시작 시 기존 파일 처리
            try (Stream<Path> s = Files.list(Path.of(WATCH_PATH))) {
                s.filter(Files::isRegularFile)
                 .map(Path::toFile)
                 .filter(QumuAutoUploader::isVideo)
                 .forEach(f -> safeProcess(qumu, vidyo, f, resolvedTypeGuid));
            }

            // 신규 파일 감시
            WatchService ws = FileSystems.getDefault().newWatchService();
            Path dir = Path.of(WATCH_PATH);
            dir.register(ws, StandardWatchEventKinds.ENTRY_CREATE);
            System.out.println("[WATCH] " + dir);

            while (true) {
                WatchKey key = ws.take();
                for (WatchEvent<?> e : key.pollEvents()) {
                    if (e.kind() != StandardWatchEventKinds.ENTRY_CREATE) continue;
                    Path created = dir.resolve((Path) e.context());
                    File f = created.toFile();
                    if (!f.isFile()) continue;
                    if (!isVideo(f)) continue;
                    waitUntilStable(f, Duration.ofSeconds(5));
                    safeProcess(qumu, vidyo, f, resolvedTypeGuid);
                }
                key.reset();
            }
        }
    }

    private static void safeProcess(QumuClient qumu, VidyoReplayClient vidyo, File file, String typeGuid) {
        try {
            String name = file.getName();
            String guid = stripExt(name); // 파일명(확장자 제거) = GUID 가정
            String title = guid;

            // Vidyo에서 GUID -> title 조회
            if (vidyo != null && !VIDYO_BASE.isBlank()) {
                try {
                    Optional<String> t = vidyo.findTitleByGuid(guid);
                    if (t.isPresent()) {
                        title = t.get();
                        System.out.println("[TITLE] " + guid + " -> " + title);
                    } else {
                        String msg = "[TITLE] not found for " + guid;
                        if (STRICT_TITLE) {
                            System.err.println(msg + " (STRICT=true: skip upload)");
                            return;
                        } else {
                            System.err.println(msg + " (fallback to filename)");
                        }
                    }
                } catch (Exception ex) {
                    System.err.println("[TITLE] lookup error for " + guid + " : " + ex.getMessage() + " (fallback to filename)");
                }
            }

            System.out.println("[CREATE] " + title);
            String kuluGuid = qumu.createKulu(title, typeGuid);
            System.out.println("[GUID]   " + kuluGuid);

            System.out.println("[UPLOAD] " + name);
            qumu.uploadMedia(kuluGuid, file);

            // 발행까지 폴링
            while (true) {
                Thread.sleep(POLL_MS);
                String state = qumu.getState(kuluGuid);
                System.out.println("[STATE]  " + kuluGuid + " -> " + state);
                if ("PUBLISHED".equalsIgnoreCase(state)) break;

                try {
                    qumu.publish(kuluGuid);
                    System.out.println("[PUBLISH] requested");
                } catch (Exception ignore) {
                }

                if ("FAILED".equalsIgnoreCase(state)) {
                    throw new RuntimeException("Encoding failed for " + kuluGuid);
                }
            }

            System.out.println("[DONE]   https://" + INSTANCE + ".qumucloud.com/view/" + kuluGuid);
        } catch (Exception ex) {
            System.err.println("[ERROR]  " + file.getName() + " : " + ex.getMessage());
            ex.printStackTrace(System.err);
        }
    }

    private static boolean isVideo(File f) {
        String n = f.getName().toLowerCase(Locale.ROOT);
        return n.endsWith(".mp4") || n.endsWith(".avi") || n.endsWith(".mov") || n.endsWith(".mkv");
    }

    private static String stripExt(String name) {
        int i = name.lastIndexOf('.');
        return (i > 0) ? name.substring(0, i) : name;
    }

    private static void waitUntilStable(File f, Duration stableFor) throws InterruptedException, IOException {
        long lastSize = -1, stableMillis = 0;
        while (stableMillis < stableFor.toMillis()) {
            long size = Files.size(f.toPath());
            if (size == lastSize) {
                Thread.sleep(500);
                stableMillis += 500;
            } else {
                lastSize = size;
                stableMillis = 0;
                Thread.sleep(500);
            }
        }
    }

    private static String resolveTypeGuidOrAuto(QumuClient qumu, String guid, String title) throws IOException {
        if (guid != null && !guid.isBlank()) {
            try { return qumu.resolveTypeGuid(guid); } catch (IOException ignore) { /* try title/auto */ }
        }
        if (title != null && !title.isBlank()) {
            try { return qumu.resolveTypeGuid(title); } catch (IOException ignore) { /* try auto */ }
        }
        String autoGuid = qumu.chooseTypeGuidAuto();
        System.out.println("[INFO] No TYPE_GUID/TITLE provided. Auto-picked type GUID: " + autoGuid);
        return autoGuid;
    }

    private static String env(String k, String def) {
        String v = System.getenv(k);
        return (v == null || v.isBlank()) ? def : v;
    }
}
