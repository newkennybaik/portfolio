# VMware Workstation Player NAT setting Overview
- 집에서 사용하는 홈 네트워크 랜선은 공인 IP로 연결돼있음. (211.*.*.*)
- VMware NAT 서비스(VMnet 8)로 물리적 라우터 없이 사설 IP를 VM에 할당하고 네트워크도 사용 가능하도록 하는 작업 진행
- VMware Workstation Pro 버전을 쓰면 Virtual Network Editor가 기본으로 제공되어 UI로 수정할 수 있지만 없으니 설정 파일을 통해 확인하면서 진행함
- 현재 설치한 서버는 Rocky Linux 9.5 버전임

# Steps

## 1. 리눅스 설치
- 설치 시, 네트워크 설정을 custom(VMnet 8) 혹은 NAT로 설정하여 설치
- 네트워크 설정 시 nmtui 명령어로 고정 IP 할당 - 192.168.136.128 (SUBNET: 255.255.255.0, GATEWAY: 192.168.136.2)
- ip route show 명령어로 DHCP 서버(192.168.136.2)에서 자동으로 할당 받은 정보 확인
```bash
# ip route show
default via 192.168.136.2 dev ens160 proto dhcp src 192.168.136.128 metric 100
192.168.136.0/24 dev ens160 proto kernel scope link src 192.168.136.128 metric 100
```

## 윈도우에서 VMware NAT 서비스 설정 확인 (ipconfig /all)
```bash
이더넷 어댑터 VMware Network Adapter VMnet8:
   연결별 DNS 접미사. . . . :
   설명. . . . . . . . . . . . : VMware Virtual Ethernet Adapter for VMnet8
   DHCP 사용 . . . . . . . . . : 예
   자동 구성 사용. . . . . . . : 예
   IPv4 주소 . . . . . . . . . : 192.168.136.1(기본 설정)
   서브넷 마스크 . . . . . . . : 255.255.255.0
   임대 시작 날짜. . . . . . . : 2025년 3월 16일 일요일 오전 8:52:50
   임대 만료 날짜. . . . . . . : 2025년 3월 16일 일요일 오후 1:53:00
   기본 게이트웨이 . . . . . . :
   DHCP 서버 . . . . . . . . . : 192.168.136.254
   주 WINS 서버. . . . . . . . : 192.168.136.2
   Tcpip를 통한 NetBIOS. . . . : 사용
```

- 위 대로라면 192.168.136.0/24가 대역이므로 192.168.136.3 ~ 192.168.136.253 까지는 사용 할 수 있어야 하는데 전부 다 사용하지는 못하는 듯함...
- 그리고 추가로 아래 윈도우 명령어로 현재 연결돼있는 인터넷 인터페이스 확인 가능. (192.168.136.0/24 게이트웨이는 기본적으로 노출 안하는 것으로 보임.)

```bash
> route print
===========================================================================
인터페이스 목록
 15...9c 6b 00 93 6f 37 ......Realtek PCIe GbE Family Controller
  6...00 50 56 c0 00 01 ......VMware Virtual Ethernet Adapter for VMnet1
  8...00 50 56 c0 00 08 ......VMware Virtual Ethernet Adapter for VMnet8
  1...........................Software Loopback Interface 1
===========================================================================

IPv4 경로 테이블
===========================================================================
활성 경로:
네트워크 대상      네트워크 마스크     게이트웨이      인터페이스    메트릭

    192.168.136.0    255.255.255.0             연결됨     192.168.136.1    291
    192.168.136.1  255.255.255.255             연결됨     192.168.136.1    291
  192.168.136.255  255.255.255.255             연결됨     192.168.136.1    291

```

## 3. VMware Workstation Player에서 Virtual Network Editor 설정을 확인 하는 방법

- C:\ProgramData\VMware\vmnetdhcp.conf 파일을 에디터로 열면 아래와 같이 range 항목에 192.168.136.128~192.168.136.253  까지 125 VM만 디폴트로 설정되어있다고 명시돼있더라

```bash
# Virtual ethernet segment 8
# Added at 03/04/25 23:57:39
subnet 192.168.136.0 netmask 255.255.255.0 {
range 192.168.136.128 192.168.136.254;            # default allows up to 125 VM's
option broadcast-address 192.168.136.255;
option domain-name-servers 192.168.136.2;
option domain-name "localdomain";
option netbios-name-servers 192.168.136.2;
option routers 192.168.136.2;
default-lease-time 1800;
max-lease-time 7200;
}
host VMnet8 {
    hardware ethernet 00:50:56:C0:00:08;
    fixed-address 192.168.136.1;
    option domain-name-servers 0.0.0.0;
    option domain-name "";
    option routers 0.0.0.0;
}
# End
# End


```

# Conclusion

## VMware NAT 서비스 관련 정리
- VMware는 기본적으로 DHCP 범위를 192.168.136.128 ~ 192.168.136.254로 설정함.
- 이는 예약된 IP 공간(2~127)을 유지하여, 수동 IP 할당을 방지하고 관리 목적으로 사용하기 위함이라고 Chatgpt가 그러더라.
- DHCP 범위를 3~253로 변경하고 싶다면, VMnetDHCP.conf 파일을 직접 수정 후 VMware DHCP 서비스를 재시작하면 됨.
- 현재 설정 그대로 둬도 정상 작동하지만, DHCP 범위를 확장하려면 수동으로 변경하면 됨.
- 이번 기회에 VMware의 NAT 동작 방식에 대해 좀 더 세부적으로 알게 되었다는 생각이 듬.
	
