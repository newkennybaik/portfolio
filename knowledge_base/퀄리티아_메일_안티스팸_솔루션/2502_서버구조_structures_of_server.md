# 서버구조_structures_of_server
This has been written for organizing the structure of the server.

현재 재직중인 회사는 메일서버/스팸서버의 제조사로, 서버 운영을 위해 알아야 할 서버구조에 대해 기록합니다.

## 메일서버
- RHEL/CentOS-based Linux Operating System, Windows Operating System
    - Apache Tomcat (WAS/WEB 서버)
        - HTTP 소스
            - TOMCAT_소스 ./apache-tomcat-x.x.xxx
                - TOMCAT_실행_스크립트 ./startup.sh
            - 관리자_소스 ./service/admin
            - 사용자_소스 ./service/index.ds
            - 모바일_소스 ./service/mobile
            - 로그파일 ./log
            - 서버_라이선스 ./license
        - SMTP 소스
            - SMTP_실행_스크립트
        - CRON 소스
            - CRON_실행_스크립트
            - CRON_연관_툴
            - 툴_실행_스캐줄러
        - 공유데이터 ./share
            - 사용자데이터 ./share/user
            - 설정데이터 ./share/cfg,dat
            - 커스터마이징_데이터
            - 데이터베이스 ./share/DB
        - 서버 운영을 위한 각종 툴 ./bin
        - POP3,IMAP4_실행_스크립트

## 스팸서버
- RHEL/CentOS-based Linux Operating System, Windows Operating System
    - Apache Tomcat (WAS/WEB 서버)
        - HTTP 소스
            - TOMCAT_소스 ./apache-tomcat-x.x.xxx
                - TOMCAT_실행_스크립트 ./startup.sh
            - 웹소스 ./service
            - 로그파일 ./log
            - 서버_라이선스 ./license
        - SMTP 소스
            - SMTP_실행_스크립트
        - CRON 소스
            - CRON_실행_스크립트
            - CRON_연관_툴
            - 툴_실행_스캐줄러
        - 공유데이터 ./share
            - 설정데이터 ./share/cfg,dat
            - 커스터마이징_데이터
            - 데이터베이스 ./share/DB
            - 필터_데이터 ./filter
            - 백신_데이터 ./vaccine
        - 서버 운영을 위한 각종 툴 ./bin