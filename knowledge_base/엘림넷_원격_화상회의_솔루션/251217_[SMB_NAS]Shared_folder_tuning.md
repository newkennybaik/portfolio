# Cluster에 NAS 공유폴더로 사용 중인 폴더 튜닝 예시

## VidyoReplay 클러스터 이슈

### 문제점
- VidyoReplay **25.1 버전**의 클러스터 묶기 기능에 버그가 있는 것으로 추정됨  
  → **25.1.3 버전 릴리즈 예정**, 정확한 일정은 미정
- NAS 상태가 **간헐적으로 down** 되는 현상 발생

### 조치 내용
- VidyoReplay를 **24.2 버전으로 재배포 후 클러스터 구성**
  → 클러스터 정상 동작 확인
- NAS 서버로 사용 중이던 **노트북 PC 자체 이슈** 확인
- Windows SMB 공유 설정에서 **세션 타임아웃 / 연결 유지 관련 튜닝 적용**
  → NAS down 현상 재발하지 않음

#### SMB 세션/연결 튜닝 (PowerShell)
```powershell
Set-SmbClientConfiguration `
  -SessionTimeout 3600 `
  -ExtendedSessionTimeout 7200 `
  -KeepConn 86400 `
  -UseOpportunisticLocking $false
```

#### 레지스트리 튜닝 (SMB Server)
```cmd
reg add "HKLM\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters" /v autodisconnect /t REG_DWORD /d 0xffffffff /f
reg add "HKLM\SYSTEM\CurrentControlSet\Services\LanmanServer\Parameters" /v EnableOplocks /t REG_DWORD /d 0 /f
```

#### SMB 서비스 재시작
```cmd
net stop lanmanserver
net start lanmanserver
```

- NAS 서버로 사용 중인 **노트북 PC 재부팅**

---

## 추가 작업 사항
- 요청에 따라 **분당 환경 Vidyo Cloud Manager 포트 변경**
  - 변경 전: `6443`
  - 변경 후: `443`

---

## Vidyo Event Service 이슈
- VidyoConnect 클라이언트에서 **VidyoEvent 서버를 찾지 못하는 버그 의심**
- 현재 **R&D 개발팀에서 원인 확인 중**
