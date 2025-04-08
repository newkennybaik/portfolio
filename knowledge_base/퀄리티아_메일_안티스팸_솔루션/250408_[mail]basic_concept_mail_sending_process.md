# Mail Sending Proces Overview
1. 메일 발송에 대한 기본적인 개념 정리. The purpose of this project is to organise and summmarise the fundamental concepts of email sending, as defined in RFC 5321 & RFC 5322
2. 메일/안티스팸 솔루션을 다루기 위해 가장 기본적으로 알아야 할 부분에 대한 설명
3. 퀄리티아의 메일과 실제 RFC 규약에 정의되어 있는 부분을 접목시켜서 정리하기 위한 용도.

# Steps

## 1. 용어 정리
```bash
구성요소	의미	역할
MUA (Mail User Agent): 간단히 얘기해 이메일 클라이언트 (Outlook, Thunderbird, 네이버 메일페이지 등)	사용자가 작성한 메일을 MSA로 전달
MSA (Mail Submission Agent): 메일 송신 게이트웨이 (SMTP 포트 25)	사용자로부터 메일을 받아 송신 준비
DNS	도메인 이름 시스템	수신 도메인의 MX 레코드를 조회하여 수신 서버를 확인
MTA (Mail Transfer Agent)	메일 라우팅 서버 (Postfix, Exim 등)	메일을 적절한 수신 서버로 중계 또는 전달
MDA (Mail Delivery Agent)	메일 저장/배달 시스템 (Dovecot, Maildir 등)	최종적으로 수신자의 메일함에 저장
수신자 MUA	메일 클라이언트 (수신자 측)	받은 메일을 POP3/IMAP으로 확인
```

## 2. Sequence - 메일 발송 구조 전체 흐름 요약
```bash
사용자 → MUA → MSA → DNS → 송신자의 MTA → 수신자의 MTA → MDA → 수신자
**송신자의 MSA, DNS 조회 단계 ,MTA 단계를 통틀어서 송신자의 MTA라고 단순화해서 말할 수 있음.

즉, 전체적인 메일 송신 구조는 아래와 같음.  
```

```bash
사용자 → MUA → **송신자의 MTA → 수신자의 MTA → MDA → 수신자
```

- 직관적으로는 아래와 같음.
```bash
┌──────────────────────────────┐
│송신자의 메일 클라이언트(MUA)   │
└──────────────────────────────┘
-> 네트워크/DNS 상에서 SMTP 통신 (MTA <> MTA)
┌──────────────────────────────┐
│수신자의 메일 클라이언트(MUA)   │
└──────────────────────────────┘
```


## 3. SMTP 통신 명령어
- 테스트는 OS에 설치되어 있는 텔넷 클라이언트로 메일발송 가능하며, 아래와 같이 RFC 규약에 명시되어 있는 명령어로 테스트 가능.

✅ 1. SMTP 통신 중 명령 (RFC 5321)
→ 클라이언트와 메일 서버 간의 SMTP 대화 프로토콜
```bash
명령어	설명	필수 여부
EHLO or HELO	송신자 서버가 자신의 도메인/IP를 알림	✅
MAIL FROM:<address>	발신자 주소 지정	✅
RCPT TO:<address>	수신자 주소 지정 (1명 이상 가능)	✅
DATA	본문/헤더 시작 알림	✅
QUIT	SMTP 세션 종료	✅
RSET	세션 초기화	⛔ (선택)
VRFY, EXPN	사용자 존재 확인 (보안상 비권장)	⛔
STARTTLS	TLS 보안 연결 시작 (옵션)	✅ (보안 필요 시)
AUTH	SMTP 인증 (로그인 등)	옵션 (SMTP-AUTH 시 필요)
```

✅ 2. 메일 헤더 필드 (RFC 5322)
→ DATA 이후에 등장하는 메일의 구조 정보 (실제 메일 내용 포함)
```bash
헤더 필드	설명	필수 여부
From:	발신자 이메일 주소	✅
To:	수신자 이메일 주소	✅
Subject:	메일 제목	❌ (권장)
Date:	메일 작성 일시	✅
Message-ID:	고유한 메일 식별자	✅
Cc:	참조 수신자	❌
Bcc:	숨은 참조	❌ (본문엔 포함 X)
Reply-To:	답장용 주소 (From과 다를 경우)	❌
Content-Type:	MIME 타입 정의 (text/plain, multipart 등)	✅ (실제 메시지 해석 위해 필수)
MIME-Version:	MIME 버전 (1.0)	✅ (MIME 메시지일 경우)
```

