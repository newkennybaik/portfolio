# -*- coding: utf-8 -*-
"""
LifeSize UVC Multipoint monitor
- Selenium 로그인 (사설 인증서 허용)
- Conferences 섹션 강제 오픈 → DOM에서 참가자 표 스냅샷
- longpoll 이벤트도 병행 처리
"""
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait as W
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import requests, json, time, re, ssl
from urllib.parse import urljoin
from rich.console import Console
from rich.table import Table
from requests.adapters import HTTPAdapter
from urllib3 import PoolManager

# ====== 설정 ======
BASE = "https://211.240.117.65"
LOGIN_URL = BASE + "/accounts/login/?no_priv=true"
USER = "administrator"
PASS = "admin123"
# ==================

console = Console()

# Chrome 옵션 (사설 인증서 우회)
opts = Options()
# 문제 확인용: 처음엔 브라우저를 띄우세요. 안정화 후 headless로 전환.
# opts.add_argument("--headless=new")
opts.add_argument("--no-sandbox")
opts.add_argument("--disable-gpu")
opts.add_argument("--ignore-certificate-errors")
opts.add_argument("--allow-insecure-localhost")
opts.add_argument("--window-size=1300,950")

driver = webdriver.Chrome(options=opts)

def login_and_open_conferences():
    driver.get(LOGIN_URL)
    try:
        W(driver, 15).until(EC.presence_of_element_located((By.ID, "id_username"))).send_keys(USER)
    except TimeoutException:
        W(driver, 8).until(EC.presence_of_element_located((By.NAME, "username"))).send_keys(USER)
    try:
        pw = driver.find_element(By.ID, "id_password")
    except:
        pw = driver.find_element(By.NAME, "password")
    pw.send_keys(PASS)
    pw.submit()
    W(driver, 20).until(EC.element_to_be_clickable((By.CSS_SELECTOR, "a[href='#conferences-tab']"))).click()
    W(driver, 20).until(EC.presence_of_element_located((By.ID, "conferences")))
    time.sleep(0.8)

def extract_confuids(max_wait_sec=20):
    end_t = time.time() + max_wait_sec
    while time.time() < end_t:
        heads = driver.find_elements(By.CSS_SELECTOR, "#conferences [id^='head-']")
        ids = []
        for h in heads:
            hid = h.get_attribute("id") or ""
            m = re.match(r"head-(.+)", hid)
            if m:
                ids.append(m.group(1))
        if ids:
            return ids
        time.sleep(0.5)
    return []

def open_conference_section(confuid: str):
    """ 필요 시 접힌 섹션을 펼침 """
    head_sel = f"#head-{confuid}"
    body_sel = f"#body-{confuid}"
    try:
        head = driver.find_element(By.CSS_SELECTOR, head_sel)
    except:
        return
    # body가 display:none이면 열기
    try:
        body = driver.find_element(By.CSS_SELECTOR, body_sel)
        disp = body.value_of_css_property("display")
    except:
        disp = "none"
    if disp == "none":
        try:
            # 아이콘 클릭
            head.find_element(By.CSS_SELECTOR, "img.opener-image").click()
        except:
            head.click()
        time.sleep(0.3)

def snapshot_participants_from_dom(confuid: str):
    """
    body-<confUid> 안의 표에서 헤더(<th>)를 읽어 컬럼 인덱스를 자동 매핑.
    기본 폴백: Name=1, ID=2, Protocol=4, Status=8
    """
    open_conference_section(confuid)

    # 테이블 및 헤더 파싱
    table = None
    try:
        table = driver.find_element(By.CSS_SELECTOR, f"#body-{confuid} table")
    except:
        return []

    # 헤더 인덱스 매핑
    header_idx = {}
    try:
        ths = table.find_elements(By.CSS_SELECTOR, "thead th")
        for i, th in enumerate(ths):
            key = th.text.strip().lower()
            header_idx[key] = i
    except:
        pass

    # 기본 폴백 인덱스 (아이콘 컬럼 때문에 한 칸 밀림 가정)
    name_i     = header_idx.get("name", 1)
    id_i       = header_idx.get("id", 2)
    protocol_i = header_idx.get("protocol", 4)
    status_i   = header_idx.get("status", 8)

    rows = table.find_elements(By.CSS_SELECTOR, "tbody tr")
    participants = []
    for tr in rows:
        tds = tr.find_elements(By.TAG_NAME, "td")
        if len(tds) < max(name_i, id_i, protocol_i) + 1:
            continue

        # 값 추출
        name_txt = tds[name_i].text.strip()
        call_id_txt = tds[id_i].text.strip()
        protocol_txt = tds[protocol_i].text.strip()
        status_txt = ""
        if len(tds) > status_i:
            status_txt = tds[status_i].text.strip()

        # call_id 정수 변환 시도
        try:
            call_id_val = int(call_id_txt)
        except:
            call_id_val = call_id_txt

        participants.append({
            "name": name_txt,
            "callId": call_id_val,
            "protocol": protocol_txt,
            "state": "active" if status_txt == "" else status_txt  # UI가 아이콘이면 빈 문자열일 수 있음
        })

    return participants

