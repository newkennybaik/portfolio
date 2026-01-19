package com.example.vidyoupdater.insights;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InsightsConfigService {

    private final JdbcTemplate jdbcTemplate;

    public InsightsConfigService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public InsightsConfig loadConfig() {

        List<InsightsConfig> list = jdbcTemplate.query(
                "SELECT id, insights_url, portal_admin_base_url, admin_username, admin_password " +
                        "FROM insights_config WHERE id = 1",
                (rs, rowNum) -> {
                    InsightsConfig c = new InsightsConfig();
                    c.setId(rs.getLong("id"));
                    c.setInsightsUrl(rs.getString("insights_url"));
                    c.setPortalAdminBaseUrl(rs.getString("portal_admin_base_url"));
                    c.setAdminUsername(rs.getString("admin_username"));
                    c.setAdminPassword(rs.getString("admin_password"));
                    return c;
                }
        );

        return list.isEmpty() ? new InsightsConfig() : list.get(0);
    }

    public void saveConfig(InsightsConfigUpdateRequest req) {

        InsightsConfig current = loadConfig();

        String insightsUrl = nullIfBlank(req.getInsightsUrl());
        String baseUrl     = nullIfBlank(req.getPortalAdminBaseUrl());
        String adminUser   = nullIfBlank(req.getAdminUsername());

        String newPassword = req.getAdminPassword();
        String finalPassword =
                isBlank(newPassword) ? current.getAdminPassword() : newPassword;

        int updated = jdbcTemplate.update(
                "UPDATE insights_config " +
                        "SET insights_url = ?, portal_admin_base_url = ?, " +
                        "    admin_username = ?, admin_password = ? " +
                        "WHERE id = 1",
                insightsUrl, baseUrl, adminUser, finalPassword
        );

        if (updated == 0) {
            jdbcTemplate.update(
                    "INSERT INTO insights_config " +
                            "(id, insights_url, portal_admin_base_url, admin_username, admin_password) " +
                            "VALUES (1, ?, ?, ?, ?)",
                    insightsUrl, baseUrl, adminUser, finalPassword
            );
        }
    }

    private String nullIfBlank(String s) {
        return isBlank(s) ? null : s.trim();
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
