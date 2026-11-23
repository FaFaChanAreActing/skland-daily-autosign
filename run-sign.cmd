@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist logs mkdir logs
node sign.mjs >> logs\scheduler.log 2>&1
exit /b %errorlevel%
