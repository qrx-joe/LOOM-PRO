#!/bin/bash

# AgentFlow Studio 功能测试脚本

BASE_URL="http://localhost:3000/api"

echo "========================================="
echo "AgentFlow Studio 功能测试"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数
TOTAL=0
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    TOTAL=$((TOTAL + 1))
    echo -n "测试 $TOTAL: $name ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo -e "${GREEN}✓ 通过${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ 失败${NC} (HTTP $http_code)"
        echo "  响应: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "========================================="
echo "1. 工作流 API 测试"
echo "========================================="
test_api "获取工作流列表" "GET" "/workflows"
test_api "创建工作流" "POST" "/workflows" '{"name":"测试工作流","description":"自动化测试","nodes":[],"edges":[]}'
echo ""

echo "========================================="
echo "2. 知识库 API 测试"
echo "========================================="
test_api "获取文档列表" "GET" "/knowledge/documents"
# 注意：文件上传需要使用 multipart/form-data，这里跳过
echo "  ⚠️  文件上传测试需要手动执行"
echo ""

echo "========================================="
echo "3. 对话 API 测试"
echo "========================================="
test_api "获取会话列表" "GET" "/chat/sessions"
test_api "创建会话" "POST" "/chat/sessions"
echo ""

echo "========================================="
echo "4. 监控 API 测试"
echo "========================================="
test_api "获取监控指标" "GET" "/metrics/summary?days=7"
echo ""

echo "========================================="
echo "测试总结"
echo "========================================="
echo "总计: $TOTAL"
echo -e "${GREEN}通过: $PASSED${NC}"
echo -e "${RED}失败: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}部分测试失败，请检查日志${NC}"
    exit 1
fi
