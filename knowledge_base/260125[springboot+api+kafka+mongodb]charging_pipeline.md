# Charging Pipeline 작업 정리

## 0) 사용 시나리오 및 목적
충전 이벤트를 외부에서 수신하여 비동기 처리 구조로 저장하는 이벤트 수집 흐름을 구성하고, 그 전체 동작을 확인하기 위한 테스트.
이 구조에서 Spring Boot 서버는 충전 이벤트를 수신하는 단일 진입 지점(API) 역할을 하며, 수신 즉시 Kafka로 이벤트를 전달하고 응답을 반환하도록 설계됨.
Kafka에 전달된 이벤트는 Spring Boot 서버 내부의 Consumer 역할을 하는 코드에 의해 MongoDB에 저장되며, 저장 결과는 별도의 조회 API를 통해 확인 가능하도록 구성됨.
이 테스트는 위와 같은 API → Kafka → MongoDB 흐름이 정상적으로 연결되고 동작하는지를 확인하는 것이 목적이며, 그 과정에서 동일한 이벤트가 여러 번 전달되는 상황도 함께 점검함.
전체 동작 확인을 위해 이벤트 전송 및 결과 확인을 자동화하는 수단으로 Windows 배치 파일을 사용함.

### 구조
클라이언트(배치/curl) → API → Kafka → Consumer 코드 → MongoDB → 조회 API
---

## 1) Docker 구성
- Kafka, Zookeeper, MongoDB를 Docker Compose로 실행
- Kafka: 9092 포트 사용
- MongoDB: 27017 포트 사용
- MongoDB database: pipeline

---

## 2) Spring Boot 프로젝트 설정
- 생성 도구: Spring Initializr
- Project: Gradle
- Language: Kotlin
- Spring Boot: 3.x
- Java: 21
- 사용 의존성:
  - Spring Web
  - Spring for Apache Kafka
  - Spring Data MongoDB
  - Validation

Spring Boot 애플리케이션은 다음 역할을 동시에 수행한다.
- 이벤트 수신 API 제공
- Kafka Producer
- Kafka Consumer
- MongoDB 저장 및 조회 API 제공

---

## 3) Batch 파일 동작 목적
배치 파일은 테스트 자동화를 위해 사용된다.

동작 내용:
- 실행 시마다 sessionId 및 각 이벤트용 eventId를 새로 생성
- START, MEASUREMENT, END 이벤트 JSON 파일 생성
- API 호출 순서:
  1) START 이벤트 1회 전송
  2) MEASUREMENT 이벤트 1회 전송
  3) 동일 eventId의 MEASUREMENT 이벤트 1회 추가 전송
  4) END 이벤트 1회 전송
- Kafka Consumer 처리 시간을 고려해 잠시 대기
- sessionId 기준 조회 API 호출
- 조회 결과에서 특정 eventId의 등장 횟수를 계산하여 중복 저장 여부 판단

---

## 4) 결과값 확인
- MEASUREMENT 이벤트가 2번 전송되었으나
- MongoDB 조회 결과에서 해당 eventId가 1번만 존재하면 정상
- 2번 이상 존재하면 중복 저장 발생으로 판단
- batch 실행 결과로 PASS / FAIL 여부를 확인
