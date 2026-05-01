@echo off
echo ========================================
echo LOOM-PRO 启动脚本
echo ========================================
echo.

echo [1/3] 启动 Docker 服务 (PostgreSQL + Redis)...
docker-compose up -d postgres redis
if %ERRORLEVEL% neq 0 (
    echo PostgreSQL 或 Redis 启动失败！
    pause
    exit /b 1
)
echo.

echo [2/3] 等待数据库就绪...
timeout /t 10 /nobreak >nul
echo.

echo [3/3] 启动后端服务...
start "LOOM-PRO Backend" cmd /k "cd backend && pnpm start:dev"
echo.

echo [4/4] 启动前端服务...
start "LOOM-PRO Frontend" cmd /k "cd frontend && pnpm dev"
echo.

echo ========================================
echo LOOM-PRO 已启动！
echo 前端: http://localhost:8080
echo 后端: http://localhost:3000
echo ========================================
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:8080
