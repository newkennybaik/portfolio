# First Springboot Project Overview
First Springboot project implemented for learning purposes.

## Steps
1. Spring Initializer에 Project를 Generate 후, demo.zip 압축해제

2. H2 DB의 dependency를 build_gradle에 추가 후, cmd 창에서 .\gradlew bootRun 실행하여 REST API 동작여부 테스트
	2.1 http://localhost:8080/api/hello 정상응답 반환 확인
	
3. MySQL 연동 및 CRUD API 구성 (연동을 위해 사전 MySQL Client 로컬에 설치)
	3.1 경로
	src\main\java\com\kennybaik\demo\

	3.2 구성
	- 아래와 같이 CRUD API를 구성 후, 사용자를 생성하고 삭제하는 등의 동작을 테스트		
		- com.kennybaik.demo
		- com.kennybaik.demo\config             # 환경 설정 관련 파일
		- com.kennybaik.demo\controller         # REST API 컨트롤러
		- com.kennybaik.demo\entity             # JPA 엔티티 클래스
		- com.kennybaik.demo\repository         # 데이터베이스 리포지토리 (DAO)
		- com.kennybaik.demo\service            # 비즈니스 로직 계층
		- com.kennybaik.demo\DemoApplication.java   # 메인 애플리케이션 실행 파일
	
	3.3 코드 작성 및 .\gradlew clean build, .\gradlew bootRun 으로 실행
	
	3.4 Postman이나 curl -X 명령어로 POST 방식으로 데이터 입력 테스트
	- 호출 URL: http://localhost:8080/users
	- Headers: Content-Type:application/json
	- body:
	{
    "name": "Kenny Baik",
    "email": "newkennybaik@naver.com"
	}
	
	실제 결과값:
	- http://localhost:8080/users 를 GET 방식으로 호출하거나 MySQL에서 데이터 확인
	
	- 아래와 같이 API 호출로 데이터가 MySQL로 입력된 것을 확인 할 수 있었음
	- mysql> select * from users;
	+----+------------+------------------------+
	| id | name       | email                  |
	+----+------------+------------------------+
	|  1 | Kenny Baik | newkennybaik@naver.com |
	+----+------------+------------------------+
	1 row in set (0.00 sec)

## Conclusion
### Spring Boot 기초 애플리케이션 실행 흐름
	✔ 1. 코드 작성 → Controller, Service, Repository, Entity 작성
	✔ 2. 빌드(Build) → .jar 또는 .war 파일 생성 (gradlew build 사용)
	✔ 3. 배포(Deploy) → 서버나 클라우드 환경에 업로드
	✔ 4. 실행(Run) → java -jar 명령으로 실행
	
### Spring Boot 어플리케이션이 사용자 요청을 받아서 데이터를 처리하는 CRUD API로직 테스트 수행
	- Controller (엔드 포인트, 사용자 호출) -> 
	- Service (데이터 가공 후 데이터베이스에 전달하는 역할) -> 
	- Repository  -> 
	- Database (Entity Model)순서로 데이터가 처리됨.