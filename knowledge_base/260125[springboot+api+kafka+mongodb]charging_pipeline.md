# Charging Pipeline 작업 정리

## 0) 사용 시나리오 및 목적
- 충전 이벤트를 외부에서 수신하여 비동기 처리 구조로 저장하는 이벤트 수집 흐름을 구성하고, 그 전체 동작을 확인하기 위한 테스트.
- 이 구조에서 Spring Boot 서버는 충전 이벤트를 수신하는 단일 진입 지점(API) 역할을 하며, 수신 즉시 Kafka로 이벤트를 전달하고 응답을 반환하도록 설계됨.
- Kafka에 전달된 이벤트는 Spring Boot 서버 내부의 Consumer 역할을 하는 코드에 의해 MongoDB에 저장되며, 저장 결과는 별도의 조회 API를 통해 확인 가능하도록 구성됨.
- API → Kafka → MongoDB 흐름이 정상적으로 연결되고 동작하는지를 확인하는 것이 목적이며, 그 과정에서 동일한 이벤트가 여러 번 전달되는 상황도 점검 진행.
- 전체 동작 확인을 위해 충전 이벤트 내역을 Windows 배치로 테스트 데이터를 만들어서 호출하였음.

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

---
---
---
---

---

## 5) Docker 기반 인프라 구성 (Kafka / MongoDB)

Spring Boot 애플리케이션이 접근할 Kafka와 MongoDB를 VMware 위 리눅스 서버에서 Docker Compose로 실행한다.

### 실행 환경
- VMware Linux 서버
- IP: 192.168.136.129
- Kafka 포트: 9092
- MongoDB 포트: 27017
- MongoDB database: pipeline

### 실행 절차

```bash
$ mkdir -p realtime-infra && cd realtime-infra
$ INFRA_IP="192.168.136.129"
```

```yaml
# /home/dev/realtime-infra/docker-compose.yml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    depends_on: [zookeeper]
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:29092,EXTERNAL://0.0.0.0:9092
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,EXTERNAL=${INFRA_IP}:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,EXTERNAL:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"

  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: pipeline
```

```bash
docker compose up -d
docker ps
```

### Windows에서 포트 연결 확인

```powershell
$INFRA_IP="192.168.136.129"
Test-NetConnection $INFRA_IP -Port 9092
Test-NetConnection $INFRA_IP -Port 27017
```

---

## 6) Spring Boot 프로젝트 구조

Spring Initializr를 통해 생성한 Kotlin 기반 Spring Boot 프로젝트 구조는 다음과 같다.

### 생성 옵션
- Project: Gradle
- Language: Kotlin
- Spring Boot: 3.x
- Java: 21
- Dependencies:
  - Spring Web
  - Spring for Apache Kafka
  - Spring Data MongoDB
  - Validation

### 디렉토리 구조

```
chargingpipeline
 ├─ src
 │  ├─ main
 │  │  ├─ kotlin
 │  │  │  └─ com.example.chargingpipeline
 │  │  │     ├─ api
 │  │  │     │  └─ ChargingEventController
 │  │  │     ├─ kafka
 │  │  │     │  ├─ ChargingEventProducer
 │  │  │     │  ├─ ChargingEventConsumer
 │  │  │     │  ├─ KafkaConfig
 │  │  │     │  └─ KafkaTopics
 │  │  │     ├─ model
 │  │  │     │  ├─ ChargingEventDocument
 │  │  │     │  ├─ ChargingEventRequest
 │  │  │     │  └─ ChargingEventType
 │  │  │     ├─ repo
 │  │  │     │  └─ ChargingEventRepository
 │  │  │     └─ ChargingpipelineApplication.kt
 │  │  └─ resources
 │  │     └─ application.yml
 │  └─ test
 ├─ build.gradle.kts
 ├─ settings.gradle.kts
 └─ test_charging_pipeline.bat
```

각 패키지의 역할은 다음과 같음
- api: 외부에서 이벤트를 수신하고 조회하는 HTTP API
- kafka: Kafka Producer / Consumer 및 설정
- model: API 요청 모델과 MongoDB 저장 스키마
- repo: MongoDB 접근용 Repository

---

## 7) 테스트용 Windows Batch 파일

테스트 자동화를 위해 Windows 배치 파일을 사용.
이 배치 파일은 **이벤트 수신 API → Kafka → MongoDB → 조회 API** 흐름이 실제로 동작하는지를 확인하기 위한 용도.

