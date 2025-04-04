# Disk volume/storage capacity extension overview
Cient's requirements & Scenario
1. 현재 고객사에서는 여러 자회사 도메인을 갖고 있음.(a.com, a.co.kr, a-support.com 등)
2. 도메인별로 사용자 데이터가 분리되어 있으며, 같은 볼륨그룹(email_volume_group)에 포함되어 있지만 도메인은 다른 논리볼륨(LVM)으로 분리되어 있음
3. 각 논리볼륨은 알아볼수 있도록 번호를 매겨서 폴더에 마운트해서 사용중임(예: /data01, /data02, /data03)
4. 이번에 새로 디스크를 2개를 추가해서 새로 추가한 도메인(a_storage.com)에 할당을 요청함.
5. 2T 짜리 2개의 디스크를 하나의 볼륨그룹으로 포함시켜서 4T 짜리 하나의 디스크처럼 동작하도록 설정함. (RAID0처럼 여러 디스크에 분산저장 방식, disk striping이라고도 함.) 

# Steps

## 1. Sequence
- Partition 파티션 (Partition)
- Physical Volume 물리볼륨 (PV)
- Volume Group 볼륨그룹 (VG)
- Logical Volume 논리볼륨 (LV 또는 LVM)
- File System 파일시스템 (ext4, xfs)
- Mount 마운트

## 2. Partition - 각 디스크에 파티션 생성
```bash
parted /dev/vdj --script mklabel gpt mkpart primary 0% 100%
parted /dev/vdk --script mklabel gpt mkpart primary 0% 100%
```

장점:
- 사실 고객사 구조상 파티션을 나누는 작업은 필요없음, 크게 의미가 없다는 얘기임...
- 좋은 점은 파티션을 나누면 한 파티션이 가득차면 다른 파티션을 영향 받지 않음
- 특정 보안 목적으로 보안 마운트 옵션 적용 가능
- 블록 단위 백업 가능 (특정 파티션만 백업/복원 가능)
- 다중 OS 설치
- LVM, RAID, 암호화(LUKS) 대상 단위로 지정 가능하다고 함


## 3. Physical Volume 물리볼륨 (PV)

PV 초기화
```bash
# pvcreate /dev/vdj1 /dev/vdk1
```

## 4. Volume Group 볼륨그룹 (VG)

VG 확장
```bash
# vgextend email_volume_group /dev/vdj1 /dev/vdk1
```

## 5. Logical Volume 논리볼륨 (LV 또는 LVM)

LV 생성
```bash
# lvcreate -n vdjnk -L 4T email_volume_group
```

## 6. File System 파일시스템 (ext4, xfs)

파일 시스템 생성 - DB용이므로 xfs사용
```bash
# mkfs.xfs /dev/email_volume_group/vdjnk
```

## 7. Mount 마운트

마운트는 /data5에 함
```bash
# mount /dev/email_volume_group /data05
```

# Disk Check
- PV, VG, LV in consecutive manner

```bash
# pvs (물리볼륨)
  PV         VG     Fmt  Attr PSize     PFree
  /dev/v***  information_technology_volume_group   lvm2 a--   <100.00g    0
  /dev/v***  information_technology_volume_group   lvm2 a--   <100.00g    0
  /dev/v***  information_technology_volume_group   lvm2 a--   <100.00g    0
  /dev/v***  email_volume_group lvm2 a--      2.95t    0
  /dev/v***  email_volume_group lvm2 a--  <1000.00g    0
  /dev/v***  email_volume_group lvm2 a--  <1000.00g    0
  /dev/v***  email_volume_group lvm2 a--  <1000.00g    0
  /dev/v***  email_volume_group lvm2 a--  <1000.00g    0
  /dev/v***  email_volume_group lvm2 a--  <1000.00g    0
  /dev/v***  email_volume_group lvm2 a--  <1000.00g    0
  /dev/vdj1  email_volume_group lvm2 a--     <2.00t    0
  /dev/vdk1  email_volume_group lvm2 a--     <2.00t    0

# vgs (볼륨그룹)
  VG     #PV #LV #SN Attr   VSize    VFree
  information_technology_volume_group     3   1   0 wz--n- <***.**g    0
  email_volume_group   9   5   0 wz--n-   ***.**t    0

# lvs (논리볼륨)
  LV      VG     Attr       LSize     Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  info_v1    information_technology_volume_group   -wi-ao----  <***.**g
  maillv1 mailvg -wi-ao----     1.95t
  maillv2 mailvg -wi-ao----    <2.54t
  maillv3 mailvg -wi-ao----     2.34t
  maillv4 mailvg -wi-ao---- <1000.00g
  mailvg5 mailvg -wi-ao----    <4.00t
```