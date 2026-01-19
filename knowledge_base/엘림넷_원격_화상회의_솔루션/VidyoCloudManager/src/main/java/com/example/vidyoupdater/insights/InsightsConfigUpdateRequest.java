package com.example.vidyoupdater.insights;

public class InsightsConfigUpdateRequest {

    private String insightsUrl;
    private String portalAdminBaseUrl;
    private String adminUsername;
    private String adminPassword; // 비어 있으면 기존값 유지

    public String getInsightsUrl() { return insightsUrl; }
    public void setInsightsUrl(String insightsUrl) { this.insightsUrl = insightsUrl; }

    public String getPortalAdminBaseUrl() { return portalAdminBaseUrl; }
    public void setPortalAdminBaseUrl(String portalAdminBaseUrl) { this.portalAdminBaseUrl = portalAdminBaseUrl; }

    public String getAdminUsername() { return adminUsername; }
    public void setAdminUsername(String adminUsername) { this.adminUsername = adminUsername; }

    public String getAdminPassword() { return adminPassword; }
    public void setAdminPassword(String adminPassword) { this.adminPassword = adminPassword; }
}
