12/13

※ DNS, VCM, WebRTC 설정내용


----------------------------------
[공통]
1. Ubuntu-24.04 VMware Workstation에 배포 
- dnsuser // <REDACTED_PASSWORD>
- vcmuser // <REDACTED_PASSWORD>
- vwebrtcuser // <REDACTED_PASSWORD>
- viuser // <REDACTED_PASSWORD>
(# passwd root -> <REDACTED_PASSWORD>)

2. 필수 라이브러리 설치
```bash
# apt update
# apt -y install vim
# apt -y install iputils-ping
# apt -y install net-tools
# apt -y install telnet
# apt -y install locales
# apt -y install chrony
# apt -y install traceroute
# apt -y install unzip zip
# apt -y install bash-completion
# apt -y install man-db
# apt -y install bind9 bind9-utils dnsutils ※ 실제 DNS 라이브러리
# apt -y install nginx ※ Vidyo Cloud Manager 용
# apt -y install sqlite3 ※ Vidyo Cloud Manager 용
# apt -y install apache2 
```


3. 고정 IP 할당
네트워크 설정 파일 경로: /etc/netplan/50-cloud-init.yaml
백업: 
```bash
# cp -aRf 50-cloud-init.yaml 50-cloud-init.yaml_20251213
# vi 50-cloud-init.yaml
```
```yaml
network:
  version: 2
  ethernets:
    ens33:
      dhcp4: no
      addresses:
        - 192.168.136.142/24
      routes:
        - to: default
          via: 192.168.136.2
      nameservers:
        addresses:
          - 192.168.136.142 (DNS 서버 주소 지정)
          - 8.8.8.8
```
```bash
# netplan generate && netplan apply
```

4. SSH 접속 가능 설정 (sshd 및 root 허용)
SSH 설정 경로: /etc/ssh/
SSH 호스트 생성: 
```bash
# ssh-keygen -A
```
백업: 
```bash
# cp -aRf sshd_config sshd_config_20251213
# vi sshd_config
```
```text
PermitRootLogin yes
```
```bash
# systemctl restart ssh
```

[DNS]
5. DNS 서버 설정
설정파일 위치: /etc/bind

(1) zone 추가
백업: 
```bash
# cp -aRf named.conf.local named.conf.local_20251213
```
zone 템플릿 복사: 
```bash
# cp -aRf /etc/bind/db.local /etc/bind/db.example.internal
```
zone 수정: 
```bash
# vi /etc/bind/db.example.internal
```
```zone
$TTL    604800
@       IN      SOA     ns.example.internal. admin.example.internal. (
                         2025121301     ; Serial
                         604800         ; Refresh
                          86400         ; Retry
                        2419200         ; Expire
                         604800 )       ; Negative Cache TTL

    IN  NS  ns.example.internal.

; DNS
ns              IN  A   192.168.136.142
dns             IN  A   192.168.136.142

; ========================
; Vidyo Portal / Cluster
; ========================
portal          IN  A   10.0.75.101          ; VPCluster (webinar/seminar)
portal2         IN  A   10.0.75.101          ; SUBCluster
vp01            IN  A   10.0.75.102          ; VP1
vp02            IN  A   10.0.75.103          ; VP2

; ========================
; Vidyo Gateway / Cluster
; ========================
vgw-cluster     IN  A   10.0.75.110          ; VGCluster
vgw01           IN  A   10.0.75.111          ; VG1
vgw02           IN  A   10.0.75.112          ; VG2

; ========================
; Vidyo Router (WEB/Turn/Web 분리)
; ========================
vr01            IN  A   10.0.75.131
vr01-turn       IN  A   10.0.75.132
vr01-web        IN  A   10.0.75.133

vr02            IN  A   10.0.75.134
vr02-turn       IN  A   10.0.75.135
vr02-web        IN  A   10.0.75.136

vr03            IN  A   10.0.75.137
vr03-turn       IN  A   10.0.75.138
vr03-web        IN  A   10.0.75.139

vr04            IN  A   10.0.75.140
vr04-turn       IN  A   10.0.75.141
vr04-web        IN  A   10.0.75.142

vr05            IN  A   10.0.75.143
vr05-turn       IN  A   10.0.75.144
vr05-web        IN  A   10.0.75.145

vr06            IN  A   10.0.75.146
vr06-turn       IN  A   10.0.75.147
vr06-web        IN  A   10.0.75.148

vr07            IN  A   10.0.75.149
vr07-turn       IN  A   10.0.75.150
vr07-web        IN  A   10.0.75.151

vr08            IN  A   10.0.75.152
vr08-turn       IN  A   10.0.75.153
vr08-web        IN  A   10.0.75.154

vr09            IN  A   10.0.75.155
vr09-turn       IN  A   10.0.75.156
vr09-web        IN  A   10.0.75.157

vr10            IN  A   10.0.75.158
vr10-turn       IN  A   10.0.75.159
vr10-web        IN  A   10.0.75.160

; ========================
; Vidyo Replay / Cluster
; ========================
replay-cluster  IN  A   10.0.75.191

replay01        IN  A   10.0.75.192
replay02        IN  A   10.0.75.193
replay03        IN  A   10.0.75.194
replay04        IN  A   10.0.75.195
replay05        IN  A   10.0.75.196
replay06        IN  A   10.0.75.197
replay07        IN  A   10.0.75.198
replay08        IN  A   10.0.75.199
replay09        IN  A   10.0.75.200
replay10        IN  A   10.0.75.201
replay11        IN  A   10.0.75.202
replay12        IN  A   10.0.75.203
replay13        IN  A   10.0.75.204
replay14        IN  A   10.0.75.205
replay15        IN  A   10.0.75.206
replay16        IN  A   10.0.75.207
replay17        IN  A   10.0.75.208
replay18        IN  A   10.0.75.209
replay19        IN  A   10.0.75.210
replay20        IN  A   10.0.75.211
replay21        IN  A   10.0.75.212
replay22        IN  A   10.0.75.213

; ========================
; Insight / Event / Manager / WebRTC / Admin
; ========================
insight01        IN  A   10.0.75.241
event01          IN  A   10.0.75.243
manager01        IN  A   10.0.75.245
webrtc01         IN  A   10.0.75.247
admin01          IN  A   10.0.75.249
```

(2) zone 적용: 
```bash
# named-checkzone example.internal /etc/bind/db.example.internal
zone example.internal/IN: loaded serial 2025121301
OK:
# systemctl restart bind9
```

(3) zone 테스트
```bash
# dig @127.0.0.1 vp01.example.internal
# dig @127.0.0.1 vr01-turn.example.internal
# dig @127.0.0.1 replay22.example.internal
```


----------------------------------
[Vidyo Cloud Manager]
6. 네트워크 설정에 DNS 서버 설정

7. https를 사용하기 위한 nginx 리버스 프록시 설정
서비스 시작: 
```bash
# systemctl enable --now nginx
```
SSL 인증서 경로 지정: 
```bash
# mkdir -p /etc/nginx/ssl
```
설정 파일 수정: 
```bash
# vi /etc/nginx/sites-available/app-6443
```
```nginx
server {
    listen 6443 ssl;
    server_name manager01.example.internal;

    ssl_certificate     /etc/nginx/ssl/fullchain.crt;
    ssl_certificate_key /etc/nginx/ssl/wildcard.key;

    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:8080;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 6443;

        proxy_redirect off;
    }
}
```
활성화: 
```bash
# ln -sf /etc/nginx/sites-available/app-6443 /etc/nginx/sites-enabled/app-6443
```
기존 서비스 삭제: 
```bash
# rm -f /etc/nginx/sites-enabled/default
```

8. 사설 SSL 인증서 생성 및 테스트
```bash
# mkdir -p ~/ca && cd ~/ca
CA 개인키: # openssl genrsa -out ca.key 4096
CA 인증서: # openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt
# openssl req -x509 -new -nodes -key ca.key -sha256 -days 3650 -out ca.crt
Country Name (2 letter code) [AU]:KR
State or Province Name (full name) [Some-State]:Seoul
Locality Name (eg, city) []:example
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Example Internal CA
Organizational Unit Name (eg, section) []:Example Internal CA
Common Name (e.g. server FQDN or YOUR name) []:<REDACTED_COMMON_NAME>
Email Address []:<REDACTED_EMAIL>
와일드카드 서버 개인키: # openssl genrsa -out wildcard.key 2048
CSR 생성: vi wildcard.cnf
```
```ini
[ req ]
default_bits       = 2048
prompt             = no
default_md         = sha256
req_extensions     = req_ext
distinguished_name = dn

[ dn ]
C  = KR
ST = Seoul
O  = example
CN = *.example.internal

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = *.example.internal
DNS.2 = example.internal
```
```bash
# openssl req -new -key wildcard.key -out wildcard.csr -config wildcard.cnf
서버 인증서 발급: 
openssl x509 -req -in wildcard.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out wildcard.crt -days 825 -sha256 -extensions req_ext -extfile wildcard.cnf
풀체인 생성(서버인증서+ca인증서): cat wildcard.crt ca.crt > fullchain.crt

테스트용 와일드카드 개인키랑, 풀체인을 /etc/nginx/ssl에 복사:
# cp -aRf wildcard.key /etc/nginx/ssl
# cp -aRf fullchain.crt /etc/nginx/ssl
```

8. nginx 서비스 반영
```bash
# nginx -t
# systemctl reload nginx
```

9. vcm 서비스 실행 테스트
```bash
# tar -xvpzf vcm.tar.gz
# cd vcm
```

10. vcm 디렉토리 안에 service_lnx.sh 실행 후 정상적으로 https로 접속 가능확인
```bash
# ./service_lnx.sh start
```


-------------------------------------------------
[VidyoConnect WebRTC]
1. VidyoConnectWeb.25.2.0.4180.zip 업로드
- /var/www/html에 압축해제: 
```bash
# unzip VidyoConnectWeb.25.2.0.4180.zip
```

2. apache2 설정
```bash
# systemctl enable --now apache2
# a2enmod ssl headers rewrite (SSL모듈활성화)
```

(0) 인증서 경로: /root/ssl/

(1) 443 포트만 리슨하도록 하는 설정
경로: /etc/apache2
파일백업: 
```bash
# cp -aRf ports.conf ports.conf_20251213
```
설정내역: 
```bash
# vi ports.conf
```
```text
#Listen 80 <- 얘만 주석처리
```

(2) 서버 이름 설정
```bash
# vi /etc/apache2/conf-available/servername.conf
```
```text
ServerName webrtc01.example.internal
```
```bash
# a2enconf servername
```

(3) 사이트 설정
```bash
# vi /etc/apache2/sites-available/webrtc01.example.internal.conf
```
```apache
<VirtualHost *:443>
    ServerName webrtc01.example.internal

    # ===== SSL =====
    SSLEngine on
    SSLCertificateFile      /root/ssl/wildcard.crt
    SSLCertificateKeyFile   /root/ssl/wildcard.key
    SSLCertificateChainFile /root/ssl/fullchain.crt

    # ===== Web root =====
    DocumentRoot /var/www/html

    <Directory /var/www/html>
        Require all granted
        Options -Indexes +FollowSymLinks
        AllowOverride None
        DirectoryIndex index.html

        # SPA 라우팅: 없는 경로만 index.html
        FallbackResource /index.html
    </Directory>

    # (선택) 보안 헤더
    <IfModule mod_headers.c>
        Header always set X-Content-Type-Options "nosniff"
        Header always set X-Frame-Options "SAMEORIGIN"
    </IfModule>

    ErrorLog  ${APACHE_LOG_DIR}/webrtc01_error.log
    CustomLog ${APACHE_LOG_DIR}/webrtc01_access.log combined
</VirtualHost>
```

※ 기본설정파일 비활성화 및 새로 생성한 사이트 설정 활성화
```bash
# a2dissite 000-default.conf 2>/dev/null || true
# a2dissite default-ssl.conf 2>/dev/null || true
# a2ensite webrtc01.example.internal.conf
# apache2ctl -t
# systemctl reload apache2
```

(4) 테스트 -> CORS Policy 이슈 외 정상 동작 확인
```text
https://192.168.136.145/index.html?portal=https://test.platform.example&roomKey=<REDACTED_ROOMKEY>
```


-------------------------------------------------
[VidyoInsights]
1. 도커설치
(1) 도커 공식 GPG 키 등록
```bash
# install -m 0755 -d /etc/apt/keyrings
# curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
# chmod a+r /etc/apt/keyrings/docker.gpg
```

(2) 도커 저장소 추가
```bash
# echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

(3) 도커 & 도커컴포즈 설치
```bash
# apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

(4) 서비스 시작
```bash
# systemctl enable docker
# systemctl start docker
```

2. VidyoInsights 파일 업로드 (여기까지만 해도 될듯)


-------------------------------------------------
[QCOW2 파일 변환 작업]

기존 문제점: DNS, 웹서버 등 우분투 리눅스를 사용해 만든 QCOW2 이미지 콘솔 접속 불가 이슈
- 확인결과, OVF는 문제가 없는 듯 하며, QCOW2 파일로 변환 시 문제가 발생한 것으로 추정됨.
- Windows에서 QCOW2로 변환하면 문제가 생기는 경우가 있다고 함.

1. Rocky Linux 로 VM 하나 UP 후 라이브러리 설치
```bash
# yum -y update
# yum -y install net-tools
# yum -y install telnet
# yum -y install traceroute
# yum -y install tcpdump
# yum -y install unzip zip
# yum -y install tar
# yum -y install qemu-img libguestfs-tools ※ QCOW2 변환 라이브러리
```

2. vmdk 업로드
```bash
# ll
합계 5004144
-rw-r--r--. 1 root root       7546 12월 13일  13:17 VidyoCloudManager-0.scoreboard
-rw-r--r--. 1 root root 2203713536 12월 13일  20:22 VidyoCloudManager-s001.vmdk
-rw-r--r--. 1 root root 1777139712 12월 13일  20:22 VidyoCloudManager-s002.vmdk
-rw-r--r--. 1 root root 1119289344 12월 13일  20:22 VidyoCloudManager-s003.vmdk
-rw-r--r--. 1 root root     524288 12월 13일  11:25 VidyoCloudManager-s004.vmdk
-rw-r--r--. 1 root root     524288 12월 13일  11:25 VidyoCloudManager-s005.vmdk
-rw-r--r--. 1 root root     131072 12월 13일  13:17 VidyoCloudManager-s006.vmdk
-rw-r--r--. 1 root root       8684 12월 13일  13:17 VidyoCloudManager.nvram
-rw-r--r--. 1 root root       7546 12월 13일  20:22 VidyoCloudManager.scoreboard
-rw-r--r--. 1 root root        778 12월 13일  20:13 VidyoCloudManager.vmdk
-rw-r--r--. 1 root root          0 12월 13일  11:25 VidyoCloudManager.vmsd
-rw-r--r--. 1 root root       3790 12월 13일  20:13 VidyoCloudManager.vmx
-rw-r--r--. 1 root root        272 12월 13일  11:25 VidyoCloudManager.vmxf
-rw-r--r--. 1 root root      53401 12월 13일  13:17 mksSandbox-0.log
-rw-r--r--. 1 root root      53402 12월 13일  20:22 mksSandbox.log
-rw-r--r--. 1 root root     290490 12월 13일  13:17 vmware-0.log
-rw-r--r--. 1 root root   11102642 12월 13일  13:17 vmware-vmx-0.dmp
-rw-r--r--. 1 root root   11111867 12월 13일  20:22 vmware-vmx.dmp
-rw-r--r--. 1 root root     255045 12월 13일  20:22 vmware.log
```

3. VMDK를 QCOW2 파일로 변환
```bash
# qemu-img convert -p -f vmdk -O qcow2 VidyoCloudManager.vmdk VidyoCloudManager.qcow2
# qemu-img convert -p -f vmdk -O qcow2 VidyoInsights.vmdk VidyoInsights.qcow2
# qemu-img convert -p -f vmdk -O qcow2 Ubuntu-24.04.vmdk Ubuntu-24.04.qcow2
# qemu-img convert -p -f vmdk -O qcow2 webrtc_ksc.vmdk webrtc_ksc.qcow2
# qemu-img convert -p -f vmdk -O qcow2 webrtc_elimnet-disk1.vmdk webrtc_elimnet.qcow2
```

4. # qemu-img info *.qcow2 파일로 corrupt 여부 확인


-------------
오픈스택 설치 과정
- 배포환경(venv): /opt/kolla-venv
- 배포환경을 통해 kolla-ansible 라이브러리 설치: /opt/kolla-venv/bin/kolla-ansible
- 배포환경에서 kolla-ansible 템플릿 복사: etc_example -> /etc/kolla로, all-in-one 복사
- 오픈스택 배포하기 위한 설정값 변경: globals.yml, passwords.yml(kolla-genpwd) ~/kolla-inventory 등등


1. OS 업그레이드 과정
```bash
# yum -y update
# yum -y upgrade
# yum -y install git vim python3 python3-pip python3-devel gcc libffi-devel openssl-devel chrony
# systemctl enable --now chronyd
# setenforce 0
# vi /etc/selinux/config -> SELINUX=disabled
```

2. 의존 패키지 및 Python 가상환경 준비
도커설치:
```bash
# yum -y install dnf-utils
# yum config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
# yum -y install docker-ce docker-ce-cli containerd.io
# systemctl enable --now docker
```

파이썬 환경구성:
```bash
# yum -y install python3-pip python3-venv git
# python3 -m venv /opt/kolla-venv
# source /opt/kolla-venv/bin/activate (이게 항상 되어있는상태)
# pip install -U pip
```

3. Kolla-Ansible 설치
```bash
# pip install --upgrade "git+https://opendev.org/openstack/kolla-ansible@stable/2025.1"
kolla-ansible 실행파일: /opt/kolla-venv/bin/kolla-ansible
# kolla-ansible --version
```

3. 설정 파일 준비
```bash
# mkdir -p /etc/kolla
# cp -r /opt/kolla-venv/share/kolla-ansible/etc_examples/kolla/* /etc/kolla
# cp /opt/kolla-venv/share/kolla-ansible/ansible/inventory/all-in-one /etc/kolla/
```

4. 비밀번호 생성
```bash
# kolla-genpwd
/etc/kolla/passwords.yml 자동 생성됨
```

5. 전역 설정 파일 편집
```bash
# vi /etc/kolla/globals.yml
```

필수 항목 설정 (없는 항목은 라인 추가):
```yaml
kolla_base_distro: "rocky"
kolla_install_type: "binary"
openstack_release: "2025.1"
network_interface: "ens160"
neutron_external_interface: "ens160"
kolla_internal_vip_address: "192.168.136.24" (안쓰는ip로)
kolla_container_engine: "docker"
enable_keystone: "yes"
enable_glance: "yes"
enable_nova: "yes"
enable_neutron: "yes"
enable_horizon: "yes"
neutron_plugin_agent: "openvswitch"
enable_cinder: "yes"
enable_cinder_backend_lvm: "yes"
enable_swift: "no"
enable_ceph: "no"
enable_heat: "no"
enable_barbican: "no"
enable_masakari: "no"
```

6. cinder 볼륨 설정 (VM에서 cinder-volumes이란 이름으로 disk 100G 추가)
```bash
# lsblk
nvme0n2     259:4    0  100G  0 disk
# pvcreate /dev/nvme0n2
# vgcreate cinder-volumes /dev/nvme0n2
# vgs
# vgdisplay cinder-volumes
```

6. 사전 점검 (prechecks)
```bash
# source /opt/kolla-venv/bin/activate (이게 항상 되어있는상태)
# export INVENTORY=/etc/kolla/all-in-one
# kolla-ansible bootstrap-servers -i $INVENTORY
# kolla-ansible prechecks -i $INVENTORY
```

7. OpenStack 배포
```bash
# kolla-ansible deploy -i $INVENTORY
# kolla-ansible post-deploy -i $INVENTOR
```

8. OpenStack CLI 환경 세팅(openrc)
post-deploy 후에 admin-openrc 생성됨.
```bash
# source /etc/kolla/admin-openrc.sh
# openstack service list
# openstack endpoint list
```


9. Horizon (Dashboard) 접속
브라우저에서 다음 주소 접속:
```text
http://192.168.244.140
```
기본 계정: admin
비밀번호: /etc/kolla/passwords.yml 내 keystone_admin_password 값 또는 수동으로 변경한 값 (<REDACTED_PASSWORD>)

10. Keystone DB에서 수동 비밀번호 변경
```bash
docker exec -it keystone bash
kolla_set_configs
keystone-manage --config-file /etc/keystone/keystone.conf \
  bootstrap \
  --username admin \
  --password <REDACTED_PASSWORD> \
  --project-name admin \
  --role-name admin \
  --service-name keystone \
  --admin-url http://192.168.244.140:5000/v3 \
  --public-url http://192.168.244.140:5000/v3 \
  --internal-url http://192.168.244.140:5000/v3
```

----------------------------------------------
✅ 1. LVM 환경 준비 (Controller 또는 Storage 노드)
# 예시: /dev/sdb 를 LVM용으로 사용
```bash
pvcreate /dev/sdb
vgcreate cinder-volumes /dev/nvme0n2
```


✅ 2. /etc/kolla/globals.yml 설정 및 node_custom_config 지정
```yaml
enable_cinder: "yes"
enable_cinder_backend_lvm: "yes"
node_custom_config: "/etc/kolla/config"
```


✅ 3. Cinder 재배포 (해당 서비스만)
```bash
kolla-ansible -i /etc/kolla/inventory/all-in-one reconfigure -t cinder
```


✅ 4. 서비스 상태 확인
```bash
docker ps | grep cinder
docker exec -it cinder_volume bash
```


✅ 5. 인증 파일 설정 후 테스트
컨테이너 또는 호스트에서 admin-openrc.sh 불러오기:
```bash
source /etc/kolla/admin-openrc.sh
```


✅ 6. Volume 생성
```bash
openstack volume create --size 1 test-volume
```


✅ 7. Volume 상태 확인
```bash
openstack volume list
# vi /etc/kolla/nova-compute/nova.conf
```

```ini
[DEFAULT]
compute_driver = libvirt.LibvirtDriver

[libvirt]
virt_type = qemu
connection_uri = qemu:///system
```

```bash
# docker exec -u root -it nova_compute kolla_set_configs
# docker restart nova_compute
```
