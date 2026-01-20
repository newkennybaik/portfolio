# VidyoInsights 도커 구성 예시 (익명화)

## 1. VidyoInsights QCOW2 리패키징 작업 내역

### OS 라이브러리 설치
```bash
yum -y update
yum -y install net-tools
yum -y install qemu-img
yum -y install openssl
yum -y install bind-utils
yum -y install traceroute
yum -y install bash-completion
yum -y install lsof
yum -y install unzip zip
```

### Docker 설치 및 서비스 활성화
```bash
yum config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
yum -y install docker-ce docker-ce-cli containerd.io
systemctl enable docker
systemctl start docker
```

### VidyoInsights 디렉토리 구성
```bash
mkdir -p /usr/local/VidyoInsights
mv vidyoinsights-deployment-<VERSION>.zip /usr/local/VidyoInsights
cd /usr/local/VidyoInsights
unzip vidyoinsights-deployment-<VERSION>.zip
```

### docker-compose.yaml 수정 사항
- Stats Analyzer 이미지 버전 변경
- 테스트 목적의 extra_hosts 추가

```yaml
stats-analyzer:
  container_name: stats-analyzer
  image: vidyoplatform/vidyo-insights-statsanalyzer:<STATS_ANALYZER_VERSION>

vidyo-insights-app:
  container_name: vidyo-insights-app
  image: vidyoplatform/vidyo-insights-app:<APP_VERSION>
  networks:
    - nesjs-network
  extra_hosts:
    - "<INSIGHTS_FQDN>:<INSIGHTS_PRIVATE_IP>"
```

### SSL 인증서 및 환경설정 파일 교체
- `certs` 디렉토리의 SSL 인증서 교체
- `userconfig.env` 파일 수정

```env
# Fully qualified domain name or server IP address where VidyoInsights is deployed
SERVER_IP=<INSIGHTS_FQDN>

# Default VidyoInsights super admin password
DEFAULT_SUPER_ADMIN_PASSWORD=<REDACTED_PASSWORD>

# seed used for generating unique hashed tokens
PUBLIC_SECRET=<REDACTED_SECRET>

# InfluxDB configuration
INFLUXDB_USER="telegraf"
INFLUXDB_USER_PASSWORD="<REDACTED_PASSWORD>"
INFLUXDB_ADMIN_USER="admin"
INFLUXDB_ADMIN_PASSWORD="<REDACTED_PASSWORD>"

# CDR Access Configuration
MYSQL_HOST=<CDR_DB_HOST>
MYSQL_USER=<CDR_DB_USER>
MYSQL_PASSWORD=<CDR_DB_PASSWORD>
MYSQL_DATABASE=<CDR_DB_NAME>

# Disable TLS certificate verification (test purpose only)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Docker 이미지 풀링 및 서비스 기동
```bash
docker compose up -d
```

- 컨테이너 정상 기동 및 로그인 가능 확인
- 네트워크 차단 후에도 서비스 기동 가능 여부 검증 완료
- 외부 인터넷 의존성 없음 확인

---

## 2. QCOW2 파일 변환 작업

### VidyoInsights 서버 종료
```bash
init 0
```

### VMDK → QCOW2 변환
```bash
qemu-img convert -p -f vmdk -O qcow2 VidyoInsights.vmdk VidyoInsights.qcow2
```