# TLSAdapter: 약한 DH 키 + hostname 검증 비활성
class TLSAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        try:
            ctx.set_ciphers("DEFAULT:@SECLEVEL=0")
        except Exception:
            pass
        self.poolmanager = PoolManager(*args, ssl_context=ctx, **kwargs)

def make_requests_session():
    s = requests.Session()
    for c in driver.get_cookies():
        s.cookies.set(c["name"], c["value"], domain=c.get("domain") or "211.240.117.65")
    s.mount("https://", TLSAdapter())
    return s

def print_participants_table(confuid, participants):
    table = Table(show_header=True, header_style="bold cyan")
    table.add_column("Name", width=24)
    table.add_column("Call ID", justify="right")
    table.add_column("Protocol", width=8)
    table.add_column("Status", width=12)
    for p in participants:
        table.add_row(
            p.get("name", ""),
            str(p.get("callId", "")),
            p.get("protocol", ""),
            p.get("state", "")
        )
    console.clear()
    console.rule(f"[bold yellow]Conference: {confuid}[/bold yellow]")
    console.print(table)
    console.rule()

# ---------------- main ----------------
login_and_open_conferences()
confuids = extract_confuids()
print("Detected confUids:", confuids)

s = make_requests_session()
REST_NEW = urljoin(BASE, "/uvcmcu/rest/new")
LONGPOLL = urljoin(BASE, "/uvcmcu/rest/longpoll.rb")

# /rest/new (있으면 session 얻음)
session_param = None
try:
    resp = s.get(REST_NEW, verify=False, timeout=8)
    try:
        session_param = resp.json().get("session")
    except Exception:
        session_param = None
except Exception:
    session_param = None

params = {}
if session_param:
    params["session"] = session_param

participants_by_conf = {c: {} for c in confuids}

print("Monitoring… (live DOM snapshot + longpoll)\n")

while True:
    # 1) DOM 스냅샷로 현재 표 바로 보여주기 (3초마다)
    for confuid in confuids:
        dom_list = snapshot_participants_from_dom(confuid)
        # DOM 결과를 화면에 출력
        print_participants_table(confuid, dom_list)

    # 2) longpoll 이벤트도 병행 수신(없으면 넘어감)
    try:
        r = s.get(LONGPOLL, params=params, timeout=5, verify=False)
        if r.status_code == 200 and r.text.strip():
            try:
                payload = r.json()
            except json.JSONDecodeError:
                payload = []
            for ev in payload:
                call = ev.get("call")
                p = ev.get("params", {})
                if call == "GuiPlayer_callDetailsChanged":
                    d = p.get("details", {})
                    confuid = d.get("confUid")
                    if not confuid: 
                        continue
                    if confuid not in participants_by_conf:
                        participants_by_conf[confuid] = {}
                    cid = d.get("callId")
                    if cid is None:
                        continue
                    participants_by_conf[confuid][cid] = {
                        "name": d.get("name"),
                        "protocol": d.get("protocol"),
                        "callId": cid,
                        "state": "active"
                    }
                elif call == "GuiPlayer_callStateChanged":
                    st = p.get("state", {})
                    call_id = st.get("callId")
                    confuid = None
                    for cu, plist in participants_by_conf.items():
                        if call_id in plist:
                            confuid = cu
                            break
                    if confuid:
                        state = st.get("state")
                        if state == "terminated":
                            participants_by_conf[confuid].pop(call_id, None)
                        elif call_id in participants_by_conf[confuid]:
                            participants_by_conf[confuid][call_id]["state"] = state
    except requests.exceptions.ReadTimeout:
        pass

    time.sleep(3)
