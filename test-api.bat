@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo =========================================
echo AgentFlow Studio 功能测试
echo =========================================
echo.

set BASE_URL=http://localhost:3000/api
set TOTAL=0
set PASSED=0
set FAILED=0

echo =========================================
echo 1. 工作流 API 测试
echo =========================================

set /a TOTAL+=1
echo 测试 !TOTAL!: 获取工作流列表
curl -s -o response.txt -w "%%{http_code}" "%BASE_URL%/workflows" > status.txt
set /p STATUS=<status.txt
if "!STATUS!"=="200" (
    echo [32m✓ 通过[0m ^(HTTP !STATUS!^)
    set /a PASSED+=1
) else (
    echo [31m✗ 失败[0m ^(HTTP !STATUS!^)
    type response.txt
    set /a FAILED+=1
)
echo.

set /a TOTAL+=1
echo 测试 !TOTAL!: 创建工作流
curl -s -o response.txt -w "%%{http_code}" -X POST -H "Content-Type: application/json" -d "{\"name\":\"测试工作流\",\"description\":\"自动化测试\",\"nodes\":[],\"edges\":[]}" "%BASE_URL%/workflows" > status.txt
set /p STATUS=<status.txt
if "!STATUS!"=="201" (
    echo [32m✓ 通过[0m ^(HTTP !STATUS!^)
    set /a PASSED+=1
) else if "!STATUS!"=="200" (
    echo [32m✓ 通过[0m ^(HTTP !STATUS!^)
    set /a PASSED+=1
) else (
    echo [31m✗ 失败[0m ^(HTTP !STATUS!^)
    type response.txt
    set /a FAILED+=1
)
echo.

echo =========================================
echo 2. 知识库 API 测试
echo =========================================

set /a TOTAL+=1
echo 测试 !TOTAL!: 获取文档列表
curl -s -o response.txt -w "%%{http_code}" "%BASE_URL%/knowledge/documents" > status.txt
set /p STATUS=<status.txt
if "!STATUS!"=="200" (
    echo [32m✓ 通过[0m ^(HTTP !STATUS!^)
    set /a PASSED+=1
) else (
    echo [31m✗ 失败[0m ^(HTTP !STATUS!^)
    type response.txt
    set /a FAILED+=1
)
echo.

echo =========================================
echo 3. 对话 API 测试
echo =========================================

set /a TOTAL+=1
echo 测试 !TOTAL!: 获取会话列表
curl -s -o response.txt -w "%%{http_code}" "%BASE_URL%/chat/sessions" > status.txt
set /p STATUS=<status.txt
if "!STATUS!"=="200" (
    echo [32m✓ 通过[0m ^(HTTP !STATUS!^)
    set /a PASSED+=1
) else (
    echo [31m✗ 失败[0m ^(HTTP !STATUS!^)
    type response.txt
    set /a FAILED+=1
)
echo.

set /a TOTAL+=1
echo 测试 !TOTAL!: 创建会话
curl -s -o response.txt -w "%%{http_code}" -X POST "%BASE_URL%/chat/sessions" > status.txt
set /p STATUS=<status.txt
if "!STATUS!"=="201" (
    echo [32m✓ 通过[0m ^(HTTP !STATUS!^)
    set /a PASSED+=1
) else if "!STATUS!"=="200" (
    echo [32m✓ 通过[0m ^(HTTP !STATUS!^)
    set /a PASSED+=1
) else (
    echo [31m✗ 失败[0m ^(HTTP !STATUS!^)
    type response.txt
    set /a FAILED+=1
)
echo.

echo =========================================
echo 4. 监控 API 测试
echo =========================================

set /a TOTAL+=1
echo 测试 !TOTAL!: 获取监控指标
curl -s -o response.txt -w "%%{http_code}" "%BASE_URL%/metrics/summary?days=7" > status.txt
set /p STATUS=<status.txt
if "!STATUS!"=="200" (
    echo [32m✓ 通过[0m ^(HTTP !STATUS!^)
    set /a PASSED+=1
) else (
    echo [31m✗ 失败[0m ^(HTTP !STATUS!^)
    type response.txt
    set /a FAILED+=1
)
echo.

echo =========================================
echo 测试总结
echo =========================================
echo 总计: !TOTAL!
echo [32m通过: !PASSED![0m
echo [31m失败: !FAILED![0m
echo.

if !FAILED! EQU 0 (
    echo [32m所有测试通过！[0m
    del response.txt status.txt 2>nul
    exit /b 0
) else (
    echo [31m部分测试失败，请检查日志[0m
    del response.txt status.txt 2>nul
    exit /b 1
)
