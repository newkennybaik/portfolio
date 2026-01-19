package com.example.vidyoupdater.insights;

public class LicenseFeatureDto {

    private String name;
    private String maxValue;
    private String currentValue;

    public LicenseFeatureDto() {}

    public LicenseFeatureDto(String name, String maxValue, String currentValue) {
        this.name = name;
        this.maxValue = maxValue;
        this.currentValue = currentValue;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getMaxValue() { return maxValue; }
    public void setMaxValue(String maxValue) { this.maxValue = maxValue; }

    public String getCurrentValue() { return currentValue; }
    public void setCurrentValue(String currentValue) { this.currentValue = currentValue; }
}
