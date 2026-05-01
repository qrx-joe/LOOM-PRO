@echo off
echo ========================================
echo LOOM-PRO 停止脚本
echo ========================================
echo.

echo [1/2] 停止 Docker 服务 (PostgreSQL + Redis)...
docker-compose stop postgres redis
echo.

echo [2/2] 提示：请手动关闭 LOOM-PRO Backend 和 LOOM-PRO Frontend 窗口
echo.

echo ========================================
echo LOOM-PRO 已停止 Docker 服务
echo ========================================
pause
