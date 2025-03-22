# MySQL + JWT 로그인 연동 Overview
	To learn about basic concenpt of JWT Authentication System for implementing login process.
  
# 구조
	- src\main\java\com\mysql\jwt\demo\model\User.java           # 📌 엔티티 (데이터 모델) 폴더
		- User 엔티티 및 리포지토리 생성 (회원 정보 저장): 사용자 정보를 저장할 테이블을 위한 엔티티(Entity)를 생성해야 함.
		
	- src\main\java\com\mysql\jwt\demo\repository\UserRepository.java      # 📌 데이터베이스 접근 (JPA) 폴더
	
	- src\main\java\com\mysql\jwt\demo\util\JwtUtil.java            # 📌 유틸리티 클래스 (JWT 기능)
		- JWT 토큰 생성 & 로그인 API 구현: 사용자가 로그인하면 JWT 토큰을 발급하는 API를 만들어야 함.
		- application.properties에 JWT 설정 추가: jwt.secret=MySuperSecretKey jwt.expiration=3600000  # 1시간 (밀리초 단위)
	
	- src\main\java\com\mysql\jwt\demo\controller\AuthController.java      # 📌 컨트롤러 (API) 폴더
		- 회원가입 & 로그인 API 만들기. 사용자가 회원가입하고, 로그인하면 JWT를 발급하는 API를 구현. (이제 Postman이나 curl로 토큰발급 테스트가 가능함.)
	
	- src\main\java\com\mysql\jwt\demo\config\SecurityConfig.java          # 📌 설정 파일 (Security 등), 
		- JWT 기반 인증 필터 추가 (보호된 API 설정). JWT 토큰을 사용해서 보호된 API에 접근할 수 있도록 Security 설정을 추가해야 함.
		
	- src\main\java\com\mysql\jwt\demo\DemoApplication.java  # 📌 Spring Boot 메인 클래스
	- src\main\resources\application.properties  # 📌 환경 설정 파일
	
## MySQL
	- mysql> CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
    );

	- mysql> desc users;
	+----------+--------------+------+-----+---------+----------------+
	| Field    | Type         | Null | Key | Default | Extra          |
	+----------+--------------+------+-----+---------+----------------+
	| id       | bigint       | NO   | PRI | NULL    | auto_increment |
	| username | varchar(255) | NO   | UNI | NULL    |                |
	| password | varchar(255) | NO   |     | NULL    |                |
	+----------+--------------+------+-----+---------+----------------+

# 테스트
## 1. 회원가입
	- gradlew build --refresh-dependencies
	- gradlew bootRun
	
	- Postman 테스트 내용:
		- POST: 'http://localhost:8080/auth/register'
		- Headers: 'Content-Type:application/json'
		- body(raw):
			{
			"username": "jwttest"
			"password": "admin123"
			}

	- 비밀번호는 Bcrypt 해시 함수에 따라 암호화 되어 저장됨. 실제 JWT 토큰 발급할때는 실제 비밀번호인 admin123으로 요청함.
	
## 2. 로그인 요청 (JWT 토큰 발급)
	- Postman 테스트 내용:
		- POST: 'http://localhost:8080/auth/login'
		- body(raw):
			{
			"username": "jwttest"
			"password": "admin123"
			}
		- Response(body)
			- eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqd3R0ZXN0IiwiaWF0IjoxNzM5NzA3OTQwLCJleHAiOjE3Mzk3MTE1NDB9.Vur0pwOTXm_ddc_Wya__nDp1gWbQS1dZ6MXl5BYMBNY
			
## 3. API 엔드포인트에서 실제 DB 값(사용자 정보) 반환
	- Postman 테스트 내용:
		- GET: 'http://localhost:8080/auth/me'
		- Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqd3R0ZXN0IiwiaWF0IjoxNzM5NzA3OTQwLCJleHAiOjE3Mzk3MTE1NDB9.Vur0pwOTXm_ddc_Wya__nDp1gWbQS1dZ6MXl5BYMBNY
		- Response(body)	
			{
			"id": 1,
			"username": "jwttest",
			"password": "$2a$10$8sDyMbfs41M5PMxzbxZqg.U3iW.OmLzGOJZ.ktfl5ZxkKiIR2AD4K"
			}
			
# Conclusion
##	Spring Boot + JWT 기반 API
	✔ POST /auth/register → 회원가입 (비밀번호 해싱 후 저장)
	✔ POST /auth/login → 로그인 (JWT 토큰 발급)
	✔ GET /auth/me → JWT 토큰 검증 후 사용자 정보 반환
	✔ JWT 없이 API 요청 시 403 Forbidden 발생
	✔ JWT를 Authorization: Bearer <토큰> 헤더에 포함해야 API 접근 가능
	