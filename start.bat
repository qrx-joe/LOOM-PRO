@echo off
chcp 65001 >nul
echo ========================================
echo LOOM-PLUS 启动脚本
echo ========================================
echo.

echo [1/4] 检查 Docker 服务...
docker ps >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] Docker 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)

echo [2/4] 启动 Docker 容器 (PostgreSQL + Redis)...
docker-compose up -d postgres redis
if %ERRORLEVEL% neq 0 (
    echo PostgreSQL 或 Redis 启动失败！
    pause
    exit /b 1
)
echo.

echo [3/4] 等待数据库就绪...
timeout /t 5 /nobreak >nul
echo.

echo [4/4] 启动后端服务...
start "LOOM-PLUS Backend" cmd /k "cd /d "%~dp0backend" && pnpm start:dev"
echo.

echo [5/4] 启动前端服务...
start "LOOM-PLUS Frontend" cmd /k "cd /d "%~dp0frontend" && pnpm dev"
echo.

echo ========================================
echo LOOM-PLUS 已启动！
echo 前端: http://localhost:5173
echo 后端: http://localhost:3000
echo ========================================
echo.
echo 5 秒后打开浏览器...
timeout /t 5 /nobreak >nul
start http://localhost:5173