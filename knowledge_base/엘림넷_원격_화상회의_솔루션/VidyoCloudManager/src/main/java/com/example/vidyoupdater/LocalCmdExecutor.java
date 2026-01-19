package com.example.vidyoupdater;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

public class LocalCmdExecutor {

    // 반환 문자열에 EXIT_CODE= 을 마지막에 붙여서 SslInstallService.extractExitCode()가 그대로 쓰도록 맞춤
    public static String run(String cmd) {
        StringBuilder sb = new StringBuilder();
        int exit;

        try {
            ProcessBuilder pb = new ProcessBuilder("bash", "-lc", cmd);
            pb.redirectErrorStream(true);

            Process p = pb.start();

            try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line).append("\n");
                }
            }

            exit = p.waitFor();
        } catch (Exception e) {
            sb.append("ERROR: ").append(e.getMessage()).append("\n");
            exit = 999;
        }

        sb.append("EXIT_CODE=").append(exit).append("\n");
        return sb.toString();
    }
}
