# 프라이빗 클라우드 인프라 개인학습 및 Vidyo 아키텍처 검토

---

## 1. 대법원 마이그레이션 프로젝트 인프라 파악을 위한 개인 학습

대법원 마이그레이션 프로젝트의 **세부적인 인프라 상황을 파악**하기 위한  
프라이빗 클라우드 인프라 개인 학습 진행

-> Udemy 내 **AWS Solution Architect 과정** 중  
   **Private Cloud 섹션(VPC 관련)** 자료 검색 및 학습

---

### 시나리오 1.  
**물리 서버 → AWS Storage Gateway를 통해 백업 파일을 실시간 업로드**

- 사용 프로토콜: **NFS**
  - Windows의 SMB 방식과 유사
  - Linux 환경에서 사용되는 공유 폴더 프로토콜

---

### AWS Storage Gateway 서비스 옵션

- **File Gateway**
  - 파일 시스템 레벨
  - NFS / SMB 프로토콜 지원

- **Volume Gateway**
  - 블록 레벨
  - SAN 네트워크에서 사용하는 **iSCSI 프로토콜** 지원

- **Tape Gateway**
  - 테이프 백업 용도
  - VTL 프로토콜 사용
  - S3 Glacier 아카이브 서비스 전용

---

### 답

- **File Gateway 선택**
  - 파일 시스템 상의 데이터를 직접 이동(mov)하므로 File Gateway 사용

- **Volume Gateway가 적합하지 않은 이유**
  - EBS 스냅샷 형태로 블록 단위 저장
  - 파일 단위 실시간 접근 불가

---

### 해설

- Volume Gateway에서 사용하는 **iSCSI 프로토콜**
  - 공유 폴더 개념인 NFS의 **블록 단위 버전**
  - 공유 “볼륨”을 네트워크로 연결하는 개념

- 처리 계층 차이
  - File Gateway → 파일 시스템 레벨
  - Volume Gateway → 블록 레벨
  - 서로 완전히 다른 계층

- 블록 레벨에서는 파일 시스템의 파일을 직접 처리할 수 없음

---

### 대법원 인프라 구조와의 비교 및 정리

-> 대법원 환경과 대조 시  
   **SAN 볼륨 위에 NAS 공유 구조는 아키텍처적으로 문제 없음**

-> SAN을 사용하여 Private Cloud로 공유 볼륨을 올리는 작업은  
   블록 레벨 개념이며 파일 공유(NAS)와는 무관한 영역

-> NAS가 문제없이 동작하기 위한  
   **OS 파일 시스템 I/O 안정성 확보 여부는 스토리지 엔지니어 검토 사항**

---

### 블록 레벨 네트워크 장애 시 발생 가능한 문제

-> 블록 레벨 서비스에서 간헐적인 네트워크 순단 발생 시  
   메타데이터 일관성 문제가 발생하며 파일 시스템 손상 가능성 존재

---

### 파일 시스템에서의 “메타데이터”란?

파일의 **내용(contents)** 이 아닌  
파일이 어디에 있고, 어떻게 구성되어 있는지를 설명하는 정보

예시:
- 파일 이름
- 파일 크기 (size)
- 저장 블록 위치 (block pointer)
- 권한 (permission)
- 소유자
- 생성 / 수정 시간
- 디렉토리 구조 정보
- inode 정보 (ext4, xfs 등)

즉, 파일을 설명하는 “지도” 개념

---

### 메타데이터 불일치 예시

- 메타데이터에는 “100개 블록”으로 기록
  - 실제로는 95개 블록만 존재

- inode는 사용 중으로 표시
  - 실제 파일은 삭제됨

- 디렉토리 엔트리는 존재
  - inode는 이미 삭제됨

- 블록 포인터가 잘못된 위치를 가리킴

---

### 결론적 관점 정리

-> SAN 기반 네트워크가 불안정할 경우  
   NAS 사용 이전에 OS 전체 장애 발생 가능

-> OS가 손상되면 NAS 사용은 물론 Vidyo 서비스 자체도 정상 구동 불가

-> SAN은 네트워크 성능과 안정성 요구 수준이 매우 높은 구조

---

## 2. VidyoInsight 서비스 구조 (Docker 기반)

- VidyoInsight는 **Docker 기반 서비스**
- Docker Compose.yaml 파일에 정의된  
  **Launch Template 기반으로 서비스 기동**

- `docker compose down`
  - 모든 서비스 컨테이너 삭제

- `docker compose up -d`
  - 템플릿 기반 신규 서비스 생성

- 상태를 저장하지 않는 구조
  - **Stateless 서버**
  - 매번 템플릿에 의존하여 서비스 생성

---

### 시나리오 2. AWS Auto Scaling Group (ASG)

- 트래픽에 따라 서버 수를 자동으로 조절하는 서비스
- Launch Template 기반
  - Stateless EC2 인스턴스 생성 / 제거

- 정책 설정 가능 항목
  - 트래픽 증가 시 Scale-out
  - 서비스 준비 시간(sleep) 설정 가능

- Auto Scaling Group은
  - Stateful / Stateless 모두 지원

---

## 3. 대법원 동시 운영(Parallel Operation) 검토 사항

- **Blue-Green Deployment**
  - 두 개의 완전히 독립된 환경 구성
  - 테스트 완료 후 특정 시점에 스위치
  - Zero Downtime 마이그레이션 방식

- **Canary Deployment**
  - 트래픽 가중치 점진적 변경
  - 95%/5% → 80%/20% → 50%/50% → 0%/100%

- **Hybrid Deployment**
  - 독립 환경 구축 후
  - 가중치 기반 점진적 전환

---

### AWS 서비스 마이그레이션 선택 사항  
※ 구/신 서버 간 데이터 정합성은 미고려된 아키텍처

1) **Route 53 (GSLB)**
   - DNS 기반 50% / 50% 가중치 분산

2) **Application Load Balancer (ALB)**
   - AWS VPC 내부 L7 로드밸런서
   - 50% / 50% 트래픽 분산

3) **AWS Direct Connect**
   - 회사 백본망 라우터 ↔ AWS 글로벌 백본망 라우터
   - 물리 광회선 기반 다이렉트 연결

---

### 트래픽 분산 방식 비교

- **DNS(GSLB) 기반**
  - DNS → Client → Server
  - 즉시 트래픽 분산 가능

- **L7(ALB) 기반**
  - Client → L4 → ALB → Target
  - Target은 사설 IP만 지원
  - AWS NLB(L4)를 경유해야 Target 연결 가능
