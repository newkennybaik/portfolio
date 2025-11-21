package com.example.qumu;

import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.cookie.BasicCookieStore;
import org.apache.hc.client5.http.entity.UrlEncodedFormEntity;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.NameValuePair;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.http.message.BasicNameValuePair;

import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.DocumentBuilder;
import org.w3c.dom.*;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * VidyoReplay 포털 세션을 만들고 RecordsSearch SOAP 호출을 수행.
 * - 로그인 흐름: GET /replay/login.html -> CSRF 토큰 추출 -> POST /replay/recordings_security_check
 * - 이후 쿠키(JSESSIONID/REPLAYSID) 유지한 채 SOAP 호출
 */
public class VidyoReplayClient implements AutoCloseable {

    private final String base;      // 예: "https://wreplay03.nownnow.com"
    private final String user;      // 예: "super"
    private final String pass;      // 예: "password"
    private final BasicCookieStore cookieStore = new BasicCookieStore();
    private final CloseableHttpClient http;

    // 네임스페이스 상수
    private static final String NS_API = "http://replay.vidyo.com/apiservice";

    public VidyoReplayClient(String baseUrl, String username, String password) {
        this.base = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length()-1) : baseUrl;
        this.user = username;
        this.pass = password;
        this.http = HttpClients.custom()
                .setDefaultCookieStore(cookieStore) // 쿠키 유지
                .build();
    }

    /** 로그인 페이지에서 CSRF 토큰 추출 후, 로그인 POST. */
    public void login() throws Exception {
        final String loginHtmlUrl = base + "/replay/login.html";

        // 1) login.html GET
        String html;
        HttpGet get = new HttpGet(loginHtmlUrl);
        try (CloseableHttpResponse res = http.execute(get)) {
            int code = res.getCode();
            html = readBody(res);
            if (code < 200 || code >= 300) {
                throw new IllegalStateException("GET login.html failed: HTTP " + code);
            }
        }

        // 2) CSRF 추출 (둘 다 시도: 스크립트 변수 or hidden input)
        String csrf = extractCsrf(html);
        if (csrf == null || csrf.isBlank()) {
            throw new IllegalStateException("CSRF token not found on login.html");
        }

        // 3) 로그인 POST (x-www-form-urlencoded)
        List<NameValuePair> form = new ArrayList<>();
        form.add(new BasicNameValuePair("username", user));
        form.add(new BasicNameValuePair("password", pass));
        form.add(new BasicNameValuePair("_csrf", csrf));

        HttpPost post = new HttpPost(base + "/replay/recordings_security_check");
        post.addHeader("Accept", "text/html");
        post.setEntity(new UrlEncodedFormEntity(form, StandardCharsets.UTF_8));

        try (CloseableHttpResponse res = http.execute(post)) {
            int code = res.getCode();
            String body = readBody(res);
            if (code < 200 || code >= 300) {
                throw new IllegalStateException("Login failed: HTTP " + code + " body=" + body);
            }
            // 성공 시 쿠키 저장됨(JSESSIONID/REPLAYSID)
        }
    }

    /** GUID로 제목을 찾는다. 못 찾으면 Optional.empty(). */
    public Optional<String> findTitleByGuid(String guid) throws Exception {
        int start = 0;
        final int limit = 200;

        while (true) {
            String soap = buildRecordsSearchEnvelope(limit, start);
            String xml  = doSoapRecordsSearch(soap);

            // 파싱해서 해당 guid의 title 찾기
            Optional<String> hit = extractTitleFromRecords(xml, guid);
            if (hit.isPresent()) return hit;

            // 다음 페이지 여부 판단: records 개수 < limit 이면 종료
            int count = countRecords(xml);
            if (count < limit) break;
            start += limit;
        }
        return Optional.empty();
    }

    private String buildRecordsSearchEnvelope(int limit, int start) {
        return """
            <?xml version="1.0" encoding="UTF-8"?>
            <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                           xmlns:api="http://replay.vidyo.com/apiservice">
              <soap:Body>
                <api:RecordsSearchRequest>
                  <api:tenantName></api:tenantName>
                  <api:roomFilter></api:roomFilter>
                  <api:usernameFilter></api:usernameFilter>
                  <api:query></api:query>
                  <api:recordScope>all</api:recordScope>
                  <api:sortBy>date</api:sortBy>
                  <api:dir>DESC</api:dir>
                  <api:limit>%d</api:limit>
                  <api:start>%d</api:start>
                  <api:webcast>false</api:webcast>
                  <api:returnAudioFilesSize>false</api:returnAudioFilesSize>
                  <api:returnVideoFilesSize>false</api:returnVideoFilesSize>
                </api:RecordsSearchRequest>
              </soap:Body>
            </soap:Envelope>
            """.formatted(limit, start);
    }

    private String doSoapRecordsSearch(String envelope) throws Exception {
        String url = base + "/replay/services/VidyoReplayContentManagementService";
        HttpPost post = new HttpPost(url);
        post.addHeader("Content-Type", "text/xml; charset=UTF-8");
        post.addHeader("Accept", "text/xml");
        post.addHeader("SOAPAction", "\"RecordsSearch\"");
        post.setEntity(new StringEntity(envelope,
                ContentType.create("text/xml", StandardCharsets.UTF_8)));

        try (CloseableHttpResponse res = http.execute(post)) {
            String body = readBody(res);
            int code = res.getCode();
            if (code < 200 || code >= 300) {
                throw new IllegalStateException("RecordsSearch failed: HTTP " + code + " body=" + body);
            }
            return body;
        }
    }

    /** records 블록의 개수(페이지네이션 판단용) */
    private int countRecords(String xml) throws Exception {
        Document doc = parse(xml);
        NodeList list = doc.getElementsByTagNameNS(NS_API, "records");
        return list == null ? 0 : list.getLength();
    }

    /** 특정 GUID의 title 추출 */
    private Optional<String> extractTitleFromRecords(String xml, String targetGuid) throws Exception {
        Document doc = parse(xml);
        NodeList list = doc.getElementsByTagNameNS(NS_API, "records");
        for (int i = 0; i < list.getLength(); i++) {
            Element rec = (Element) list.item(i);
            String guid = text(rec, "guid");
            if (guid != null && guid.equalsIgnoreCase(targetGuid)) {
                return Optional.ofNullable(text(rec, "title"));
            }
        }
        return Optional.empty();
    }

    private Document parse(String xml) throws Exception {
        DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
        f.setNamespaceAware(true);
        DocumentBuilder b = f.newDocumentBuilder();
        return b.parse(new java.io.ByteArrayInputStream(xml.getBytes(StandardCharsets.UTF_8)));
    }

    private String text(Element parent, String localName) {
        NodeList nl = parent.getElementsByTagNameNS(NS_API, localName);
        if (nl == null || nl.getLength() == 0) return null;
        Node n = nl.item(0);
        return n.getTextContent();
    }

    private static String extractCsrf(String html) {
        // 1) JS 변수 패턴: var csrfToken = '...';
        Matcher m = Pattern.compile("var\\s+csrfToken\\s*=\\s*'([A-Za-z0-9\\-]+)'")
                .matcher(html);
        if (m.find()) return m.group(1);

        // 2) hidden input 패턴: name="_csrf" value="..."
        m = Pattern.compile("name=[\"']_csrf[\"'][^>]*value=[\"']([^\"']+)[\"']",
                Pattern.CASE_INSENSITIVE).matcher(html);
        if (m.find()) return m.group(1);

        return null;
    }

    private static String readBody(CloseableHttpResponse res) throws Exception {
        return res.getEntity() == null ? "" :
                new String(EntityUtils.toByteArray(res.getEntity()), StandardCharsets.UTF_8);
    }

    @Override public void close() throws Exception {
        http.close();
    }
}
