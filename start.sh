#!/usr/bin/env bash
set -e

echo "========================================"
echo "LOOM-PLUS 启动脚本"
echo "========================================"
echo

# 检查 Docker
echo "[1/5] 检查 Docker 服务..."
if ! docker ps > /dev/null 2>&1; then
    echo "[错误] Docker 未运行，请先启动 Docker"
    exit 1
fi

# 启动基础设施
echo "[2/5] 启动 Docker 容器 (PostgreSQL + Redis)..."
docker-compose up -d postgres redis
if [ $? -ne 0 ]; then
    echo "PostgreSQL 和 Redis 启动失败"
    exit 1
fi
echo

# 等待数据库就绪
echo "[3/5] 等待数据库就绪..."
sleep 5
echo

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 启动后端
echo "[4/5] 安装并启动后端服务..."
cd "$SCRIPT_DIR/backend"
pnpm install
if [ $? -ne 0 ]; then
    echo "[错误] 后端依赖安装失败"
    exit 1
fi

# 在新的终端窗口启动后端（根据平台选择）
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd '$SCRIPT_DIR/backend' && pnpm start:dev; exec bash"
elif command -v osascript &> /dev/null; then
    # macOS
    osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/backend' && pnpm start:dev\""
elif command -v xterm &> /dev/null; then
    xterm -hold -e "cd '$SCRIPT_DIR/backend' && pnpm start:dev" &
else
    #  fallback: 后台运行
    cd "$SCRIPT_DIR/backend"
    pnpm start:dev &
    BACKEND_PID=$!
    echo "后端已在后台启动 (PID: $BACKEND_PID)"
fi
echo

# 启动前端
echo "[5/5] 安装并启动前端服务..."
cd "$SCRIPT_DIR/frontend"
pnpm install
if [ $? -ne 0 ]; then
    echo "[错误] 前端依赖安装失败"
    exit 1
fi

if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd '$SCRIPT_DIR/frontend' && pnpm dev; exec bash"
elif command -v osascript &> /dev/null; then
    osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR/frontend' && pnpm dev\""
elif command -v xterm &> /dev/null; then
    xterm -hold -e "cd '$SCRIPT_DIR/frontend' && pnpm dev" &
else
    cd "$SCRIPT_DIR/frontend"
    pnpm dev &
    FRONTEND_PID=$!
    echo "前端已在后台启动 (PID: $FRONTEND_PID)"
fi
echo

echo "========================================"
echo "LOOM-PLUS 已启动！"
echo "前端: http://localhost:5173"
echo "后端: http://localhost:3000"
echo "========================================"

# 尝试打开浏览器（跨平台）
sleep 3
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
fi

# 等待后台进程（如果有）
if [ -n "$BACKEND_PID" ]; then
    wait $BACKEND_PID
fi
if [ -n "$FRONTEND_PID" ]; then
    wait $FRONTEND_PID
fi
