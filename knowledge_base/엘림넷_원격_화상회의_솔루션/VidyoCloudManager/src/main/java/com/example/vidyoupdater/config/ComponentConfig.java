package com.example.vidyoupdater.config;

public class ComponentConfig {

    private Long id;
    private String component;       // portal / router / replay / event / insights / gateway ...
    private String ipList;          // "192.168.0.100\n192.168.0.101"
    private int concurrencyLimit;   // 동시 실행 제한 (ex. 4)

    public ComponentConfig() {
    }

    public ComponentConfig(Long id, String component, String ipList, int concurrencyLimit) {
        this.id = id;
        this.component = component;
        this.ipList = ipList;
        this.concurrencyLimit = concurrencyLimit;
    }

    // --- getters / setters ---

    public Long getId() {
        return id;
    }

    public String getComponent() {
        return component;
    }

    public String getIpList() {
        return ipList;
    }

    public int getConcurrencyLimit() {
        return concurrencyLimit;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setComponent(String component) {
        this.component = component;
    }

    public void setIpList(String ipList) {
        this.ipList = ipList;
    }

    public void setConcurrencyLimit(int concurrencyLimit) {
        this.concurrencyLimit = concurrencyLimit;
    }
}
