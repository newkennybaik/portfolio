package com.example.vidyoupdater.config;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ComponentConfigService {

    private final JdbcTemplate jdbcTemplate;

    public ComponentConfigService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * 컴포넌트별 IP 목록 조회
     * DB 구조: component_config.ip_list 에
     *   "192.168.0.100\n192.168.0.101" 또는
     *   실제 줄바꿈 포함 문자열이 들어있을 수 있음.
     *
     * 반환: ["192.168.0.100", "192.168.0.101"]
     */
    public List<String> getIpsForComponent(String component) {
        String sql = "SELECT ip_list FROM component_config " +
                     "WHERE component = ? LIMIT 1";

        List<String> result = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> rs.getString("ip_list"),
                component
        );

        String ipList = result.stream().findFirst().orElse(null);
        if (ipList == null || ipList.isBlank()) {
            return Collections.emptyList();
        }

        // 1) schema.sql 에서 들어간 "192.168.0.100\n192.168.0.101"
        //    같은 리터럴을 실제 줄바꿈으로 변환
        //    (백슬래시-엔 → 개행)
        ipList = ipList.replace("\\r\\n", "\n")
                       .replace("\\n", "\n")
                       .replace("\\r", "\n");

        // 2) 줄바꿈 기준으로 split
        return Arrays.stream(ipList.split("\\r?\\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * 컴포넌트별 동시 실행 제한값 조회 (없으면 0)
     */
    public int getConcurrencyLimitForComponent(String component) {
        String sql = "SELECT concurrency_limit FROM component_config " +
                     "WHERE component = ? LIMIT 1";

        return jdbcTemplate.query(
                        sql,
                        (rs, rowNum) -> rs.getInt("concurrency_limit"),
                        component
                )
                .stream()
                .findFirst()
                .orElse(0);
    }

    /**
     * IP & 동시 실행 제한 저장
     *
     * - component 별로 1 row
     * - ip_list 에는 "ip1\nip2\nip3" 형태(실제 줄바꿈)로 저장
     */
    @Transactional
    public void saveComponentConfig(String component,
                                    List<String> ips,
                                    int concurrencyLimit) {

        // 기존 레코드 삭제
        jdbcTemplate.update(
                "DELETE FROM component_config WHERE component = ?",
                component
        );

        if (ips == null || ips.isEmpty()) {
            // 저장할 IP 없으면 여기서 종료
            return;
        }

        // limit <= 0 이면 기본값: 서버 개수 또는 최소 1
        int limit = (concurrencyLimit > 0)
                ? concurrencyLimit
                : (ips.size() > 0 ? ips.size() : 1);

        // List<String> -> 실제 줄바꿈 포함 "ip1\nip2\nip3"
        String ipListStr = ips.stream()
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.joining("\n"));

        String insertSql =
                "INSERT INTO component_config (component, ip_list, concurrency_limit) " +
                "VALUES (?, ?, ?)";

        jdbcTemplate.update(insertSql, component, ipListStr, limit);
    }
}
