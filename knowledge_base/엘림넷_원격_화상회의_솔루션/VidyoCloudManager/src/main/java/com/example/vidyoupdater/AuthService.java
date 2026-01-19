package com.example.vidyoupdater;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.sqlite.SQLiteException;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final JdbcTemplate jdbcTemplate;

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final ZoneId ZONE = ZoneOffset.UTC;

    public AuthService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final RowMapper<User> USER_MAPPER = new RowMapper<>() {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User u = new User();
            u.setId(rs.getLong("id"));
            u.setUsername(rs.getString("username"));
            u.setPassword(rs.getString("password"));

            String plc = rs.getString("password_last_changed");
            if (plc != null) {
                u.setPasswordLastChanged(LocalDateTime.parse(plc, FMT));
            }

            u.setPasswordExpireDays(rs.getInt("password_expire_days"));
            u.setMustChangePassword(rs.getInt("must_change_password") == 1);

            String lastLogin = rs.getString("last_login_at");
            if (lastLogin != null) {
                u.setLastLoginAt(LocalDateTime.parse(lastLogin, FMT));
            }

            u.setFailedLoginCount(rs.getInt("failed_login_count"));

            String lockedUntil = rs.getString("account_locked_until");
            if (lockedUntil != null) {
                u.setAccountLockedUntil(LocalDateTime.parse(lockedUntil, FMT));
            }

            u.setActive(rs.getInt("is_active") == 1);
            return u;
        }
    };

    public Optional<User> findByUsername(String username) {
        String sql = "SELECT * FROM users WHERE username = ?";
        return jdbcTemplate.query(sql, USER_MAPPER, username)
                .stream().findFirst();
    }

    /**
     * SQLite BUSY(SNAPSHOT 포함) 이면 몇 번 재시도하고,
     * 그래도 안 되면 0 리턴하고 예외는 위로 안 올림.
     * (로그인 플로우 끊기지 않게 하기 위함)
     */
    private int updateWithRetry(String sql, Object... args) {
        int maxAttempts = 5;
        int attempt = 0;

        while (true) {
            try {
                return jdbcTemplate.update(sql, args);
            } catch (DataAccessException e) {
                Throwable root = e.getRootCause();

                // SQLITE_BUSY / SQLITE_BUSY_SNAPSHOT 둘 다 문자열에 포함됨
                if (root instanceof SQLiteException &&
                        root.getMessage() != null &&
                        root.getMessage().contains("SQLITE_BUSY")) {

                    attempt++;
                    if (attempt >= maxAttempts) {
                        log.warn("[AuthService] SQLite BUSY: sql=[{}], attempts={} -> 포기 (로그인 흐름은 계속 진행)",
                                sql, attempt);
                        return 0;
                    }

                    log.warn("[AuthService] SQLite BUSY: sql=[{}], attempt {}/{} -> 재시도",
                            sql, attempt, maxAttempts);

                    try {
                        Thread.sleep(100L * attempt); // 100ms, 200ms, 300ms...
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        return 0;
                    }
                    continue;
                }

                // BUSY 계열이 아니면 원래대로 터뜨려서 진짜 버그는 드러나게
                throw e;
            }
        }
    }

    public void recordLoginSuccess(long userId) {
        String now = LocalDateTime.now(ZONE).format(FMT);
        int updated = updateWithRetry(
                "UPDATE users SET last_login_at = ?, failed_login_count = 0 WHERE id = ?",
                now, userId
        );
        if (updated == 0) {
            log.warn("[AuthService] recordLoginSuccess: 로그 갱신 실패 (userId={})", userId);
        }
    }

    public void recordLoginFailure(long userId) {
        int updated = updateWithRetry(
                "UPDATE users SET failed_login_count = failed_login_count + 1 WHERE id = ?",
                userId
        );
        if (updated == 0) {
            log.warn("[AuthService] recordLoginFailure: 실패 횟수 갱신 실패 (userId={})", userId);
        }
    }

    public void updatePassword(long userId, String newPassword, int expireDays) {
        String now = LocalDateTime.now(ZONE).format(FMT);
        int updated = updateWithRetry(
                "UPDATE users SET password = ?, password_last_changed = ?, password_expire_days = ?, must_change_password = 0 WHERE id = ?",
                newPassword, now, expireDays, userId
        );
        if (updated == 0) {
            log.warn("[AuthService] updatePassword: 패스워드 갱신 실패 (userId={})", userId);
        }
    }

    public boolean isPasswordExpired(User user) {
        if (user.getPasswordLastChanged() == null) {
            return true;
        }
        LocalDateTime now = LocalDateTime.now(ZONE);
        long days = ChronoUnit.DAYS.between(user.getPasswordLastChanged(), now);
        return days >= user.getPasswordExpireDays();
    }
}