```bat
@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

REM ==========================
REM Config
REM ==========================
set "BASE_URL=http://localhost:8080"

REM Generate unique ids per run (PowerShell exists on Windows)
for /f %%i in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString()"') do set "SESSION_ID=%%i"
for /f %%i in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString()"') do set "EVT_START=%%i"
for /f %%i in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString()"') do set "EVT_MEAS=%%i"
for /f %%i in ('powershell -NoProfile -Command "[guid]::NewGuid().ToString()"') do set "EVT_END=%%i"

set "TMP_START=%TEMP%\charging_start.json"
set "TMP_MEAS=%TEMP%\charging_meas.json"
set "TMP_END=%TEMP%\charging_end.json"
set "TMP_OUT=%TEMP%\charging_out.json"
set "TMP_CNT=%TEMP%\charging_count.txt"

echo.
echo SessionId=%SESSION_ID%
echo EVT_START=%EVT_START%
echo EVT_MEAS=%EVT_MEAS% (will be sent twice to test idempotency)
echo EVT_END=%EVT_END%
echo.

REM ==========================
REM Build JSON payloads
REM ==========================
> "%TMP_START%" (
  echo {
  echo   "eventId": "%EVT_START%",
  echo   "sessionId": "%SESSION_ID%",
  echo   "type": "START",
  echo   "payload": { "chargerId": "CHG-01", "reason": "PlugIn" }
  echo }
)

> "%TMP_MEAS%" (
  echo {
  echo   "eventId": "%EVT_MEAS%",
  echo   "sessionId": "%SESSION_ID%",
  echo   "type": "MEASUREMENT",
  echo   "payload": { "soc": 32, "currentA": 18.2, "powerKw": 7.1 }
  echo }
)

> "%TMP_END%" (
  echo {
  echo   "eventId": "%EVT_END%",
  echo   "sessionId": "%SESSION_ID%",
  echo   "type": "END",
  echo   "payload": { "totalKwh": 12.34, "stopReason": "UserStop" }
  echo }
)

REM ==========================
REM Send events (API -> Kafka)
REM ==========================
echo [1/5] POST START
curl -s -S -X POST "%BASE_URL%/api/charging/events" -H "Content-Type: application/json" --data "@%TMP_START%"
echo.

echo [2/5] POST MEASUREMENT #1
curl -s -S -X POST "%BASE_URL%/api/charging/events" -H "Content-Type: application/json" --data "@%TMP_MEAS%"
echo.

echo [3/5] POST MEASUREMENT #2 (DUPLICATE)
curl -s -S -X POST "%BASE_URL%/api/charging/events" -H "Content-Type: application/json" --data "@%TMP_MEAS%"
echo.

echo [4/5] POST END
curl -s -S -X POST "%BASE_URL%/api/charging/events" -H "Content-Type: application/json" --data "@%TMP_END%"
echo.

echo Waiting 2 seconds for Kafka consumer -> Mongo insert...
timeout /t 2 /nobreak >nul

REM ==========================
REM Fetch results (Mongo via API)
REM ==========================
echo [5/5] GET session events
curl -s -S "%BASE_URL%/api/charging/sessions/%SESSION_ID%/events" > "%TMP_OUT%"
type "%TMP_OUT%"
echo.

REM ==========================
REM Count occurrences safely (NO pipes in CMD, no fragile escaping)
REM Uses regex matches inside PowerShell and writes a single integer
REM ==========================
powershell -NoProfile -Command ^
  "$raw = Get-Content -Raw -LiteralPath '%TMP_OUT%';" ^
  "$id  = '%EVT_MEAS%';" ^
  "$cnt = ([regex]::Matches($raw, '\"eventId\":\"' + [regex]::Escape($id) + '\"')).Count;" ^
  "Set-Content -NoNewline -LiteralPath '%TMP_CNT%' -Value $cnt;"

set "COUNT="
set /p COUNT=<"%TMP_CNT%"

echo Verify idempotency: eventId=%EVT_MEAS% count=%COUNT%

REM Validate COUNT is numeric
echo(%COUNT%> "%TEMP%\__count_check.txt"
findstr /r "^[0-9][0-9]*$" "%TEMP%\__count_check.txt" >nul
del /q "%TEMP%\__count_check.txt" >nul 2>&1

if errorlevel 1 (
  echo [FAIL] Count parsing failed. COUNT=%COUNT%
  goto :CLEANUP_FAIL
)

REM PASS/FAIL
if not "%COUNT%"=="1" (
  echo [FAIL] Duplicate was stored. Expected 1, got %COUNT%
  echo        (Fix Mongo unique index on eventId, then rerun.)
  goto :CLEANUP_FAIL
) else (
  echo [OK] Duplicate was blocked (count=1)
  goto :CLEANUP_OK
)

:CLEANUP_FAIL
del /q "%TMP_START%" "%TMP_MEAS%" "%TMP_END%" "%TMP_OUT%" "%TMP_CNT%" >nul 2>&1
endlocal
exit /b 1

:CLEANUP_OK
del /q "%TMP_START%" "%TMP_MEAS%" "%TMP_END%" "%TMP_OUT%" "%TMP_CNT%" >nul 2>&1
echo Done.
endlocal
exit /b 0

```

배치 파일의 목적은 다음과 같다.
- 이벤트 수신 API 호출 흐름 자동화
- Kafka를 거쳐 MongoDB에 데이터가 저장되는지 확인
- 조회 API 결과를 기준으로 저장 결과 검증
- 테스트 결과를 PASS / FAIL로 명확히 확인
