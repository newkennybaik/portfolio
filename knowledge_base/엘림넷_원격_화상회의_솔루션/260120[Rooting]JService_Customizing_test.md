# LAB: 제품 Rooting / Appliance Customizing 테스트 (익명)

## 파일시스템 접근 및 계정 비밀번호 강제 변경 (Ubuntu 22.04)

apt -y update
apt -y install qemu-utils btrfs-progs
modprobe btrfs

qemu-img convert -p -O raw <PRODUCT>-disk1.vmdk disk.raw
losetup -fP disk.raw
losetup -a
lsblk -f /dev/loop0

mount -t btrfs -o rw /dev/loop0p3 /mnt
find /mnt -maxdepth 4 -type f -name shadow
btrfs property set -ts /mnt/factory ro false
btrfs property set -ts /mnt/working ro false
umount /mnt
losetup -d /dev/loop0
qemu-img convert -p -f raw -O vmdk disk.raw <PRODUCT>-disk1.vmdk

## Event / Portal 연동 테스트 (사전 설정 완료 상태)

# NATS 인증 활성화 및 사용자 생성 (콘솔 작업 후)

# JWT Secret 생성 (동일 네트워크 내 리눅스 서버)
curl -k -X PUT -u super:<REDACTED> https://<PORTAL_FQDN>/admin/api/v1/system/tenants/jwtAuthenticationSecret

# Breakout Room 활성화 (Tenant 단위)
curl -k -X PUT https://<PORTAL_FQDN>/service/systemconfig/v1/tenant/<TENANT_ID>/configuration \
  -u "super:<REDACTED>" -H "Content-Type: application/json" \
  -d '{"breakoutRoomsEnabled": true}'

# Event 서비스 URL 및 NATS Cluster ID 설정
curl -k -X PUT https://<PORTAL_FQDN>/admin/service/systemconfig/v1/configuration \
  -u "super:<REDACTED>" -H "Content-Type: application/json" \
  -d '{"EVENT_SERVER_URL": "wss://<EVENT_FQDN>","MESSAGING_SERVER_CLUSTER_ID": "vidyo-nats-streaming"}'

# NATS 사용자 등록
curl -k -X PUT https://<PORTAL_FQDN>/admin/service/systemconfig/v1/configuration \
  -u "super:<REDACTED>" -H "Content-Type: application/json" \
  -d '{"MESSAGING_NODE_CONFIGURATION":[{"messagingServerUrl":"tls://<EVENT_FQDN>","username":"<USER>","password":"<REDACTED>"}]}'

# 설정값 확인
curl -vk -u super:<REDACTED> "https://<PORTAL_FQDN>/admin/service/systemconfig/v1/configuration"
curl -vk -u super:<REDACTED> "https://<PORTAL_FQDN>/service/systemconfig/v1/tenant/<TENANT_ID>/configuration"

## WebRTC 정적 리소스 배포 (Apache)

mkdir -p /var/www/web
chown -R www-data:www-data /var/www/web
chmod -R 755 /var/www/web

cp -aRf /etc/apache2/sites-available/ssl /etc/apache2/sites-available/ssl_$(date +%Y%m%d)
vi /etc/apache2/sites-available/<WEBRTC_SSL_CONF>.conf

/opt/vidyo/app/apache2/bin/apachectl -t
systemctl reload apache2

## Portal WebRTC 사용 설정 (콘솔 작업 후)

# CORS Policy 등록
curl -k -X POST -u super:<REDACTED> -v -H "Content-Type: application/json" \
  -d '{"domain":"<WEBRTC_FQDN>","context":"*"}' \
  https://<PORTAL_FQDN>/admin/api/v1/system/tenants/cors

curl -k -X POST -u super:<REDACTED> -v -H "Content-Type: application/json" \
  -d '{"domain":"<PORTAL_FQDN>","context":"*"}' \
  https://<PORTAL_FQDN>/admin/api/v1/system/tenants/cors
