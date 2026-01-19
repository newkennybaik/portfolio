package com.example.vidyoupdater.insights;

public class InsightsConfigDto {

    private String insightsUrl;
    private String portalAdminBaseUrl;
    private String adminUsername;

    public String getInsightsUrl() { return insightsUrl; }
    public void setInsightsUrl(String insightsUrl) { this.insightsUrl = insightsUrl; }

    public String getPortalAdminBaseUrl() { return portalAdminBaseUrl; }
    public void setPortalAdminBaseUrl(String portalAdminBaseUrl) { this.portalAdminBaseUrl = portalAdminBaseUrl; }

    public String getAdminUsername() { return adminUsername; }
    public void setAdminUsername(String adminUsername) { this.adminUsername = adminUsername; }
}