## 4. SMTP 통신 명령어로 테스트 사례
- 예를 들어서 네이버는 아래 서버들을 사용하며, 계정이 없어도 텔넷 명령어를 통해 서버를 빌려서 메일을 발송하는 것이 가능함.
```bash
>nslookup -q=mx naver.com
서버:    dns.google
Address:  8.8.8.8

권한 없는 응답:
naver.com       MX preference = 10, mail exchanger = mx1.naver.com
naver.com       MX preference = 10, mail exchanger = mx2.naver.com
naver.com       MX preference = 20, mail exchanger = mx5.mail.naver.com
naver.com       MX preference = 20, mail exchanger = mx6.mail.naver.com
naver.com       MX preference = 20, mail exchanger = mx4.mail.naver.com
naver.com       MX preference = 10, mail exchanger = mx3.naver.com
```

- 테스트로 메일 발송. 아래와 같이 메일을 발송하면 계정이 없어도 같은 네이버 사용자에게는 수신이 정상적으로 됨.
```bash
# telnet mx1.naver.com 25
Trying 125.209.238.100...
Connected to mx1.naver.com.
Escape character is '^]'.
220 mx.naver.com ESMTP n8yMoBhvQjKS2aPWW5Vp+g - nsmtp
ehlo test
250-mx.naver.com Pleased to meet you
250-SIZE 41943040
250-8BITMIME
250-PIPELINING
250-SMTPUTF8
250-STARTTLS
250 ENHANCEDSTATUSCODES
mail from: <jkbaik@qualitia.co.kr>
250 2.1.0 OK n8yMoBhvQjKS2aPWW5Vp+g - nsmtp
rcpt to: <newkennybaik@naver.com>
250 2.1.5 OK n8yMoBhvQjKS2aPWW5Vp+g - nsmtp
data
354 Go ahead n8yMoBhvQjKS2aPWW5Vp+g - nsmtp
subject: test mail
from: test@test.com
to: test@naver.com

the test mail has been sent.
.
250 2.0.0 OK n8yMoBhvQjKS2aPWW5Vp+g - nsmtp

```

- 아래는 퀄리티아의 WBlock 스팸 서버에서 SMTP 세션을 테스트한 사례:
```bash
# telnet localhost 25

Trying 127.0.0.1...
Connected to localhost.
Escape character is '^]'.
220 jkbaik.com ESMTP DEEPSoft WBlock.s.c 5.04.887; Sat, 5 Apr 2025 12:19:20 +0900
ehlo test
250-antispam.jkbaik.com [127.0.0.1], pleased to meet you
250-8BITMIME
250-PIPELINING
250-STARTTLS
250 HELP
mail from: <test@test.com>
250 test@test.com... Sender OK
rcpt to: <newkennybaik@naver.com>
250 newkennybaik@naver.com... Recipient OK
data
354 Enter mail, end with "." on a line by itself
subject: another test mail from wblockg5
to: test@test.com
from: jkbaik@qualitia.co.kr

test mail has been sent for testing purposes.
.
250 Message accepted for delivery.

```

### 5. SMTP 세션을 분석하여 메일이 정상수신 여부를 확인하는 방법
- 메일 패킷을 분석하는 사례에 대한 설명

