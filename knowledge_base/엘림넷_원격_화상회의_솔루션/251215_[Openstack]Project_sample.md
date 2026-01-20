# 대규모 프로젝트 오픈스택 사용 예시
- 공공기관 방문 및 오픈스택에서 OVA 작업 진행
- DNS, VCM, WebRTC 등을 사용할 우분투 서버 작업 관련 내용

---

## 1. 업무 노트북 고정 IP 할당
- 업무 노트북에 고정 IP 할당  
  예시: `10.20.1.60` → **익명 사설 IP로 치환**

---

## 2. 오픈스택 팀 제공 접근 정보

### Horizon 포트 포워딩 설정
업무 PC의 8443 포트를 Horizon 대시보드로 포워딩

```bash
ssh -L 8443:<HORIZON_INTERNAL_IP>:443 root@<OPENSTACK_BASTION_IP>
```

- SSH 계정: `root`
- 비밀번호: `********`

### Horizon 접속 정보
- URL: https://localhost:8443/horizon
- ID: `admin`
- PW: `********`

### OpenStack Host (SSH)
- 지역 A: `<PRIVATE_IP_A>`
- 지역 B: `<PRIVATE_IP_B>`
- 계정: `root`
- 비밀번호: `********`

---

## 3. DNS / Vidyo Cloud Manager용 Ubuntu 24.04 인스턴스 생성

### 배경
- 기존에 보유한 이미지에 문제가 있어  
  인스턴스 생성 후 SSH 로그인 화면이 정상적으로 표시되지 않음
- OpenStack 팀이 제공한 **Ubuntu 24.04 공식 이미지** 사용  
  (기본 계정: `root / ********`)

### 인스턴스 생성 순서

0. 이미지 업로드  
   - OpenStack 팀에서 사전 업로드 완료

1. 볼륨 생성
   - 타입: 이미지 기반
   - 크기: 50GB
   - 예시 이름:
     - `DNS-vol1`
     - `VidyoCloudManager-vol1`

2. Flavor 선택
   - 4 Core / 8 GB
   - OpenStack 팀에서 사전 생성한 리소스 태그 사용

3. 네트워크 포트 (고정 IP)
   - 포트명: `service_xxx`
   - IP: `172.16.75.xxx` → **익명 내부 IP**
   - 서브넷: `SERVICE-subnet`

4. 인스턴스 생성 완료

---

## 4. 인스턴스 SSH 접속 방법 (다단계 우회 접속)

### 접속 흐름

1. OpenStack Bastion Host 접속

```bash
ssh root@<OPENSTACK_BASTION_IP>
```

2. Bastion 접속 후, 실제 인스턴스가 배포된 Compute Host로 이동  
   (정보는 Horizon Web UI에서 확인)

- 프로젝트: `B_SERVICE`
- Compute Host 예시: `<COMPUTE_HOST_NAME>`
- 인스턴스 표시 이름 예시:
  - `ubuntu24.04.xxx`
- 실제 인스턴스 ID:
  - `instance-000000xx`

3. Compute Host 접속 및 콘솔 연결

```bash
ssh root@<COMPUTE_HOST_NAME>
virsh list
virsh console instance-000000xx
```

- Ubuntu 24.04 콘솔 계정:
  - ID: `root`
  - PW: `********`

---

## 5. DNS 서버용 필수 라이브러리 수동 다운로드

### 필요 패키지 목록
- `bind9-libs_xxx_amd64.deb`
- `bind9-utils_xxx_amd64.deb`
- `bind9_xxx_amd64.deb`
- `dns-root-data_xxx_all.deb`

---

### Windows → OpenStack Bastion 업로드

```powershell
scp * root@<OPENSTACK_BASTION_IP>:~/
```

---

### Bastion → Compute Host 업로드

```bash
scp bind* root@<COMPUTE_HOST_NAME>:~/
scp dns-root-data* root@<COMPUTE_HOST_NAME>:~/
```

---

## 문제점 정리

- OpenStack **Compute Host → 실제 인스턴스**로 파일 업로드 불가
- 해당 구조에서는:
  - 인스턴스 내부로 직접 파일 전달 경로가 없음
  - 필수 OS 라이브러리 수동 설치가 불가능

---

## 결론 및 대응 방향

- 현재 구조에서는 **이미지 자체에 라이브러리를 포함**해야 함
- 대응 방안:
  - Ubuntu 24.04 기반 커스텀 이미지 생성
  - DNS / VCM 필수 패키지 사전 설치
  - QCOW2 또는 Glance 이미지로 Export 후
  - OpenStack에 재업로드하여 인스턴스 생성

→ 대규모 프로젝트 환경에서  
**운영 편의성과 배포 안정성을 고려한 이미지 기반 표준화 필요**
