# 오픈스택으로 이미지 업로드 예시 (12/15)

## 작업내용 요약
- `virsh console`에서 로그인 화면 접속 불가 이슈 확인 결과, **QCOW2 파일이 깨진 문제는 아니었던 것으로 보임**.
- QCOW2 내부 Ubuntu OS 설정에서 **시리얼 콘솔(virsh console) 접근이 허용되지 않아** `virsh console`로는 접근이 불가했던 것으로 추정됨.
- 확인 결과, **Horizon WEB UI를 통해서는 접근이 가능**하여 작업을 Horizon 기준으로 진행함.

---

## 1. USB를 통해 이미지 업로드

### (1) USB 연결 및 마운트
- `lsblk` 확인 시 USB가 `/dev/sdc`로 연결됨

```bash
lsblk
mount /dev/sdc /home/usb

source /root/contrabass-openrc

ll
```

```text
total 12619016
drwxrwxrwx 1 root root       4096 Dec 15 11:59  ./
drwxr-xr-x 5 root root       4096 Dec 15 20:01  ../
drwxrwxrwx 1 root root          0 Dec 14 01:02  System Volume Information/
-rwxrwxrwx 1 root root 5098242048 Dec 14 01:33  VidyoCloudManager.qcow2*
-rwxrwxrwx 1 root root 3876782080 Dec 14 00:05  VidyoInsights.qcow2*
-rwxrwxrwx 1 root root 3946840064 Dec 14 01:17  webrtc_ksc.qcow2*
```

---

### (2) OpenStack 이미지 생성

```bash
openstack image create VidyoCloudManager \
  --file VidyoCloudManager.qcow2 \
  --disk-format qcow2 \
  --container-format bare \
  --private

openstack image create VidyoInsights \
  --file VidyoInsights.qcow2 \
  --disk-format qcow2 \
  --container-format bare \
  --private

openstack image create VidyoWebRTC \
  --file webrtc_ksc.qcow2 \
  --disk-format qcow2 \
  --container-format bare \
  --private
```

- 기본 흐름:
  - **이미지 생성 → 볼륨 생성 → Flavor 생성/선택 → 네트워크 포트 생성 → 인스턴스 생성**

---

## 2. 이미지별 후속 작업

### (3) DNS 서버 작업

#### 네트워크 수정
- 기본값 덮어쓰기 해제:
  - `/etc/cloud/cloud.cfg.d/99-disable-network-config.cfg`

```bash
vi /etc/cloud/cloud.cfg.d/99-disable-network-config.cfg
```

```yaml
network:
  config: disabled
```

- netplan 설정 변경:
  - `/etc/netplan/01-static.yaml`

```bash
vi /etc/netplan/01-static.yaml
netplan generate && netplan apply
```

#### DNS 라이브러리 수정 후 재실행

```bash
named-checkzone scourt.go.kr /etc/bind/db.scourt.go.kr
rndc reload scourt.go.kr
systemctl reload bind9
```

- 라우터에서 확인 시 정상적으로 Ping이 감.

---

### (4) VidyoCloudManager 작업내용

- 네트워크 수정은 DNS 서버 작업과 유사하게 진행

#### VCM 프로그램 세팅

```bash
tar -xvpzf vcm.tar.gz
cd vcm
./service_lnx.sh start
systemctl restart nginx
```

---

### (5) WebRTC 작업내용
- 네트워크 / IP만 변경

---

### (6) VidyoInsight 작업내용
- QCOW2 안에 Docker를 설치해둔 상태
- 작업 미스로 **VidyoInsight Ubuntu QCOW2 제작 시, Insight 설치 바이너리 파일을 업로드하지 않음**
