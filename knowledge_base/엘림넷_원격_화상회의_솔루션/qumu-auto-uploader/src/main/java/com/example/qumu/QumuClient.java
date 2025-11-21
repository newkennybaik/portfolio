package com.example.qumu;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.entity.mime.MultipartEntityBuilder;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;

import java.io.Closeable;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

public class QumuClient implements Closeable {

    private final String baseUrl;    // https://{instance}.qumucloud.com/api/2.2/rest
    private final String authHeader; // Basic xxx
    private final CloseableHttpClient http;
    private final ObjectMapper om = new ObjectMapper();

    public QumuClient(String instance, String username, String password) {
        this.baseUrl = "https://" + instance + ".qumucloud.com/api/2.2/rest";
        String basic = Base64.getEncoder().encodeToString((username + ":" + password).getBytes(StandardCharsets.UTF_8));
        this.authHeader = "Basic " + basic;
        this.http = HttpClients.custom().build();
    }

    /* ---------- Types ---------- */

    public JsonNode listTypesRaw() throws IOException {
        String url = baseUrl + "/kulutypes";
        HttpGet get = new HttpGet(url);
        get.addHeader("Authorization", authHeader);
        get.addHeader("Accept", "application/json");
        try (CloseableHttpResponse res = http.execute(get)) {
            int code = res.getCode();
            String body = readBody(res);
            if (code < 200 || code >= 300) throw new IOException("listTypes failed: HTTP " + code + " body=" + body);
            return om.readTree(body);
        }
    }

    /** title->guid (and guid->guid so direct GUID lookup also works) */
    public Map<String, String> listTypesByTitle() throws IOException {
        JsonNode arr = listTypesRaw().path("kuluTypes");
        Map<String, String> map = new LinkedHashMap<>();
        if (arr.isArray()) {
            for (JsonNode n : arr) {
                String title = n.path("title").asText("");
                String guid  = n.path("guid").asText("");
                if (!title.isBlank() && !guid.isBlank()) map.put(title, guid);
                if (!guid.isBlank()) map.put(guid, guid);
            }
        }
        return map;
    }

    /** Resolve by exact GUID, exact title (ci), then partial title. */
    public String resolveTypeGuid(String maybeGuidOrTitle) throws IOException {
        if (maybeGuidOrTitle == null || maybeGuidOrTitle.isBlank()) {
            throw new IllegalArgumentException("Type identifier is blank");
        }
        Map<String, String> types = listTypesByTitle();
        if (types.containsKey(maybeGuidOrTitle)) return types.get(maybeGuidOrTitle);
        for (Map.Entry<String, String> e : types.entrySet()) {
            if (e.getKey().equalsIgnoreCase(maybeGuidOrTitle)) return e.getValue();
        }
        String lower = maybeGuidOrTitle.toLowerCase();
        for (Map.Entry<String, String> e : types.entrySet()) {
            if (e.getKey().toLowerCase().contains(lower)) return e.getValue();
        }
        throw new IOException("Cannot resolve Kulu Type: " + maybeGuidOrTitle);
    }

    /** Auto-pick: prefer a type that has no required metadata; otherwise first available. */
    public String chooseTypeGuidAuto() throws IOException {
        JsonNode arr = listTypesRaw().path("kuluTypes");
        String first = null;
        if (arr.isArray()) {
            for (JsonNode t : arr) {
                String guid = t.path("guid").asText("");
                if (first == null && !guid.isBlank()) first = guid;
                boolean hasRequired = false;
                for (JsonNode m : t.path("metadata")) {
                    if (m.path("required").asBoolean(false)) { hasRequired = true; break; }
                }
                if (!hasRequired && !guid.isBlank()) return guid;
            }
        }
        if (first != null) return first;
        throw new IOException("No Kulu Types available");
    }

    /* ---------- Kulu lifecycle ---------- */

    public String createKulu(String title, String typeGuid) throws IOException {
        return createKulu(title, typeGuid, null);
    }

    public String createKulu(String title, String typeGuid, JsonNode metadataArray) throws IOException {
        String url = baseUrl + "/kulus";
        HttpPost post = new HttpPost(url);
        post.addHeader("Authorization", authHeader);
        post.addHeader("Accept", "application/json");
        post.addHeader("Content-Type", "application/json");

        ObjectNode root = om.createObjectNode();
        ObjectNode kulu = root.putObject("kulu");
        kulu.put("title", title);
        ObjectNode type = kulu.putObject("type");
        type.put("guid", typeGuid);
        if (metadataArray != null && metadataArray.isArray() && metadataArray.size() > 0) {
            kulu.set("metadata", metadataArray);
        }

        post.setEntity(new StringEntity(om.writeValueAsString(root), ContentType.APPLICATION_JSON));
        try (CloseableHttpResponse res = http.execute(post)) {
            int code = res.getCode();
            String body = readBody(res);
            if (code < 200 || code >= 300) throw new IOException("createKulu failed: HTTP " + code + " body=" + body);
            JsonNode resp = om.readTree(body);
            return resp.path("kulu").path("guid").asText();
        }
    }

    public void uploadMedia(String kuluGuid, File file) throws IOException {
        String url = baseUrl + "/kulus/" + kuluGuid + "/media";
        HttpPost post = new HttpPost(url);
        post.addHeader("Authorization", authHeader);
        MultipartEntityBuilder meb = MultipartEntityBuilder.create();
        meb.addBinaryBody("file", file, ContentType.DEFAULT_BINARY, file.getName());
        post.setEntity(meb.build());
        try (CloseableHttpResponse res = http.execute(post)) {
            int code = res.getCode();
            String body = readBody(res);
            if (code < 200 || code >= 300) throw new IOException("uploadMedia failed: HTTP " + code + " body=" + body);
        }
    }

    public String getState(String kuluGuid) throws IOException {
        JsonNode k = getKulu(kuluGuid);
        return k.path("state").asText("UNKNOWN");
    }

    public JsonNode getKulu(String kuluGuid) throws IOException {
        String url = baseUrl + "/kulus/" + kuluGuid;
        HttpGet get = new HttpGet(url);
        get.addHeader("Authorization", authHeader);
        get.addHeader("Accept", "application/json");
        try (CloseableHttpResponse res = http.execute(get)) {
            int code = res.getCode();
            String body = readBody(res);
            if (code < 200 || code >= 300) throw new IOException("getKulu failed: HTTP " + code + " body=" + body);
            return om.readTree(body).path("kulu");
        }
    }

    public void publish(String kuluGuid) throws IOException {
        String url = baseUrl + "/kulus/" + kuluGuid;
        HttpPost post = new HttpPost(url);
        post.addHeader("Authorization", authHeader);
        post.addHeader("Accept", "application/json");
        post.addHeader("Content-Type", "application/json");
        String payload = "{\"kulu\":{\"state\":\"PUBLISHED\"}}";
        post.setEntity(new StringEntity(payload, ContentType.APPLICATION_JSON));
        try (CloseableHttpResponse res = http.execute(post)) {
            int code = res.getCode();
            String body = readBody(res);
            if (code < 200 || code >= 300) throw new IOException("publish failed: HTTP " + code + " body=" + body);
        }
    }

    /* ---------- util ---------- */

    private static String readBody(CloseableHttpResponse res) throws IOException {
        return res.getEntity() == null ? "" : new String(EntityUtils.toByteArray(res.getEntity()), StandardCharsets.UTF_8);
    }

    @Override public void close() throws IOException { http.close(); }

    @SuppressWarnings("unused")
    private static String escapeJson(String s) { return s.replace("\\", "\\\\").replace("\"", "\\\""); }
}
