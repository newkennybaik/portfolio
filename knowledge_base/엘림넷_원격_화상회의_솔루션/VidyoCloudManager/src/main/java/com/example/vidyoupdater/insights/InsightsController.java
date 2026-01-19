package com.example.vidyoupdater.insights;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/insights")
public class InsightsController {

    private final InsightsConfigService configService;
    private final RestTemplate restTemplate = new RestTemplate();

    public InsightsController(InsightsConfigService configService) {
        this.configService = configService;
    }

    /**
     * 설정 조회
     */
    @GetMapping("/config")
    public InsightsConfigDto getConfig() {
        InsightsConfig cfg = configService.loadConfig();
        InsightsConfigDto dto = new InsightsConfigDto();
        dto.setInsightsUrl(cfg.getInsightsUrl());
        dto.setPortalAdminBaseUrl(cfg.getPortalAdminBaseUrl());
        dto.setAdminUsername(cfg.getAdminUsername());
        return dto;
    }

    /**
     * 설정 저장
     */
    @PutMapping("/config")
    public ResponseEntity<Void> updateConfig(@RequestBody InsightsConfigUpdateRequest req) {

        if (isBlank(req.getPortalAdminBaseUrl()) || isBlank(req.getAdminUsername())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "VidyoPortal Super URL과 Super Admin Username은 필수입니다."
            );
        }

        configService.saveConfig(req);
        return ResponseEntity.ok().build();
    }

    /**
     * 라이선스 데이터 조회
     *  - VidyoPortalSuperService / GetLicenseDataRequest 사용
     */
    @GetMapping("/license")
    public List<LicenseFeatureDto> getLicenseData() throws Exception {
        InsightsConfig cfg = configService.loadConfig();

        if (isBlank(cfg.getPortalAdminBaseUrl())
                || isBlank(cfg.getAdminUsername())
                || isBlank(cfg.getAdminPassword())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "VidyoPortal Super URL / Super Admin Username / Super Admin Password가 설정되어 있지 않습니다."
            );
        }

        // portalAdminBaseUrl 에는 "https://vp.example.com/super" 또는 "https://vp.example.com" 이 온다고 가정
        String superUrl = cfg.getPortalAdminBaseUrl().trim();
        superUrl = removeTrailingSlash(superUrl);

        String suffix = "/super";
        String baseUrl;
        if (superUrl.toLowerCase().endsWith(suffix)) {
            baseUrl = superUrl.substring(0, superUrl.length() - suffix.length());
        } else {
            baseUrl = superUrl;
        }

        // *** 새 SuperService 엔드포인트 ***
        String endpoint = baseUrl + "/services/VidyoPortalSuperService/";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_XML);
        headers.setBasicAuth(cfg.getAdminUsername(), cfg.getAdminPassword(), StandardCharsets.UTF_8);
        headers.set("Accept", "text/xml");
        // SuperService SOAPAction
        headers.add("SOAPAction", "getLicenseData");

        // *** 새 SuperAPI SOAP Body ***
        String body =
                "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
                        "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\">\n" +
                        "  <soap:Body>\n" +
                        "    <tns:GetLicenseDataRequest xmlns:tns=\"http://portal.vidyo.com/superapi/\">\n" +
                        "    </tns:GetLicenseDataRequest>\n" +
                        "  </soap:Body>\n" +
                        "</soap:Envelope>";

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> resp;
        try {
            resp = restTemplate.postForEntity(endpoint, request, String.class);
        } catch (HttpClientErrorException e) {
            // Portal 쪽에서 403/401 등 반환 시 여기로 들어옴
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "VidyoPortalSuperService(GetLicenseData) 호출 실패: HTTP " + e.getStatusCode().value()
            );
        }

        if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "VidyoPortalSuperService(GetLicenseData) 호출 실패: HTTP " + resp.getStatusCode().value()
            );
        }

        return parseLicenseFeatures(resp.getBody());
    }

    /**
     * SOAP 응답 XML -> LicenseFeatureDto 목록 변환
     *  - SuperAPI 응답 구조:
     *    <licenseFeature>
     *       <name>...</name>
     *       <maxValue>...</maxValue>
     *       <currentValue>...</currentValue> (없을 수도 있음)
     *    </licenseFeature>
     */
    private List<LicenseFeatureDto> parseLicenseFeatures(String xml) throws Exception {
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();

        Document doc = builder.parse(new InputSource(new StringReader(xml)));

        // 소문자 licenseFeature / name / maxValue / currentValue
        NodeList features = doc.getElementsByTagNameNS("*", "licenseFeature");
        List<LicenseFeatureDto> result = new ArrayList<>();

        for (int i = 0; i < features.getLength(); i++) {
            Element el = (Element) features.item(i);

            String name = getChildText(el, "name");
            String maxValue = getChildText(el, "maxValue");
            String currentValue = getChildText(el, "currentValue");

            result.add(new LicenseFeatureDto(name, maxValue, currentValue));
        }

        return result;
    }

    private String getChildText(Element parent, String localName) {
        NodeList list = parent.getElementsByTagNameNS("*", localName);
        if (list.getLength() == 0) return "";
        return list.item(0).getTextContent();
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private String removeTrailingSlash(String s) {
        if (s == null) return null;
        if (s.endsWith("/")) {
            return s.substring(0, s.length() - 1);
        }
        return s;
    }
}
