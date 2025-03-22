# Mail API Overview
- HTTP 요청으로 메일을 간단하게 발송할 수 있도록 하는 API 구축.
- The purpose of this project is to simplify the mail sending process by mail API development.
- 알림 메일 발송용으로 추후 개발 가능 검토
- 편의를 위해 SMTP 엔진은 현재 재직중인 퀄리티아의 엔진을 사용. 

# Steps

## 1. 코드 스캐폴딩
```bash
📁 프로젝트 구조 (Spring Boot 기반 Mail API 서버)
src
└── main
    ├── java
    │   └── com.example.mailapi
    │       ├── MailApiApplication.java         // main application
    │       ├── controller
    │       │   └── MailController.java         // 메일 전송 API
    │       ├── service
    │       │   └── MailService.java            // SMTP 서비스 로직
    │       └── dto
    │           └── MailRequest.java            // 요청 DTO
    └── resources
        ├── application.yml                     // 설정파일
        └── templates
            └── mail-template.html              // 메일 템플릿

```
