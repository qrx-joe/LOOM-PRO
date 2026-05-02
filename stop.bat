@echo off
chcp 65001 >nul
echo ========================================
echo LOOM-PLUS [^停止^] 脚本
echo ========================================
echo.

echo [1/2] 停止 Docker 服务 (PostgreSQL + Redis)...
docker-compose stop postgres redis
echo.

echo [2/2] 提示：请手动关闭 LOOM-PLUS Backend 和 LOOM-PLUS Frontend 窗口
echo.

echo ========================================
echo LOOM-PLUS 已停止 Docker 服务
echo ========================================
pause
