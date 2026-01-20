# VidyoInsights 사전 구성 및 이미지 패키징 작업 정리 (익명)

※ 프로젝트 네트워크 환경 구성 완료 후 본격 작업 시작

---

## 1. 사전 확인 사항

- VidyoCloudManager 실행 오류 원인 확인  
  → `ssh-rsa` 키 파일 손상으로 인한 실행 실패로 판단됨

- VidyoInsights는 외부 인터넷 접근이 필요한 구성 요소 존재  
  → 현장 반입 전 **Docker 이미지 사전 Pull + QCOW2 패키징** 필요

---

## 2. VidyoInsights Docker 환경 구성 (Ubuntu)

### Docker 설치

```bash
apt update

# Docker GPG Key
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Docker Repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
| tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker / Compose
apt install -y docker-ce docker-ce-cli containerd.io \
               docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker
```

---

## 3. VidyoInsights 배포 파일 구성

```bash
mkdir -p /usr/local/VidyoInsights
cd /usr/local/VidyoInsights
unzip vidyoinsights-deployment-25.1.0-0013.zip
```

### SSL 인증서 교체

```bash
cd /usr/local/VidyoInsights/certs
mv <ORIGINAL_CERT>.crt vidyoinsights.crt
mv <ORIGINAL_CERT>.key vidyoinsights.key
```

---

## 4. 환경 설정 파일 수정

```bash
cd /usr/local/VidyoInsights/environment
cp userconfig.env userconfig.env_backup
vi userconfig.env
```

```ini
SERVER_IP=<INSIGHTS_FQDN>

DEFAULT_SUPER_ADMIN_PASSWORD=<REDACTED>
PUBLIC_SECRET=<REDACTED>

INFLUXDB_USER="telegraf"
INFLUXDB_USER_PASSWORD="<REDACTED>"
INFLUXDB_ADMIN_USER="admin"
INFLUXDB_ADMIN_PASSWORD="<REDACTED>"

MYSQL_HOST=<PORTAL_DB_HOST>
MYSQL_USER=<DB_USER>
MYSQL_PASSWORD=<REDACTED>
MYSQL_DATABASE=portal2

NODE_TLS_REJECT_UNAUTHORIZED=0
```

---

## 5. Docker 이미지 Pull 및 서비스 기동

```bash
docker compose up -d
docker ps
docker compose ls
```

- 모든 컨테이너 정상 기동 확인
- 네트워크/볼륨 자동 생성됨

---

## 6. QCOW2 이미지 패키징

```bash
apt update
apt install -y qemu-utils

qemu-img convert -p -f vmdk -O qcow2 VidyoInsights.vmdk VidyoInsights.qcow2
qemu-img info VidyoInsights.qcow2
```

---

## 7. SSL 인증서 자동 배포 로직 (VCM)

### 공통 서버 (Portal / Router / Replay / Gateway)

```bash
cat ssl_certificate.pfx | ssh apiuser@<TARGET_IP> VidyoUpload
echo -n '<PFX_PASSWORD>' | ssh apiuser@<TARGET_IP> SSL_InstallPFX
ssh apiuser@<TARGET_IP> apache2 reload
ssh apiuser@<TARGET_IP> reboot
```

### Event 서버 전용

```bash
cat ssl_certificate.pfx | ssh apiuser@<TARGET_IP> VidyoUpload
echo -n '<PFX_PASSWORD>' | ssh apiuser@<TARGET_IP> SSL_InstallPFX
echo -n '<PFX_PASSWORD>' | ssh apiuser@<TARGET_IP> VidyoEventService createKeystore
ssh apiuser@<TARGET_IP> reboot
```

---

## 8. 참고: Java 업로더 로직 기준 커맨드

```java
cmdLine.append("cat ")
       .append(filePath)
       .append(" | ssh -i ")
       .append(sshKey)
       .append(" -o StrictHostKeyChecking=no")
       .append(" -o UserKnownHostsFile=/dev/null")
       .append(" -o PubkeyAcceptedAlgorithms=+ssh-rsa")
       .append(" -o HostkeyAlgorithms=+ssh-rsa")
       .append(" apiuser@")
       .append(ip)
       .append(" VidyoUpload");
```

---

※ 본 문서는 **LAB / 사전 검증 목적**의 기술 정리이며  
IP, FQDN, 인증 정보는 모두 익명화 처리됨
