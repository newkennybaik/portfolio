# VidyoCloudManager 릴리즈 노트  
**Vidyo Cloud Manager (VCM) v25.1.0 → v25.1.1 사전 릴리즈 노트**

---

## 대상 버전
- **AS-IS**: v25.1.0  
- **TO-BE**: v25.1.1  

---

## 마이너 패치 수정 내역

### 1) 업데이터 파일 누적 이슈 개선
- 업데이터 파일 누적으로 인한 **디스크 용량 부족 현상**이 빈번하게 발생
- **업로드된 파일 삭제 기능 추가**
  - 업그레이드 파일
  - **SSL 인증서 파일(PFX, CRT 등)**도 삭제 가능하도록 버튼 추가

---

### 2) 업그레이드/SSL 적용 전 확인 절차 강화
- `Start Upgrade` 버튼 오클릭 시 **되돌릴 수 없는 문제**가 발생하던 구조 개선
- 업데이트 실행 전 **확인 팝업 추가**
  - 업그레이드 실행 시
  - SSL 인증서 적용 시
- 모든 주요 작업에 대해 **사용자 확인(Prompt) 필수화**

---

### 3) SSL 인증서 자동화 로직 및 전용 탭 추가
- VCM 내 **SSL 인증서 자동 적용 로직 구현**
- 기준이 되는 커맨드라인 구성 로직:

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

#### Portal / Router / Replay / Gateway 적용 절차
```bash
cat ssl_certificate.pfx | ssh apiuser@<SERVER_IP> VidyoUpload
echo -n 'password' | ssh apiuser@<SERVER_IP> SSL_InstallPFX
ssh apiuser@<SERVER_IP> apache2 reload
ssh apiuser@<SERVER_IP> reboot
```

#### Event 서비스 예외 처리 로직
```bash
cat ssl_certificate.pfx | ssh apiuser@<SERVER_IP> VidyoUpload
echo -n 'password' | ssh apiuser@<SERVER_IP> SSL_InstallPFX
echo -n 'password' | ssh apiuser@<SERVER_IP> VidyoEventService createKeystore
ssh apiuser@<SERVER_IP> reboot
```

---

### 4) PFX 번들 인증서 자동 생성 기능 추가
- **Key + Fullchain(CRT)** 파일만 업로드하면 자동으로 **PFX 번들 생성**
- 생성된 PFX 인증서는:
  - 서버에 저장
  - **재사용 가능**
- 변환 시:
  - **임의 비밀번호 자동 생성**
  - UI에서 **Copy 버튼으로 비밀번호 즉시 복사 가능**

---

## 서비스 등록 예정 (systemd)

추가로 VCM을 **systemd 서비스로 등록 예정**

```ini
[Unit]
Description=Vidyo Cloud Manager
After=network.target

[Service]
Type=forking
WorkingDirectory=/root/vcm
ExecStart=/root/vcm/service.sh start
ExecStop=/root/vcm/service.sh stop
PIDFile=/root/vcm/app.pid
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

---

※ 본 문서는 **v25.1.1 사전 릴리즈 기준**으로 작성되었으며,  
일부 기능은 내부 검증 후 최종 릴리즈 시점에 변경될 수 있음.