## 192.168.136.22로 설정하려고 노력한 흔적들...

1. GATEWAY가 192.168.136.1 인줄 알고 ping이 안가서 기겁함..
```bash
# ping -c 5 192.168.136.1
PING 192.168.136.1 (192.168.136.1) 56(84) bytes of data.
^C
--- 192.168.136.1 ping statistics ---
5 packets transmitted, 0 received, 100% packet loss, time 4122ms
```

2. 현재 ipv4에 사용되고 있는 IP 확인. 고정으로 해놓으면 ipv4.addresses,gateway 등에 설정됨.
```bash
# nmcli connection show ens160 | grep ipv4
ipv4.method:                            auto
ipv4.dns:                               --
ipv4.dns-search:                        --
ipv4.dns-options:                       --
ipv4.dns-priority:                      0
ipv4.addresses:                         --
ipv4.gateway:                           --
ipv4.routes:                            --
ipv4.route-metric:                      -1
ipv4.route-table:                       0 (unspec)
ipv4.routing-rules:                     --
ipv4.replace-local-rule:                -1 (default)
ipv4.dhcp-send-release:                 -1 (default)
ipv4.ignore-auto-routes:                no
ipv4.ignore-auto-dns:                   no
ipv4.dhcp-client-id:                    --
ipv4.dhcp-iaid:                         --
ipv4.dhcp-dscp:                         --
ipv4.dhcp-timeout:                      0 (default)
ipv4.dhcp-send-hostname:                yes
ipv4.dhcp-hostname:                     --
ipv4.dhcp-fqdn:                         --
ipv4.dhcp-hostname-flags:               0x0 (none)
ipv4.never-default:                     no
ipv4.may-fail:                          yes
ipv4.required-timeout:                  -1 (default)
ipv4.dad-timeout:                       -1 (default)
ipv4.dhcp-vendor-class-identifier:      --
ipv4.link-local:                        0 (default)
ipv4.dhcp-reject-servers:               --
ipv4.auto-route-ext-gw:                 -1 (default)
```

3. 서비스가 동작을 안하는 줄 알고 서비스를 재기동하거나, 윈도우 디펜더에 방화벽 추가해서 확인한 흔적들...
- VMware NAT, DHCP, Player는 내가 추가한 룰 적용. 이걸로 조치해도 해결이 안되더라.
```bash
> Restart-service "VMWare NAT Service"
> Restart-service "VMWARE DHCP Service"
> Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*VMware*" }

Name                          : {FE528314-8BDD-4D78-93E0-9A22EAA577D3}
DisplayName                   : VMware NAT 허용
Description                   :
DisplayGroup                  :
Group                         :
Enabled                       : True
Profile                       : Any
Platform                      : {}
Direction                     : Inbound
Action                        : Allow
EdgeTraversalPolicy           : Block
LooseSourceMapping            : False
LocalOnlyMapping              : False
Owner                         :
PrimaryStatus                 : OK
Status                        : 저장소에서 규칙을 구문 분석했습니다. (65536)
EnforcementStatus             : NotApplicable
PolicyStoreSource             : PersistentStore
PolicyStoreSourceType         : Local
RemoteDynamicKeywordAddresses : {}
PolicyAppId                   :
PackageFamilyName             :

Name                          : {5A838139-A16E-4D4A-87E3-FFB27F000B04}
DisplayName                   : VMware DHCP 허용
Description                   :
DisplayGroup                  :
Group                         :
Enabled                       : True
Profile                       : Any
Platform                      : {}
Direction                     : Inbound
Action                        : Allow
EdgeTraversalPolicy           : Block
LooseSourceMapping            : False
LocalOnlyMapping              : False
Owner                         :
PrimaryStatus                 : OK
Status                        : 저장소에서 규칙을 구문 분석했습니다. (65536)
EnforcementStatus             : NotApplicable
PolicyStoreSource             : PersistentStore
PolicyStoreSourceType         : Local
RemoteDynamicKeywordAddresses : {}
PolicyAppId                   :
PackageFamilyName             :

Name                          : {2DA55A4A-7F50-45CF-8D5B-990F00A79BC3}
DisplayName                   : VMware Workstation Player 허용
Description                   :
DisplayGroup                  :
Group                         :
Enabled                       : True
Profile                       : Any
Platform                      : {}
Direction                     : Inbound
Action                        : Allow
EdgeTraversalPolicy           : Block
LooseSourceMapping            : False
LocalOnlyMapping              : False
Owner                         :
PrimaryStatus                 : OK
Status                        : 저장소에서 규칙을 구문 분석했습니다. (65536)
EnforcementStatus             : NotApplicable
PolicyStoreSource             : PersistentStore
PolicyStoreSourceType         : Local
RemoteDynamicKeywordAddresses : {}
PolicyAppId                   :
PackageFamilyName             :
```