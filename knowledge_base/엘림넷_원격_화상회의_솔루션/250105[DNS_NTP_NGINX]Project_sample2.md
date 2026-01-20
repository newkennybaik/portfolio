# 프로젝트 구성예시 2

## 1. 서버 작업 내역

### (1) DNS 서버 NTP 설정
- NTP 서버: `<NTP_SERVER_IP>`

```bash
vi /etc/chrony/chrony.conf
```

```conf
allow <INTERNAL_NETWORK_RANGE>
local stratum 10
```

```bash
timedatectl set-timezone UTC
date -u <UTC_TIME_VALUE>
```

#### Vidyo Event / WebRTC 호스트명 기존 환경과 동일하게 변경
```dns
; ========================
; Insight / Event / Manager / WebRTC / Admin
; ========================
<HOST_A>     IN  A   <IP_A>
<HOST_B>     IN  A   <IP_B>
<HOST_C>     IN  A   <IP_C>
<HOST_D>     IN  A   <IP_D>
<HOST_E>     IN  A   <IP_E>
```

---

### (2) VidyoWebRTC 구성 (<WEBRTC_SERVER_IP>)

#### 네트워크 설정
- 설정 파일
  - `/etc/netplan/01-static.yaml`
  - `/etc/cloud/cloud.cfg.d/99-disable-network-config.cfg`

```bash
netplan generate && netplan apply
```

#### Apache SSL 인증서 교체
```bash
mv <SSL_KEY_FILE>.key wildcard.key
mv <SSL_CERT_FILE>.crt wildcard.crt
mv <CHAIN_CERT>.crt fullchain.crt
systemctl restart apache2
```

#### CORS Policy REST API 호출
```bash
curl -k -X POST \
  -u <ADMIN_ID>:<REDACTED> \
  -H "Content-Type: application/json" \
  -d '{"domain":"<WEBRTC_FQDN>","context":"*"}' \
  https://<PORTAL_FQDN>/admin/api/v1/system/tenants/cors
```

---

### (3) Vidyo Cloud Manager 설정 변경
- 포트: `443`
- 호스트명: `<MANAGER_FQDN>`

```bash
vi /etc/nginx/sites-available/<NGINX_CONF_NAME>
```

```nginx
server {
    listen 443 ssl;
    server_name <MANAGER_FQDN>;

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
ln -sf /etc/nginx/sites-available/<NGINX_CONF_NAME> /etc/nginx/sites-enabled/<NGINX_CONF_NAME>
nginx -t && systemctl reload nginx
```

#### 인증서 교체
```bash
mv <SSL_KEY_FILE>.key wildcard.key
mv <SSL_CERT_FILE>.crt fullchain.crt
nginx -t && systemctl reload nginx
```

---

### (4) VidyoInsights 설치 (<INSIGHTS_SERVER_IP>)

#### 이미지 업로드 및 인스턴스 생성
```bash
mount /dev/<USB_DEVICE> <MOUNT_PATH>
openstack image create <IMAGE_NAME> \
  --file <QCOW2_FILE> \
  --disk-format qcow2 \
  --container-format bare \
  --private
```

#### 기본 설정
```bash
hostnamectl set-hostname <INSIGHTS_HOSTNAME>
nmtui
reboot
```

#### 시간 동기화
```bash
vi /etc/chrony.conf
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
  image: vidyoplatform/vidyo-insights-app:<VERSION>
  networks:
    - <DOCKER_NETWORK>
  extra_hosts:
    - "<PORTAL_FQDN>:<PORTAL_IP>"
```

```bash
vi ./environment/userconfig.env
```

```env
SERVER_IP=<INSIGHTS_FQDN>
DEFAULT_SUPER_ADMIN_PASSWORD=<REDACTED>
PUBLIC_SECRET=<REDACTED>

INFLUXDB_USER="<DB_USER>"
INFLUXDB_USER_PASSWORD="<REDACTED>"
INFLUXDB_ADMIN_USER="<DB_ADMIN>"
INFLUXDB_ADMIN_PASSWORD="<REDACTED>"

MYSQL_HOST=<DB_HOST>
MYSQL_USER=<DB_USER>
MYSQL_PASSWORD=<REDACTED>
MYSQL_DATABASE=<DB_NAME>

NODE_TLS_REJECT_UNAUTHORIZED=0
```

```bash
docker compose up -d
```

#### Super 포털 설정
- 각 tenant 접속
- Custom Parameter 추가

```text
Key: insightServerUrl
Value: https://<INSIGHTS_FQDN>/loki/loki/api/v1/push
```

---

### (5) Vidyo Cloud Manager 인증서 작업
```bash
mv <WILDCARD_CERT>.crt fullchain.crt
mv <WILDCARD_CERT>.key wildcard.key
nginx -t && systemctl reload nginx
```
