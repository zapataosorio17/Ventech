@echo off
cd /d "%~dp0"
dotnet run --urls http://localhost:5097
pause
