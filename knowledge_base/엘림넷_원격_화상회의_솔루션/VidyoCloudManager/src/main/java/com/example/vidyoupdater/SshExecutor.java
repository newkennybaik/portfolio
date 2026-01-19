package com.example.vidyoupdater;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class SshExecutor {

    private static String readAll(InputStream is) throws IOException {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append("\n");
            return sb.toString();
        }
    }

    /**
     * cat file | ssh ... apiuser@IP VidyoUpload
     * ✅ 저장된 SSH 포트를 읽어서, 22가 아니면 -p <port> 자동 추가
     */
    public static String uploadWithCat(File file, String sshKey, String ip)
            throws IOException, InterruptedException {

        if (file == null || !file.exists()) throw new IllegalArgumentException("file not found");
        if (sshKey == null || sshKey.isBlank()) throw new IllegalArgumentException("sshKey is empty");
        if (ip == null || ip.isBlank()) throw new IllegalArgumentException("ip is empty");

        int port = SshPortStore.getPort();

        String filePath = file.getAbsolutePath();

        StringBuilder cmdLine = new StringBuilder();
        cmdLine.append("cat ")
                .append(shellQuote(filePath))
                .append(" | ssh ")
                .append(buildPortOpt(port))
                .append(" -i ")
                .append(shellQuote(sshKey))
                .append(" -o StrictHostKeyChecking=no")
                .append(" -o UserKnownHostsFile=/dev/null")
                .append(" -o PubkeyAcceptedAlgorithms=+ssh-rsa")
                .append(" -o HostkeyAlgorithms=+ssh-rsa")
                .append(" apiuser@")
                .append(ip)
                .append(" VidyoUpload");

        return runBash(cmdLine.toString());
    }

    /**
     * echo -n 'password' | ssh ... apiuser@IP SSL_InstallPFX
     * ✅ 저장된 SSH 포트를 읽어서, 22가 아니면 -p <port> 자동 추가
     */
    public static String runSslInstallPfx(String sshKey, String ip, String password)
            throws IOException, InterruptedException {

        if (sshKey == null || sshKey.isBlank()) throw new IllegalArgumentException("sshKey is empty");
        if (ip == null || ip.isBlank()) throw new IllegalArgumentException("ip is empty");
        if (password == null) password = "";

        int port = SshPortStore.getPort();

        StringBuilder cmdLine = new StringBuilder();
        cmdLine.append("echo -n ")
                .append(shellQuote(password))
                .append(" | ssh ")
                .append(buildPortOpt(port))
                .append(" -i ")
                .append(shellQuote(sshKey))
                .append(" -o StrictHostKeyChecking=no")
                .append(" -o UserKnownHostsFile=/dev/null")
                .append(" -o PubkeyAcceptedAlgorithms=+ssh-rsa")
                .append(" -o HostkeyAlgorithms=+ssh-rsa")
                .append(" apiuser@")
                .append(ip)
                .append(" SSL_InstallPFX");

        return runBash(cmdLine.toString());
    }

    /**
     * (EVENT ONLY) echo -n 'password' | ssh ... apiuser@IP VidyoEventService createKeystore
     * ✅ 저장된 SSH 포트를 읽어서, 22가 아니면 -p <port> 자동 추가
     */
    public static String runEventCreateKeystore(String sshKey, String ip, String password)
            throws IOException, InterruptedException {

        if (sshKey == null || sshKey.isBlank()) throw new IllegalArgumentException("sshKey is empty");
        if (ip == null || ip.isBlank()) throw new IllegalArgumentException("ip is empty");
        if (password == null) password = "";

        int port = SshPortStore.getPort();

        StringBuilder cmdLine = new StringBuilder();
        cmdLine.append("echo -n ")
                .append(shellQuote(password))
                .append(" | ssh ")
                .append(buildPortOpt(port))
                .append(" -i ")
                .append(shellQuote(sshKey))
                .append(" -o StrictHostKeyChecking=no")
                .append(" -o UserKnownHostsFile=/dev/null")
                .append(" -o PubkeyAcceptedAlgorithms=+ssh-rsa")
                .append(" -o HostkeyAlgorithms=+ssh-rsa")
                .append(" apiuser@")
                .append(ip)
                .append(" VidyoEventService createKeystore");

        return runBash(cmdLine.toString());
    }

    /**
     * ssh ... apiuser@IP <remoteCmd>
     * ✅ 저장된 SSH 포트를 읽어서, 22가 아니면 -p <port> 자동 추가
     */
    public static String runRemoteSimple(String sshKey, String ip, String remoteCmd)
            throws IOException, InterruptedException {

        if (sshKey == null || sshKey.isBlank()) throw new IllegalArgumentException("sshKey is empty");
        if (ip == null || ip.isBlank()) throw new IllegalArgumentException("ip is empty");
        if (remoteCmd == null || remoteCmd.isBlank()) throw new IllegalArgumentException("remoteCmd is empty");

        int port = SshPortStore.getPort();

        StringBuilder cmdLine = new StringBuilder();
        cmdLine.append("ssh ")
                .append(buildPortOpt(port))
                .append(" -i ")
                .append(shellQuote(sshKey))
                .append(" -o StrictHostKeyChecking=no")
                .append(" -o UserKnownHostsFile=/dev/null")
                .append(" -o PubkeyAcceptedAlgorithms=+ssh-rsa")
                .append(" -o HostkeyAlgorithms=+ssh-rsa")
                .append(" apiuser@")
                .append(ip)
                .append(" ")
                .append(remoteCmd);

        return runBash(cmdLine.toString());
    }

    /**
     * ssh ... apiuser@IP VidyoUpdate
     * ✅ 저장된 SSH 포트를 읽어서, 22가 아니면 -p <port> 자동 추가
     */
    public static String runVidyoUpdate(String sshKey, String ip)
            throws IOException, InterruptedException {

        if (sshKey == null || sshKey.isBlank()) throw new IllegalArgumentException("sshKey is empty");
        if (ip == null || ip.isBlank()) throw new IllegalArgumentException("ip is empty");

        int port = SshPortStore.getPort();

        StringBuilder cmdLine = new StringBuilder();
        cmdLine.append("ssh ")
                .append(buildPortOpt(port))
                .append(" -i ")
                .append(shellQuote(sshKey))
                .append(" -o StrictHostKeyChecking=no")
                .append(" -o UserKnownHostsFile=/dev/null")
                .append(" -o PubkeyAcceptedAlgorithms=+ssh-rsa")
                .append(" -o HostkeyAlgorithms=+ssh-rsa")
                .append(" apiuser@")
                .append(ip)
                .append(" VidyoUpdate");

        return runBash(cmdLine.toString());
    }

    private static String buildPortOpt(int port) {
        // ✅ 포트가 22면 옵션 생략
        if (port <= 0 || port == 22) return "";
        return "-p " + port;
    }

    private static String runBash(String cmd) throws IOException, InterruptedException {
        List<String> args = new ArrayList<>();
        args.add("/bin/bash");
        args.add("-lc");
        args.add(cmd);

        ProcessBuilder pb = new ProcessBuilder(args);
        pb.redirectErrorStream(true);

        Process p = pb.start();
        String out = readAll(p.getInputStream());
        int exit = p.waitFor();

        return out + "\nEXIT_CODE=" + exit + "\n";
    }

    private static String shellQuote(String s) {
        if (s == null) return "''";
        return "'" + s.replace("'", "'\"'\"'") + "'";
    }
}
