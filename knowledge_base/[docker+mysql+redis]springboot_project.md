# MySQL + JWT 로그인 연동 Overview
	Structuring Springboot + MySQL + Redis environment by using Docker Compose.
  
# 구조
	
	- springboot-docker-compose/
	│── docker-compose.yml          # ✅ Docker Compose 설정 추가할 파일
	│── Dockerfile                  # ✅ Spring Boot 컨테이너 생성할 Dockerfile 추가
	│── src/
	│   ├── main/
	│   │   ├── java/com/mysql/jwt/demo/
	│   │   │   ├── DemoApplication.java
	│   │   │   ├── config/
	│   │   │   │   ├── SecurityConfig.java
	│   │   │   │   ├── RedisConfig.java    # ✅ 새로 추가할 Redis 설정 파일
	│   │   │   ├── controller/
	│   │   │   │   ├── AuthController.java
	│   │   │   ├── model/
	│   │   │   │   ├── User.java
	│   │   │   ├── repository/
	│   │   │   │   ├── UserRepository.java
	│   │   │   ├── util/
	│   │   │   │   ├── JwtFilter.java
	│   │   │   │   ├── JwtUtil.java        # ✅ Redis 캐싱 추가할 파일
	│   ├── resources/
	│   │   ├── application.properties      # ✅ MySQL & Redis 연동 설정 추가
	│── build.gradle                        # ✅ Spring Boot 빌드 설정
	│── gradlew                             
	│── gradlew.bat                         
		
## docker-compose 컨테이너 구축
- # docker ps
- CONTAINER ID   IMAGE                           COMMAND                  CREATED              STATUS              PORTS                                                    NAMES
- 3fde52ec8588   springboot-docker-compose-app   "java -jar app.jar"      About a minute ago   Up About a minute   0.0.0.0:8080->8080/tcp, [::]:8080->8080/tcp              springboot-app
- d25104c1793e   mysql:8                         "docker-entrypoint.s…"   About a minute ago   Up About a minute   33060/tcp, 0.0.0.0:3307->3306/tcp, [::]:3307->3306/tcp   mysql-container
- 5e968ae25399   redis:latest                    "docker-entrypoint.s…"   About a minute ago   Up About a minute   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp              redis-container

## 테스트

# 컨테이너 별 실행 테스트
- MySQL 컨테이너 확인: # docker exec -it mysql-container mysql -u root -p
- redis 실행 확인: # docker exec -it redis-container redis-cli
- Spring Boot 애플리케이션 확인: # docker logs springboot-app

# API 호출 테스트
1. 회원가입 테스트: # curl -X POST http://localhost:8080/auth/register -H "Content-Type:application/json" -d '{"username":"testuser","password":"test123"}'
	- User registered successfully
2. 로그인(JWT 발급): # curl -
	
	
## 2. 로그인 요청 (JWT 토큰 발급)

			
## 3. API 엔드포인트에서 실제 DB 값(사용자 정보) 반환

# Conclusion
