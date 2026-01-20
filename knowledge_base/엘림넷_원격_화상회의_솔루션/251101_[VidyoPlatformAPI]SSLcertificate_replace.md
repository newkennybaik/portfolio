# VidyoPlatformAPI SSL 인증서 교체 예시

1. 파트너 방문 회의

-> VidyoReplay 업그레이드 순서 관련 상의:

  ㄴ Replay 서버 업그레이드 외  
     개발환경 쪽에 전체 Vidyo 서버 SSL 인증서 갱신 필요 요청


2. VidyoReplay SSL 인증서 콘솔 업로드 테스트 내역

PFX 파일을 Linux 서버로 업로드  
(WinSCP, FileZilla 혹은 cmd 창에서 scp 명령어 사용)

명령어:
```bash
scp wildcard.example.com.pfx root@192.168.0.145:~/
```

리눅스 서버에서 apiuser 계정으로 SSH-RSA 키 생성 (Private & Public)

명령어:
```bash
ssh-keygen -t rsa -b 4096 -C "apiuser" -f ~/.ssh/apiuser -N "" && cat ~/.ssh/apiuser.pub
```

VidyoReplay 콘솔 화면에서  
Advanced → VidyoPlatformAPI User → Add User

-> apiuser 생성 후  
-> Update User Key 메뉴에서 위 Public Key 등록


PFX 파일을 SSH로 VidyoReplay  
(또는 VidyoEvent / 기타 Vidyo 서버) 콘솔로 업로드

명령어:
```bash
cat wildcard.example.com.pfx | ssh \
  -i ~/.ssh/apiuser \
  -o PubkeyAcceptedAlgorithms=+ssh-rsa \
  -o HostkeyAlgorithms=+ssh-rsa \
  apiuser@192.168.0.38 VidyoUpload
```

Vidyo 서버 콘솔에 업로드된 PFX 파일 적용

명령어:
```bash
echo -n ******** | ssh \
  -i ~/.ssh/apiuser \
  -o PubkeyAcceptedAlgorithms=+ssh-rsa \
  -o HostkeyAlgorithms=+ssh-rsa \
  apiuser@192.168.0.38 SSL_InstallPFX
```

(echo -n 뒤 값은 PFX 인증서 비밀번호)


Vidyo 서버 수동 재부팅 후 SSL 인증서 적용 여부 테스트  
(DNS 기준 호출 확인)

명령어:
```bash
openssl s_client -connect 192.168.0.38:443 | openssl x509 -noout -dates
```
