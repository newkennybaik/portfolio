package com.example.vidyoupdater;

import java.time.LocalDateTime;

public class User {
    private Long id;
    private String username;
    private String password;

    private LocalDateTime passwordLastChanged;
    private int passwordExpireDays;
    private boolean mustChangePassword;

    private LocalDateTime lastLoginAt;
    private int failedLoginCount;
    private LocalDateTime accountLockedUntil;
    private boolean active;

    // ---- getter / setter ----
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public LocalDateTime getPasswordLastChanged() { return passwordLastChanged; }
    public void setPasswordLastChanged(LocalDateTime passwordLastChanged) { this.passwordLastChanged = passwordLastChanged; }

    public int getPasswordExpireDays() { return passwordExpireDays; }
    public void setPasswordExpireDays(int passwordExpireDays) { this.passwordExpireDays = passwordExpireDays; }

    public boolean isMustChangePassword() { return mustChangePassword; }
    public void setMustChangePassword(boolean mustChangePassword) { this.mustChangePassword = mustChangePassword; }

    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }

    public int getFailedLoginCount() { return failedLoginCount; }
    public void setFailedLoginCount(int failedLoginCount) { this.failedLoginCount = failedLoginCount; }

    public LocalDateTime getAccountLockedUntil() { return accountLockedUntil; }
    public void setAccountLockedUntil(LocalDateTime accountLockedUntil) { this.accountLockedUntil = accountLockedUntil; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