```bash
# grep 7490400342781499835 smtp.log.20250407121807.log
2025/04/07 11:58:53 [24982/2642852752/1] [7490400342781499835] Connected from [192.168.136.88]
2025/04/07 11:58:53 [24982/2642852752/2] [7490400342781499835] Filter Con : res[0] name[] act[0] save[0]
2025/04/07 11:58:53 [24982/2642852752/2] [7490400342781499835] Filter BlockTerm : res[0] name[] act[0] save[0]
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] <<< 220 deepsoft.co.kr ESMTP AntiSpam Service ready at Mon, 7 Apr 2025 11:58:53 +0900
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] >>> EHLO test.outbound.protection.outlook.com
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] <<< 250-antispam.deepsoft.co.kr [192.168.136.88], pleased to meet you
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] >>> STARTTLS
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] <<< 220 Ready to start TLS
2025/04/07 11:58:53 [24982/2642852752/0] [7490400342781499835] [INFO] Protocol version used for TLS connections. [TLSv1.3]
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] >>> EHLO test.outbound.protection.outlook.com
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] <<< 250-antispam.deepsoft.co.kr [192.168.136.88], pleased to meet you
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] >>> MAIL FROM:<test@test.com>
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] <<< 250 test@test.com... Sender OK
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] >>> RCPT TO:<jkbaik@qualitia.co.kr>
2025/04/07 11:58:53 [24982/2642852752/0] [7490400342781499835] [INFO] AddEnvTo() - To[jkbaik@deepsoft.co.kr], InputTo[jkbaik@qualitia.co.kr], DomainIdx[1], GroupIdx[0], UserIdx[2742], UseAntiSpam[1], UseAntiSpamForUser[1]
2025/04/07 11:58:53 [24982/2642852752/0] [7490400342781499835] [Malware] Filter Malware - Zombie filtering is not supported, because Zombie check not used.
2025/04/07 11:58:53 [24982/2642852752/2] [7490400342781499835] Filter Rcpt : res[0] name[] act[0] save[0]
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] <<< 250 jkbaik@qualitia.co.kr... Recipient OK
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] >>> DATA
2025/04/07 11:58:53 [24982/2642852752/3] [7490400342781499835] <<< 354 Enter mail, end with "." on a line by itself
2025/04/07 11:58:54 [24982/2642852752/1] [7490400342781499835] from=test@test.com, size=59349, nrcpts=1, to0=jkbaik@qualitia.co.kr
2025/04/07 11:58:54 [24982/2642852752/1] [7490400342781499835] subject=[메일제목이므로 비공개]
2025/04/07 11:58:54 [24982/2642852752/0] [7490400342781499835] [INFO] CountryCode [UnKnown/US]
2025/04/07 11:58:54 [24982/2642852752/2] [7490400342781499835] Filter Virus - Virus Check Start
2025/04/07 11:58:54 [24982/2642852752/0] [7490400342781499835] Filter Virus - Extract attachment file name done. [image001.jpg]
2025/04/07 11:58:54 [24982/2642852752/0] [7490400342781499835] Filter Virus - Save attachment done. [/usr/local/DEEPSoft/WBlockG5/service/smtp/buf/7490400342781499835/1.jpg]
2025/04/07 11:58:54 [24982/2642852752/0] [7490400342781499835] Filter Virus - Cyren virus check start... [image001.jpg]
2025/04/07 11:58:54 [24982/2642852752/0] [7490400342781499835] Filter Virus - Cyren virus check is none. [image001.jpg]
2025/04/07 11:58:54 [24982/2642852752/0] [7490400342781499835] Filter Virus - Sophos virus check start... [image001.jpg]
2025/04/07 11:58:54 [24982/2642852752/0] [7490400342781499835] Filter Virus - Sophos virus check is none. [image001.jpg]
2025/04/07 11:58:54 [24982/2642852752/2] [7490400342781499835] Filter Virus - Virus Check Result None
2025/04/07 11:58:55 [24982/2642852752/2] [7490400342781499835] Filter Virus - Virus Prevention Check Result None
2025/04/07 11:58:55 [24982/2642852752/2] [7490400342781499835] Filter Msg - LimitSizeFilter [TO] : res[0] name[] act[0] save[0]
2025/04/07 11:58:55 [24982/2642852752/2] [7490400342781499835] Filter Msg - UserDefineFilter [TO] : res[0] name[] idx[-1] act[0] save[0]
2025/04/07 11:58:58 [24982/2642852752/2] [7490400342781499835] Filter Msg - DWL, DBL, SenderFilter [TO] : res[0] name[] act[0] save[0]
2025/04/07 11:58:58 [24982/2642852752/0] [7490400342781499835] [FilterMsg Keyword] begin, user [jkbaik@deepsoft.co.kr]
2025/04/07 11:58:58 [24982/2642852752/0] [7490400342781499835] [FilterMsg Keyword] finish
2025/04/07 11:58:59 [24982/2642852752/0] [7490400342781499835] [FilterMsg DHScan] begin, user [jkbaik@deepsoft.co.kr]
2025/04/07 11:59:00 [24982/2642852752/0] [7490400342781499835] [FilterMsg DHScan] finish
2025/04/07 11:59:00 [24982/2642852752/1] [7490400342781499835] DHScan - PatternFilter User[jkbaik@qualitia.co.kr] Status[2] Name[DHScan[0:]] UserFilterLevel[3]
2025/04/07 11:59:00 [24982/2642852752/2] [7490400342781499835] Filter Msg - PatternFilter, Etc [TO] : res[0] name[] act[0] save[0]
2025/04/07 11:59:00 [24982/2642852752/1] [7490400342781499835] DIScan - FilterMsg DIScan User[jkbaik@qualitia.co.kr] Status[2] Name[SPF Except[192.168.136.88]]
2025/04/07 11:59:00 [24982/2642852752/2] [7490400342781499835] Filter DIScan - Is None
2025/04/07 11:59:00 [24982/2642852752/2] [7490400342781499835] [Malware] Filter Malware - Ransomware [TO] User[jkbaik@qualitia.co.kr] : res[0] name[Ransom[0:]] idx[-2] act[0] save[0]
2025/04/07 11:59:00 [24982/2642852752/2] [7490400342781499835] [Malware] Filter Malware - APT [TO] User[jkbaik@qualitia.co.kr] : res[0] name[Apt[0:]] idx[-2] act[0] save[0]
2025/04/07 11:59:00 [24982/2642852752/1] [7490400342781499835] Queued for [qualitia.co.kr] in /usr/local/DEEPSoft/WBlockG5/queue/local/003/7490400342781499835.0
2025/04/07 11:59:00 [24982/2642852752/3] [7490400342781499835] Saving in /usr/local/DEEPSoft/WBlockG5/quarantine/copy/20250407/1158/7490400342781499835.eml is done
2025/04/07 11:59:00 [24982/2642852752/3] [7490400342781499835] <<< 250 Message accepted for delivery.
2025/04/07 11:59:00 [24982/2642852752/3] [7490400342781499835] Queuing is done, Q# is 1
2025/04/07 11:59:00 [24982/2625948560/3] Begin QSenderFile, local/003/7490400342781499835.0
2025/04/07 11:59:00 [24982/2625948560/2] [7490400342781499835] Trying to Check Local IP 211.115.206.70:25
2025/04/07 11:59:00 [24982/2625948560/2] [7490400342781499835] Trying to connect 211.115.206.70:25
2025/04/07 11:59:00 [24982/2625948560/2] [7490400342781499835] connect success 211.115.206.70:25
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] >>> 220 qualitia.co.kr ESMTP postian smtp service 6.00.0079/6.00.0098/1.00.0038; Mon, 7 Apr 2025 11:59:00 +0900
2025/04/07 11:59:00 [24982/2625948560/1] [7490400342781499835] Connected to 211.115.206.70:25
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] <<< EHLO antispam.deepsoft.co.kr
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] >>> 250-Hello 211.115.206.73, pleased to meet you
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] <<< STARTTLS
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] >>> 220 Ready to start TLS
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] [INFO] Protocol version used for TLS connections. [TLSv1.3]
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] [INFO] MTLS connection status : [Allow when the receive server use only tls. [SSL_get_verify_result() : 18]]
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] <<< EHLO antispam.deepsoft.co.kr
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] >>> 250-Hello 211.115.206.73, pleased to meet you
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] <<< MAIL FROM: <jkkim@headit.co.kr>
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] >>> 250 <test@test.com> ... Sender OK
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] <<< RCPT TO: <jkbaik@qualitia.co.kr>
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] >>> 250 <jkbaik@qualitia.co.kr> ... Recipient OK
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] <<< DATA
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] >>> 354 Enter mail, end with "." on a line by itself
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] <<< MSG[size=59812]
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] >>> 250 Message accepted for delivery
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] <<< QUIT
2025/04/07 11:59:00 [24982/2625948560/3] [7490400342781499835] >>> 221 BYE
2025/04/07 11:59:00 [24982/2625948560/1] [7490400342781499835] Q[local/003/7490400342781499835.0] stat=Sent[250 Message accepted for delivery]
2025/04/07 11:59:00 [24982/2642852752/3] [7490400342781499835] >>> QUIT
2025/04/07 11:59:00 [24982/2642852752/3] [7490400342781499835] <<< 221 Bye...
2025/04/07 11:59:00 [24982/2642852752/1] [7490400342781499835] Disconnected from [192.168.136.88]
```
