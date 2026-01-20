# VidyoInsights 도커 구성 예시

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
mv vidyoinsights-deployment-25.1.0-0013.zip /usr/local/VidyoInsights
cd /usr/local/VidyoInsights
unzip vidyoinsights-deployment-25.1.0-0013.zip
```

### docker-compose.yaml 수정 사항
- Stats Analyzer 이미지 버전 변경: `70 → 71`
- 테스트 목적의 extra_hosts 추가

```yaml
stats-analyzer:
  container_name: stats-analyzer
  image: vidyoplatform/vidyo-insights-statsanalyzer:24.1.0.0071

vidyo-insights-app:
  container_name: vidyo-insights-app
  image: vidyoplatform/vidyo-insights-app:25.1.0.0001
  networks:
    - nesjs-network
  extra_hosts:
    - "bvi01.scourt.go.kr:192.168.244.137"
```

### SSL 인증서 및 환경설정 파일 교체
- `certs` 디렉토리의 SSL 인증서를 법원 인증서로 교체
- `userconfig.env` 파일을 아래 내용으로 수정

```env
# Fully qualified domain name or server IP address where VidyoInsights is deployed
SERVER_IP=bvi01.scourt.go.kr

# Default VidyoInsights super admin password
DEFAULT_SUPER_ADMIN_PASSWORD=VC@dudtkdwovks25!

# seed used for generating unique hashed tokens
PUBLIC_SECRET=VC@dudtkdwovks25!

# InfluxDB configuration
INFLUXDB_USER="telegraf"
INFLUXDB_USER_PASSWORD="VC@dudtkdwovks25!"
INFLUXDB_ADMIN_USER="admin"
INFLUXDB_ADMIN_PASSWORD="VC@dudtkdwovks25!"

# CDR Access Configuration
MYSQL_HOST=192.168.244.135
MYSQL_USER=cdraccess
MYSQL_PASSWORD=cdraccess2
MYSQL_DATABASE=portal2

# Disable TLS certificate verification (test purpose)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

### Docker 이미지 풀링 및 서비스 기동
```bash
docker compose up -d
```

- 서비스 정상 기동 및 로그인 가능 확인
- Wi-Fi 비활성화 후 `docker compose down`
- 네트워크가 없는 상태에서 `docker compose up -d` 실행 시에도  
  Stats Analyzer 컨테이너 정상 기동 확인  
→ **외부 인터넷 의존성 없음 검증 완료**

---

## 2. QCOW2 파일 변환 작업

### VidyoInsights 서버 종료
```bash
init 0
```

### VMDK 파일을 변환용 Linux 서버로 복사 (WinSCP 사용)

### VMDK → QCOW2 변환
```bash
qemu-img convert -p -f vmdk -O qcow2 VidyoInsights.vmdk VidyoInsights.qcow2
```
