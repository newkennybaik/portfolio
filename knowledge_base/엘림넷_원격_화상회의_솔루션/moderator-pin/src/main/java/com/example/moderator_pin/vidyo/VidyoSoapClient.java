package com.example.moderator_pin.vidyo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.w3c.dom.*;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

@Component
public class VidyoSoapClient {

    @Value("${vidyo.portal-url}")
    private String portalUrl;

    @Value("${vidyo.username}")
    private String username;

    @Value("${vidyo.password}")
    private String password;

    private final RestTemplate restTemplate = new RestTemplate();

    /* ===================== public API ===================== */

    // username 기준 PIN 생성
    public String createModeratorPinByUsername(String userName, String pin) {
        String roomId = findRoomIdByUsername(userName);
        if (roomId == null) {
            return "Room not found for username=" + userName;
        }
        return createModeratorPin(roomId, pin);
    }

    // username 기준 PIN 제거
    public String removeModeratorPinByUsername(String userName) {
        String roomId = findRoomIdByUsername(userName);
        if (roomId == null) {
            return "Room not found for username=" + userName;
        }
        return removeModeratorPin(roomId);
    }

    /* =============== Create / Remove by roomID ================= */

    public String createModeratorPin(String roomId, String pin) {
        String xml = """
                <?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                  <soap:Body>
                    <tns:CreateModeratorPINRequest xmlns:tns="http://portal.vidyo.com/admin/v1_1">
                      <tns:roomID>%s</tns:roomID>
                      <tns:PIN>%s</tns:PIN>
                    </tns:CreateModeratorPINRequest>
                  </soap:Body>
                </soap:Envelope>
                """.formatted(roomId, pin);

        // Vidyo WSDL 기준 Operation 이름
        return call(xml, "createRoomModeratorPIN");
    }

    public String removeModeratorPin(String roomId) {
        String xml = """
                <?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                  <soap:Body>
                    <tns:RemoveModeratorPINRequest xmlns:tns="http://portal.vidyo.com/admin/v1_1">
                      <tns:roomID>%s</tns:roomID>
                    </tns:RemoveModeratorPINRequest>
                  </soap:Body>
                </soap:Envelope>
                """.formatted(roomId);

        return call(xml, "removeRoomModeratorPIN");
    }

    /* =============== username -> roomID 조회 (GetRooms) ================= */

    private String findRoomIdByUsername(String userName) {
        String xml = """
                <?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
                  <soap:Body>
                    <tns:GetRoomsRequest xmlns:tns="http://portal.vidyo.com/admin/v1_1">
                      <tns:Filter>
                        <tns:start>0</tns:start>
                        <tns:limit>200</tns:limit>
                        <tns:sortBy>name</tns:sortBy>
                        <tns:dir>ASC</tns:dir>
                        <tns:query>%s</tns:query>
                      </tns:Filter>
                    </tns:GetRoomsRequest>
                  </soap:Body>
                </soap:Envelope>
                """.formatted(userName);

        // SOAPAction 이름은 WSDL 문서 기준(getRooms, GetRooms 등) 실제 값에 맞춰 조정
        String response = call(xml, "getRooms");

        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(
                    new ByteArrayInputStream(response.getBytes(StandardCharsets.UTF_8)));

            NodeList roomNodes = doc.getElementsByTagNameNS("*", "room");
            if (roomNodes.getLength() == 0) {
                // namespace 없는 경우 대비
                roomNodes = doc.getElementsByTagName("room");
            }

            for (int i = 0; i < roomNodes.getLength(); i++) {
                Node roomNode = roomNodes.item(i);
                NodeList children = roomNode.getChildNodes();
                String ownerName = null;
                String roomId = null;
                String name = null;

                for (int j = 0; j < children.getLength(); j++) {
                    Node child = children.item(j);
                    String localName = child.getLocalName() != null
                            ? child.getLocalName()
                            : child.getNodeName();

                    if ("ownerName".equals(localName)) {
                        ownerName = child.getTextContent().trim();
                    } else if ("roomID".equals(localName)) {
                        roomId = child.getTextContent().trim();
                    } else if ("name".equals(localName)) {
                        name = child.getTextContent().trim();
                    }
                }

                // ownerName 또는 name 이 username 과 매칭되면 사용
                if (roomId != null &&
                        (userName.equalsIgnoreCase(ownerName) || userName.equalsIgnoreCase(name))) {
                    return roomId;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }

        return null;
    }

    /* ==================== 내부 SOAP 공통 호출 ==================== */

    private String call(String xml, String action) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_XML);
        headers.setBasicAuth(username, password);
        if (action != null && !action.isEmpty()) {
            headers.add("SOAPAction", action);
        }
        headers.add("Accept", "text/xml");

        HttpEntity<String> entity = new HttpEntity<>(xml, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    portalUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );
            return response.getBody();
        } catch (HttpStatusCodeException e) {
            return "HTTP error from Vidyo: " + e.getStatusCode() + "\n" +
                    e.getResponseBodyAsString();
        } catch (ResourceAccessException e) {
            return "Connection error: " + e.getMessage();
        } catch (Exception e) {
            return "Unexpected error: " + e.getMessage();
        }
    }
}
