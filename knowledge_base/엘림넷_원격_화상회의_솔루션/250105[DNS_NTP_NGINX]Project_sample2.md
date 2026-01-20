# 프로젝트 구성예시 2

## 1. 세종 서버 작업 내역

### (1) DNS 서버 NTP 설정
- NTP 서버: `172.16.105.251`

```bash
vi /etc/chrony/chrony.conf
```

```conf
allow 172.16.105.0/24
local stratum 10
```

```bash
timedatectl set-timezone UTC
date -u 122202172025.00
```

#### Vidyo Event / WebRTC 호스트명 정합성 유지 (분당 환경과 동일하게 구성)
```dns
; ========================
; Insight / Event / Manager / WebRTC / Admin
; ========================
insight01        IN  A   172.16.105.241
event01          IN  A   172.16.105.243
manager01        IN  A   172.16.105.245
webrtc01         IN  A   172.16.105.247
admin01          IN  A   172.16.105.249
```

---

### (2) VidyoWebRTC 구성 (172.16.105.247)

#### 네트워크 설정
- 설정 파일
  - `/etc/netplan/01-static.yaml`
  - `/etc/cloud/cloud.cfg.d/99-disable-network-config.cfg`

```bash
netplan generate && netplan apply
```

#### Apache SSL 인증서 교체
```bash
mv webrtc.example.com.key wildcard.key
mv webrtc.example.com.crt wildcard.crt
mv chainca.crt fullchain.crt
systemctl restart apache2
```

#### CORS Policy REST API 호출
```bash
curl -k -X POST \
  -u super:<REDACTED_PASSWORD> \
  -H "Content-Type: application/json" \
  -d '{"domain":"webrtc01.example.internal","context":"*"}' \
  https://portal.example.internal/admin/api/v1/system/tenants/cors
```

---

### (3) Vidyo Cloud Manager 설정 변경
- 포트: `443`
- 호스트명: `manager01`

```bash
vi /etc/nginx/sites-available/manager01-443
```

```nginx
server {
    listen 443 ssl;
    server_name manager01.example.internal;

    ssl_certificate     /etc/nginx/ssl/fullchain.crt;
    ssl_certificate_key /etc/nginx/ssl/wildcard.key;

    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 6g;
    client_body_timeout 3600s;
    client_header_timeout 3600s;
    send_timeout 3600s;

    location / {
        proxy_pass http://127.0.0.1:8080;

        proxy_request_buffering off;
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 443;

        proxy_redirect off;
    }
}
```

```bash
ln -sf /etc/nginx/sites-available/manager01-443 /etc/nginx/sites-enabled/manager01-443
nginx -t && systemctl reload nginx
```

#### 인증서 교체
```bash
mv wildcard.example.com.key wildcard.key
mv wildcard.example.com.crt fullchain.crt
nginx -t && systemctl reload nginx
```

---

### (4) 세종 VidyoInsights 설치 (172.16.105.241)

#### 이미지 업로드 및 인스턴스 생성
```bash
mount /dev/sdc1 ~/usb_mount/
openstack image create VidyoInsights \
  --file VidyoInsights.qcow2 \
  --disk-format qcow2 \
  --container-format bare \
  --private
```

#### 기본 설정
```bash
hostnamectl set-hostname VidyoInsights
nmtui
reboot
```

#### 시간 동기화
```bash
vi /etc/chrony.conf
# server 172.16.105.251 iburst
systemctl restart chronyd
chronyc sources -v
chronyc tracking
```

#### VidyoInsights 설정
```bash
cd /usr/local/VidyoInsights
vi docker-compose.yaml
```

```yaml
vidyo-insights-app:
  container_name: vidyo-insights-app
  image: vidyoplatform/vidyo-insights-app:25.1.0.0001
  networks:
    - nesjs-network
  extra_hosts:
    - "insight01.example.internal:172.16.105.241"
```

```bash
vi ./environment/userconfig.env
```

```env
SERVER_IP=insight01.example.internal

DEFAULT_SUPER_ADMIN_PASSWORD=<REDACTED_PASSWORD>
PUBLIC_SECRET=<REDACTED_SECRET>

INFLUXDB_USER="telegraf"
INFLUXDB_USER_PASSWORD="<REDACTED_PASSWORD>"
INFLUXDB_ADMIN_USER="admin"
INFLUXDB_ADMIN_PASSWORD="<REDACTED_PASSWORD>"

MYSQL_HOST=db.example.internal
MYSQL_USER=cdraccess
MYSQL_PASSWORD=cdraccess2
MYSQL_DATABASE=portal2

NODE_TLS_REJECT_UNAUTHORIZED=0
```

```bash
docker compose up -d
```

#### Super 포털 설정
- 각 Tenant 별 Custom Parameter 추가

```text
Key: insightServerUrl
Value: https://insight01.example.internal/loki/loki/api/v1/push
```

---

### (5) Vidyo Cloud Manager 인증서 작업
```bash
mv STAR.example.com.crt fullchain.crt
mv STAR.example.com.key wildcard.key
nginx -t && systemctl reload nginx
```
