#!/bin/bash

# 本地开发服务器启动脚本
# 用于本地测试，不安装任何依赖

echo "==================================="
echo "  数据安全服务数字展厅 - 本地服务器"
echo "==================================="
echo ""

# 检查 Python 是否可用
if command -v python3 &> /dev/null; then
    echo "使用 Python 启动本地服务器..."
    echo ""
    echo "访问地址: http://localhost:8000"
    echo "按 Ctrl+C 停止服务器"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "使用 Python 启动本地服务器..."
    echo ""
    echo "访问地址: http://localhost:8000"
    echo "按 Ctrl+C 停止服务器"
    echo ""
    python -m SimpleHTTPServer 8000
else
    echo "错误: 未找到 Python"
    echo ""
    echo "请使用以下方式之一启动本地服务器："
    echo ""
    echo "1. 使用 VS Code Live Server 扩展"
    echo "   - 安装 Live Server 扩展"
    echo "   - 右键点击 index.html"
    echo "   - 选择 'Open with Live Server'"
    echo ""
    echo "2. 使用 Node.js (如果已安装)"
    echo "   npx http-server -p 8000"
    echo ""
    echo "3. 使用 PHP (如果已安装)"
    echo "   php -S localhost:8000"
    echo ""
    exit 1
fi
