package com.example.vidyoupdater.insights;

public class InsightsConfig {
    private Long id;
    private String insightsUrl;
    private String portalAdminBaseUrl; // “Super URL” 저장
    private String adminUsername;
    private String adminPassword;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInsightsUrl() { return insightsUrl; }
    public void setInsightsUrl(String insightsUrl) { this.insightsUrl = insightsUrl; }

    public String getPortalAdminBaseUrl() { return portalAdminBaseUrl; }
    public void setPortalAdminBaseUrl(String portalAdminBaseUrl) { this.portalAdminBaseUrl = portalAdminBaseUrl; }

    public String getAdminUsername() { return adminUsername; }
    public void setAdminUsername(String adminUsername) { this.adminUsername = adminUsername; }

    public String getAdminPassword() { return adminPassword; }
    public void setAdminPassword(String adminPassword) { this.adminPassword = adminPassword; }
}
