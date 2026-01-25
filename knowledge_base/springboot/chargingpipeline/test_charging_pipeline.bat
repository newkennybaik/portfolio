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
