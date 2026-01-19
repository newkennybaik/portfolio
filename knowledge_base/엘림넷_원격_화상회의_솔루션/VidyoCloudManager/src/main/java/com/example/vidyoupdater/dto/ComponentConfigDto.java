package com.example.vidyoupdater.dto;

import java.util.List;

public class ComponentConfigDto {

    // "portal" / "router" / "replay" / ...
    private String component;

    // IP / FQDN 문자열 목록
    private List<String> ips;

    // 동시 실행 제한 (옵션, null 허용)
    private Integer concurrencyLimit;

    public ComponentConfigDto() {
    }

    public ComponentConfigDto(String component, List<String> ips, Integer concurrencyLimit) {
        this.component = component;
        this.ips = ips;
        this.concurrencyLimit = concurrencyLimit;
    }

    // ---------- getters / setters ----------

    public String getComponent() {
        return component;
    }

    public void setComponent(String component) {
        this.component = component;
    }

    public List<String> getIps() {
        return ips;
    }

    public void setIps(List<String> ips) {
        this.ips = ips;
    }

    public Integer getConcurrencyLimit() {
        return concurrencyLimit;
    }

    public void setConcurrencyLimit(Integer concurrencyLimit) {
        this.concurrencyLimit = concurrencyLimit;
    }
}
