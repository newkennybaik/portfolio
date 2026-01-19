PRAGMA foreign_keys = ON;

--------------------------------------------------
-- 1. 사용자 테이블
--------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    username               TEXT NOT NULL UNIQUE,   -- 로그인 ID
    password               TEXT NOT NULL,          -- 해시된 비밀번호(실서비스면 해시 필수)

    -- 비밀번호 관련
    password_last_changed  TEXT NOT NULL DEFAULT (datetime('now')),  -- 마지막 비번 변경 시각 (UTC)
    password_expire_days   INTEGER NOT NULL DEFAULT 90,              -- 만료까지 일수 (30/90/180 중 선택해서 저장)
    must_change_password   INTEGER NOT NULL DEFAULT 1,               -- 1 = 다음 로그인 시 비번 변경 강제

    -- 계정 상태/로그인 추적용
    last_login_at          TEXT,                                     -- 마지막 로그인 시각
    failed_login_count     INTEGER NOT NULL DEFAULT 0,               -- 연속 로그인 실패 횟수
    account_locked_until   TEXT,                                     -- 잠금 해제 예정 시각 (예: 5분 락)

    is_active              INTEGER NOT NULL DEFAULT 1,               -- 1=활성, 0=비활성

    created_at             TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

--------------------------------------------------
-- 2. 컴포넌트별 IP 설정 테이블
--   component: 'portal', 'router', 'replay', 'gateway', 'event', 'insights'
--   ip_list  : 개행(\n)으로 구분된 IP 목록 문자열
--------------------------------------------------
CREATE TABLE IF NOT EXISTS component_config (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    component  TEXT NOT NULL UNIQUE,   -- portal/router/replay/gateway/event/insights
    ip_list    TEXT NOT NULL,          -- "192.168.0.100\n192.168.0.101" 이런 식

    -- 동시 실행 제한(예: Router는 4개씩만 병렬)
    concurrency_limit INTEGER NOT NULL DEFAULT 4,

    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

--------------------------------------------------
-- 3. 초기 데이터
--------------------------------------------------

-- 초기 관리자 계정
INSERT OR IGNORE INTO users (username, password, password_expire_days, must_change_password)
VALUES ('admin', 'password', 90, 1);

-- 컴포넌트별 기본 IP 설정 예시
INSERT OR IGNORE INTO component_config (component, ip_list, concurrency_limit)
VALUES
    ('portal',   '192.168.0.100\n192.168.0.101', 2),
    ('router',   '192.168.0.13\n192.168.0.14', 4),
    ('replay',   '192.168.0.34\n192.168.0.35', 4),
    ('gateway',  '192.168.0.57\n192.168.0.58', 4),
    ('event',    '192.168.0.55', 1),
    ('insights', '192.168.0.56', 1);
	
CREATE TABLE IF NOT EXISTS insights_config (
    id                     INTEGER PRIMARY KEY,
    insights_url           TEXT,   -- VidyoInsights 현황 페이지 URL
    portal_admin_base_url  TEXT,   -- {{VidyoPortalAdminServicePortBaseUrl}}
    admin_username         TEXT,   -- SOAP BasicAuth ID
    admin_password         TEXT    -- SOAP BasicAuth PW (평문)
);

-- 기존 schema.sql 맨 아래에 추가

CREATE TABLE IF NOT EXISTS insights_config (
    id                     INTEGER PRIMARY KEY,
    insights_url           TEXT,   -- VidyoInsights 현황 URL
    portal_admin_base_url  TEXT,   -- {{VidyoPortalAdminServicePortBaseUrl}}
    admin_username         TEXT,   -- SOAP Basic Auth ID
    admin_password         TEXT    -- SOAP Basic Auth PW (평문 저장)
);

INSERT INTO insights_config (id, insights_url, portal_admin_base_url, admin_username, admin_password)
SELECT 1, '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM insights_config WHERE id = 1);
