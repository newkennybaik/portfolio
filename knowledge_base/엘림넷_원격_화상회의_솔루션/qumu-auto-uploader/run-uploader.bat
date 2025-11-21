@echo off
rem *** 절대 enabledelayedexpansion 쓰지 마세요(비번에 !가 있음) ***
setlocal DisableDelayedExpansion

rem ===== CONFIG =====
set "QUMU_INSTANCE=ksc"
set "QUMU_USERNAME=bert0656@elim.net"
set "QUMU_PASSWORD=Elimnet2025!"
set "QUMU_TYPE_GUID="
set "QUMU_TYPE_TITLE="
set "WATCH_PATH=%USERPROFILE%\qumu-watch"
set "QUMU_POLL_MS=15000"

rem Vidyo title lookup (비우면 비활성)
set "VIDYO_BASE=https://wreplay03.nownnow.com"
set "VIDYO_USER=super"
set "VIDYO_PASS=password"

set "STRICT_TITLE=true"
rem ===== /CONFIG =====

if not exist "%WATCH_PATH%" mkdir "%WATCH_PATH%"

set "JAVA=%~dp0runtime\bin\java.exe"
if not exist "%JAVA%" set "JAVA=java"

set "JAR=%~dp0qumu-auto-uploader-all.jar"
if not exist "%JAR%" (
  echo [ERROR] JAR not found: %JAR%
  exit /b 1
)

echo [INFO] JAVA         : %JAVA%
echo [INFO] JAR          : %JAR%
echo [INFO] WATCH_PATH   : %WATCH_PATH%
echo [INFO] QUMU_INSTANCE: %QUMU_INSTANCE%
echo [INFO] STRICT_TITLE : %STRICT_TITLE%

if defined VIDYO_BASE (
  echo [INFO] VIDYO_BASE  : %VIDYO_BASE% ^(user=%VIDYO_USER%^) 
) else (
  echo [INFO] VIDYO lookup disabled
)
echo.

rem Manifest 없이 실행: -cp + Main-Class
"%JAVA%" -Xms256m -Xmx512m -Dfile.encoding=UTF-8 -cp "%JAR%" com.example.qumu.QumuAutoUploader
set "RC=%ERRORLEVEL%"

echo.
echo [INFO] ExitCode=%RC%
exit /b %RC%
