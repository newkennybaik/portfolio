# MySQL + JWT 로그인 연동 Overview
	Structuring Springboot + MySQL + Redis environment by using Docker Compose.
	Spring Boot 3.x
	
	1. 회원가입 (AWS Cognito에 등록)
	2. 로그인 (AWS Cognito 토큰 발급)
	3. MySQL 연동 (회원 정보 저장)
	4. Redis 캐싱 (세션 관리)
	5. Docker Compose를 이용한 환경 설정
  
# 구조
	- springboot-app/
	├── src/
	│   ├── main/
	│   │   ├── kotlin/com/example/springbootapp/
	│   │   │   ├── config/
	│   │   │   │   ├── SecurityConfig.kt          # Spring Security & OAuth2 설정
	│   │   │   │   ├── CacheConfig.kt             # Redis 캐시 설정
	│   │   │   ├── controller/
	│   │   │   │   ├── UserController.kt          # REST API 컨트롤러
	│   │   │   ├── entity/
	│   │   │   │   ├── User.kt                    # JPA 엔티티 클래스
	│   │   │   ├── repository/
	│   │   │   │   ├── UserRepository.kt          # JPA Repository
	│   │   │   ├── service/
	│   │   │   │   ├── UserService.kt             # 비즈니스 로직 (Redis 캐싱 포함)
	│   │   │   ├── SpringbootAppApplication.kt    # 메인 애플리케이션 파일
	│   │   ├── resources/
	│   │   │   ├── application.yml                # Spring Boot 환경 설정 파일
	│   │   │   ├── static/                        # 정적 리소스 (예: HTML, CSS, JS)
	│   │   │   ├── templates/                     # Thymeleaf (또는 다른 템플릿 엔진)
	│   ├── test/
	│   │   ├── kotlin/com/example/springbootapp/
	│   │   │   ├── SpringbootAppApplicationTests.kt # 테스트 코드
	├── build.gradle.kts                            # Gradle Kotlin DSL 설정 파일
	├── settings.gradle.kts                         # Gradle 프로젝트 설정
	├── Dockerfile                                  # Spring Boot 애플리케이션 Docker 설정
	├── docker-compose.yml                          # MySQL + Redis + Spring Boot 연동
		
## docker-compose 컨테이너 구축
  1. ./gradlew clean build
  2. docker-compose up -d --build
  3. docker-compose ps -a
	NAME                      IMAGE                    COMMAND                  SERVICE          CREATED         STATUS                   PORTS
	mysql_container           mysql:8.0                "docker-entrypoint.s…"   mysql            3 minutes ago   Up 3 minutes (healthy)   0.0.0.0:3306->3306/tcp, [::]:3306->3306/tcp, 33060/tcp
	redis_container           redis:latest             "docker-entrypoint.s…"   redis            3 minutes ago   Up 3 minutes (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
	springbootapp_container   project-springboot_app   "java -jar /app.jar"     springboot_app   3 minutes ago   Up 3 minutes             0.0.0.0:8080->8080/tcp, [::]:8080->8080/tcp

  4. docker ps --format "table {{.ID}}\t{{.Names}}\t{{.Networks}}"
	CONTAINER ID   NAMES                     NETWORKS
	e26707c9cec6   springbootapp_container   app_network
	a00395d2c7db   redis_container           app_network
	5a2929169a3d   mysql_container           app_network
	
## 테스트

### 컨테이너 별 실행 테스트
  1. MySQL 컨테이너 확인: # docker exec -it mysql-container mysql -u user -p
  2. redis 실행 확인: # docker exec -it redis-container redis-cli
  3. Spring Boot 애플리케이션 확인: # docker logs -f springboot-app | tail -50

## API 호출 테스트
  1. AWS Cognito URI 호출 테스트: curl -s https://cognito-idp.ap-northeast-2.amazonaws.com/ap-northeast-2_QnnMzXAi2/.well-known/openid-configuration | jq .
  2. Hibernate 설정에 좀 문제가 있어서 MySQL에 자동으로 table 생성이 안되서 수동으로 추가해줌.
    - CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

  3. AWS Cognito에서 계정 추가
  $ aws cognito-idp admin-create-user \
	--user-pool-id ap-northeast-2_QnnMzXAi2 \
	--username testuser@example.com \
	--temporary-password "TempPass123!" \
	--user-attributes Name=email,Value=testuser@example.com
  
  4. 호출 테스트
  # curl -v -H "Accept: application/json" http://localhost:8080/users
	*   Trying ::1:8080...
	* Connected to localhost (::1) port 8080 (#0)
	> GET /users HTTP/1.1
	> Host: localhost:8080
	> User-Agent: curl/7.76.1
	> Accept: application/json
	>
	* Mark bundle as not supporting multiuse
	< HTTP/1.1 302
	< X-Content-Type-Options: nosniff
	< X-XSS-Protection: 0
	< Cache-Control: no-cache, no-store, max-age=0, must-revalidate
	< Pragma: no-cache
	< Expires: 0
	< X-Frame-Options: DENY
	< Location: http://localhost:8080/oauth2/authorization/cognito
	< Content-Length: 0
	< Date: Sun, 02 Mar 2025 03:31:09 GMT
	<
	* Connection #0 to host localhost left intact

# Conclusion
  1. 원래 목적은 AWS Cognito의 사용자풀에 회원가입 API를 통해 가입하고, 로컬 MySQL로 데이터를 가져오고, 원격에 있는 사용자를 조회하는 API를 테스트하려고 했음
  2. 구성해놓은 SecurityConfig.kt 쪽 코드에서 오류가 나는 것 같은데 자꾸 http://localhost:8080/oauth2/authorization/cognito 로 리다이렉트(302)를 시키는 이슈가 발생됨
  3. MySQL, Redis와 Springboot App은 docker-compose.yml과 application.yml을 통해 모두 정상적으로 같은 네트워크에 동작하도록 설정했고, 포트바인딩도 정상적인 것을 확인함. 다만 완벽히 구성하려면 시일이 걸릴 것으로 예상됨.