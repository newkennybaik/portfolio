# 오픈스택 DB에서 이미지 추출 예시

분당 오픈스택에서 이미지 추출 후 세종 오픈스택으로 이동 작업

---

## 1. 분당 오픈스택 접속

### (1) SSH 포트 변경
- 기존: 22  
- 변경: 2022

```bash
ssh -p 2022 root@10.20.1.12
source ~/contrabass-openrc
```

---

## 2. 이미지 파일 위치 확인

### (1) Glance 이미지 실제 파일 경로 확인

```bash
find / -type f -name '91dd94ed-0b76-4ccc-8091-34c8c3872732'
```

```text
/var/lib/glance/images/91dd94ed-0b76-4ccc-8091-34c8c3872732
```

---

### (2) OpenStack 이미지 목록 확인

```bash
openstack image list
```

```text
+--------------------------------------+-------------------------------------------+--------+
| ID                                   | Name                                      | Status |
+--------------------------------------+-------------------------------------------+--------+
| 91dd94ed-0b76-4ccc-8091-34c8c3872732 | Dns                                       | active |
| 92e1f19d-548c-4c82-8481-7ee2b2147293 | NAS_test                                  | active |
| 6aaf967c-5364-4335-928f-0b534b3453d0 | VidyoCloudManager                         | active |
| 2fcf9700-ed1b-4914-8424-9bea49d6dff1 | VidyoEventService                         | active |
| 62cf42b5-d0e6-4a32-9e84-741f9c00cee0 | VidyoGateway                              | active |
| 1b81a4c7-dc9f-4c88-b69e-57dfc2110e69 | VidyoInsights                             | active |
| f97b06f2-2ed6-4f09-bb04-7796e52be96f | VidyoPortal                               | active |
| af6c0ce9-08e8-4f01-b10e-fa50c1d492d0 | VidyoReplay                               | active |
| 0791ec37-99ca-473c-83e5-2c49bd4e68ea | VidyoRouter                               | active |
| c67bf0d1-6400-4548-a8be-79e378c85f5b | VidyoWebRTC                               | active |
| 2b515b04-fc96-4081-bd04-550fe8a8a957 | octavia-amphora-haproxy-2024.1-qemu.qcow2 | active |
| a2c5ef68-a1e4-464c-a5d5-db8ebb625e08 | ubuntu-24.04-iso                          | active |
| 384c4913-013c-4cc6-9586-99f4a7bbeb61 | ubuntu24.04.1                             | active |
```

---

## 3. 현재 문제점 및 진행 상황

### (1) 세종 오픈스택 작업 불가
- 현재 세종 오픈스택 환경에서 작업 불가 상태
- 오픈스택팀에서 **금일 야간 작업을 통해 분당/세종 간 작업 가능하도록 조치 예정**

---

## 4. Vidyo 서비스 이슈 정리

### (1) VidyoInsights 버그
- Stats Analyzer 호출 로직에 **외부 인터넷 연결을 필요로 하는 로직 포함**
- 해당 로직 수정 필요
- 일정:
  - 주말 중 픽스 배포 시 → 일요일 방문 예정
  - 실제 픽스 배포 시간: **금일 23:30**
  - 결과: **일요일 방문 확정**

---

### (2) VidyoEvent 이슈
- 소회의실 버튼 노출까지는 성공
- 실제 접속 불가 문제 지속
- 원인:
  - JWT 토큰 정보가 비어 있는 상태로 확인됨
- 현재 R&D 팀을 통해 추가 확인 중

---

### (3) VidyoReplay 클러스터 설정 불가
- 클러스터 구성 단계에서 진행 불가
- 해당 이슈 역시 R&D 팀 확인 중
