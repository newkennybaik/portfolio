# 오픈스택 Kolla-Ansible 구축 예시

---

## 1. OS 업그레이드 과정

```bash
sudo apt update && sudo apt upgrade -y
sudo do-release-upgrade
sudo reboot
```

---

## 2. 의존 패키지 및 Python 가상환경 준비

```bash
dnf install -y python3-pip python3-venv git
python3 -m venv /opt/kolla-venv
source /opt/kolla-venv/bin/activate
pip install -U pip
```

---

## 3. Kolla-Ansible 설치

```bash
pip install kolla-ansible
```

- kolla-ansible 실행 파일 경로  
  `/opt/kolla-venv/bin/kolla-ansible`

---

## 4. 설정 파일 준비

```bash
mkdir -p /etc/kolla
cp -r /opt/kolla-venv/share/kolla-ansible/etc_examples/kolla/* /etc/kolla
cp /opt/kolla-venv/share/kolla-ansible/ansible/inventory/all-in-one ~/kolla-inventory
```

---

## 5. 비밀번호 생성

```bash
kolla-genpwd
```

- `/etc/kolla/passwords.yml` 자동 생성됨

---

## 6. 전역 설정 파일 편집

```bash
vi /etc/kolla/globals.yml
```

필수 항목 설정:

```yaml
kolla_base_distro: "rocky"
kolla_install_type: "source"
openstack_release: "2024.1"
network_interface: "ens160"
neutron_external_interface: "ens160"
kolla_internal_vip_address: "192.168.244.140"
enable_horizon: "yes"
```

---

## 7. 사전 점검 (Prechecks)

```bash
kolla-ansible -i ~/kolla-inventory bootstrap-servers
kolla-ansible -i ~/kolla-inventory prechecks
```

---

## 8. OpenStack 배포

```bash
kolla-ansible -i ~/kolla-inventory deploy
```

---

## 9. admin openrc 생성

```bash
kolla-ansible post-deploy
cp /etc/kolla/admin-openrc.sh ~/
source ~/admin-openrc.sh
```

---

## 10. Horizon (Dashboard) 접속

- 접속 주소:  
  `http://192.168.244.140`

- 기본 계정  
  - ID: `admin`  
  - 비밀번호:  
    `/etc/kolla/passwords.yml` 내 `keystone_admin_password`  
    또는 수동 변경 값 (예: `admin123`)

---

## 11. Keystone DB에서 수동 비밀번호 변경

```bash
docker exec -it keystone bash
kolla_set_configs
keystone-manage --config-file /etc/keystone/keystone.conf \
  bootstrap \
  --username admin \
  --password admin123 \
  --project-name admin \
  --role-name admin \
  --service-name keystone \
  --admin-url http://192.168.244.140:5000/v3 \
  --public-url http://192.168.244.140:5000/v3 \
  --internal-url http://192.168.244.140:5000/v3
```

---

## Cinder LVM 백엔드 설정 예시

### 1. LVM 환경 준비 (Controller 또는 Storage 노드)

```bash
pvcreate /dev/sdb
vgcreate cinder-volumes /dev/nvme0n2
```

---

### 2. globals.yml 설정 및 node_custom_config 지정

```yaml
enable_cinder: "yes"
enable_cinder_backend_lvm: "yes"
node_custom_config: "/etc/kolla/config"
```

---

### 3. Cinder 서비스 재배포 (해당 서비스만)

```bash
kolla-ansible -i /etc/kolla/inventory/all-in-one reconfigure -t cinder
```

---

### 4. 서비스 상태 확인

```bash
docker ps | grep cinder
docker exec -it cinder_volume bash
```

---

### 5. 인증 파일 설정 후 테스트

```bash
source /etc/kolla/admin-openrc.sh
```

---

### 6. Volume 생성

```bash
openstack volume create --size 1 test-volume
```

---

### 7. Volume 상태 확인

```bash
openstack volume list
```

---

## Nova Compute 설정 (QEMU 사용)

```bash
vi /etc/kolla/nova-compute/nova.conf
```

```ini
[DEFAULT]
compute_driver = libvirt.LibvirtDriver

[libvirt]
virt_type = qemu
connection_uri = qemu:///system
```

```bash
docker exec -u root -it nova_compute kolla_set_configs
docker restart nova_compute
```
