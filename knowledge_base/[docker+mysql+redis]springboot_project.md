# MySQL + JWT 로그인 연동 Overview
	Structuring Springboot + MySQL + Redis environment by using Docker Compose.
  
# 구조
	- springboot-docker-compose/
	springboot-jwt-redis
	│── src
	│   ├── main
	│   │   ├── java/com/example/auth
	│   │   │   ├── config        # 설정 관련 클래스 (Security, Redis)
	│   │   │   ├── controller    # API 엔드포인트
	│   │   │   ├── dto           # DTO (Data Transfer Object)
	│   │   │   ├── entity        # JPA 엔티티
	│   │   │   ├── repository    # JPA 리포지토리
	│   │   │   ├── service       # 비즈니스 로직
	│   │   │   ├── utils         # JWT 유틸리티
	│── pom.xml                    # Maven 의존성
	│── Dockerfile                  # Spring Boot 애플리케이션 컨테이너 설정
	│── docker-compose.yml           # MySQL + Redis + Spring Boot 컨테이너 오케스트레이션
	│── .env                         # 환경 변수 관리
	│── application.yml               # Spring Boot 설정    
		
## docker-compose 컨테이너 구축
- ./gradlew clean build
- docker-compose up -d
- docker ps
801588c2a6fb   springboot-docker-compose-app   "java -jar app.jar"      10 seconds ago   Up 9 seconds    0.0.0.0:8080->8080/tcp, [::]:8080->8080/tcp              springboot-app
611830d1e02e   mysql:8                         "docker-entrypoint.s…"   10 seconds ago   Up 10 seconds   33060/tcp, 0.0.0.0:3307->3306/tcp, [::]:3307->3306/tcp   mysql-container
4c875b661866   redis:latest                    "docker-entrypoint.s…"   10 seconds ago   Up 10 seconds   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp              redis-container

## 테스트

### 컨테이너 별 실행 테스트
- MySQL 컨테이너 확인: # docker exec -it mysql-container mysql -u root -p
- redis 실행 확인: # docker exec -it redis-container redis-cli
- Spring Boot 애플리케이션 확인: # docker logs springboot-app

## API 호출 테스트
1. 회원가입 테스트: # curl -X POST http://localhost:8080/auth/register -H "Content-Type:application/json" -d '{"username":"testuser","password":"test123"}'
	- User registered successfully
2. 로그인(JWT 발급): # curl -
	
	
## 2. 로그인 요청 (JWT 토큰 발급)

			
## 3. API 엔드포인트에서 실제 DB 값(사용자 정보) 반환

# Conclusion
