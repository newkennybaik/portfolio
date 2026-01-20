# VidyoPlatformAPI 서버 버전 업그레이드 예시

## 파트너 요청사항  
(1) 요청 테스트 내용:
1. OVA배포: VidyoReplay 22.2.5.70
2. Replay웹페이지-유지보수 탭에서 24.2.0.vidyo 파일 업로드 및 업그레이드
3. DNS서버에서 25.1.1 로 업그레이드
4. Cluser 테스트결과: 노드 정상적으로 로그인 가능하였음


## 순서
1) 25.1.1.vidyo 업그레이드 파일 FTP로 같은 네트워크 대역 아무 리눅스 서버(Ubuntu/RockyLinux/RHEL)에 업로드
2) 리눅스 서버에서 apiuser라는 계정이름으로 SSH-RSA 키생성 (Private & Public)

```bash
# ssh-keygen -t rsa -b 4096 -C "apiuser" -f ~/.ssh/apiuser -N ""
# cat ~/.ssh/apiuser.pub
```

```text
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDICHf27nnTjejVQNvHxA5krvdsx2RRisjRre3fvJNcCwZtf4RnP36LVX/4HUkBF4e+oi5Of1MXoIY7brkeNBPpEoVMulMl4+/5xJmhnPNFm7m5KBWoezgNoI0J/migkkY6l+65K8l/Pm+3XeEwRmjNddtFnM9lV41Vza2TJNQQvCocRdX5S5LvClCdfonuLebneNTu3nxNc5gW/aYwPFdrai2P1DLotXK1XdYGwsmJFSdehJslf/auEWVez37ZKUsVC8VIZPt2DHyyumOr150nNgxwzZstU3638JJvnjg4+PBwg+ZSdXy748lmx7NM3Kg3XzVjZ+Ieq+4jbUDMujDbH8ipZDUSTm0dt3gACVOAbvEyPuLjckXGC27xRJ6fhjs+6hqyw52hGpdiIUKA2uQvTH+h9ViVfRAhO6F9ELCxWXbsPivTaMS3GsEmf+xjA+KFHPyWoepp2Nd5Iqa4RNKWxLciA0Z5rPzcn8l1HwSJ4AhLT+Z1hxrfNRMGnkNareO5oPuvYGz/J1IxgMPY7J+o27yKpRgGAKX3zwoMmr+zNc7HOjpbLXLP2Q/+VODo8zWh4xSoK/RQReXlfVv9Dcg+WTFOD83KZOc6F8Efr8ZZGGeDsAWTQFR9au+SA7xCuoGwnFq6TLWnd9cbsnv+w+Pe+K6Q9uMXZbnaRcDBJN4nTw== apiuser
```

3) VidyoReplay 콘솔 접속 후 Advanced - VidyoPlatformAPI User - Add User로 apiuser 생성
-> Update User Key를 통해 위 ssh-rsa Public Key 붙여넣기
4) 리눅스 서버에서 업로드 및 업데이트

업로드:

```bash
# cat rp-TAG_RP_25.1.1.246-bundle-v0903.vidyo | ssh \
  -i ~/.ssh/apiuser \
  -o PubkeyAcceptedAlgorithms=+ssh-rsa \
  -o HostkeyAlgorithms=+ssh-rsa \
  apiuser@192.168.0.38 VidyoUpload
```

업데이트: 

```bash
# ssh \
  -i ~/.ssh/apiuser \
  -o PubkeyAcceptedAlgorithms=+ssh-rsa \
  -o HostkeyAlgorithms=+ssh-rsa \
  -o IdentitiesOnly=yes \
  apiuser@192.168.0.38 VidyoUpdate
```

5) VidyoPortal과 VidyoRouter 업데이트
-> 22.4.15.7071에서 24.1.0.12049로 각자 업데이트 
특이사항: Router를 연결한 상태에서 업그레이드 시, 503에러와 함께 Portal 웹이 접속 불가하게됨. 따라서 Router의 포털 설정을 localhost로 바꿔놓고 Portal을 업그레이드 함.
