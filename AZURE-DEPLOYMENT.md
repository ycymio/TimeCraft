# TimeCraft Azure Cloud 部署指南 (PM2版本)

## 通过 forsteri.southeastasia.cloudapp.azure.com 访问 TimeCraft

### 一键部署 (推荐)

#### Windows 系统:
```batch
start-azure.bat
```

#### Linux/macOS 系统:
```bash
chmod +x start-azure.sh
./start-azure.sh
```

**自动化功能:**
- 自动安装 PM2（如果未安装）
- 自动安装项目依赖
- 自动停止旧的 PM2 进程
- 创建日志目录
- 启动前端服务
- 配置 PM2 开机自启
- 显示管理指令

### ⚠️ File System Access API 兼容性说明

TimeCraft 使用 File System Access API 来读取本地数据文件。该 API 有特定的兼容性要求：

#### 兼容性要求
1. **浏览器支持**: 仅支持 Chromium 内核浏览器 (Chrome 86+, Edge 86+, Opera 72+)
2. **协议要求**: 必须在 **HTTPS** 环境下运行
3. **安全上下文**: 必须在安全上下文中运行

#### 本地 vs 云端差异
- **本地开发**: `http://localhost:5173` - localhost 被认为是安全上下文 ✅
- **云端部署**: `http://forsteri.southeastasia.cloudapp.azure.com:5173` - HTTP 协议不是安全上下文 ❌

#### 错误表现
如果在 HTTP 环境下访问，会出现以下错误：
```
TypeError: window.showDirectoryPicker is not a function
```

**解决方案请参考下方的 "HTTPS 配置" 章节。**

### PM2 管理工具

部署完成后，使用以下管理工具进行进程和日志管理：

#### Windows 系统:
```batch
pm2-manage.bat
```

#### Linux/macOS 系统:
```bash
chmod +x pm2-manage.sh
./pm2-manage.sh
```

**管理功能:**
- 查看进程状态
- 查看实时日志
- 重启/停止服务
- 清理日志文件

### 手动部署步骤

如果需要手动执行部署：

```bash
# 1. 安装依赖
npm install

# 2. 安装 PM2 (如果未安装)
npm install -g pm2

# 3. 创建日志目录
mkdir -p logs

# 4. 启动应用
pm2 start ecosystem.config.cjs

# 5. 保存配置并设置开机自启
pm2 save
pm2 startup

# 6. 查看状态
pm2 status
```

### PM2 命令参考

#### 基本管理命令
```bash
# 查看进程状态
pm2 status

# 查看所有日志 (实时)
pm2 logs

# 查看前端日志
pm2 logs timecraft-frontend

# 重启所有服务
pm2 restart ecosystem.config.cjs

# 停止所有服务
pm2 stop ecosystem.config.cjs

# 删除所有服务
pm2 delete ecosystem.config.cjs

# 重新加载配置文件
pm2 reload ecosystem.config.cjs
```

#### 高级管理命令
```bash
# 实时监控面板
pm2 monit

# 查看详细信息
pm2 describe timecraft-frontend

# 查看最近日志 (指定行数)
pm2 logs --lines 100

# 清空日志
pm2 flush

# 保存当前配置
pm2 save

# 开机自启设置
pm2 startup
```

#### 日志文件管理
```bash
# 查看日志目录
ls -la logs/

# 日志文件说明:
# logs/frontend-combined.log    # 前端完整日志
# logs/frontend-err.log         # 前端错误日志  
# logs/frontend-out.log         # 前端输出日志

# 实时监控特定日志文件
tail -f logs/frontend-combined.log
```

### 项目架构说明

#### PM2 生态系统配置
项目使用 `ecosystem.config.cjs` 管理前端服务：

1. **timecraft-frontend** (Vite 开发服务器)
   - 端口: 5173
   - 入口: `npm run dev`
   - 绑定: 0.0.0.0 (支持外网访问)
   - 日志: logs/frontend-*.log

#### 文件结构
```
TimeCraft/
├── ecosystem.config.cjs     # PM2 配置文件
├── start-azure.bat          # Windows 一键部署
├── start-azure.sh           # Linux 一键部署
├── pm2-manage.bat           # Windows 管理工具
├── pm2-manage.sh            # Linux 管理工具
├── test-access.sh           # 访问测试脚本
├── logs/                    # PM2 日志目录
├── src/                    # React 前端源码
├── data/                   # 数据文件
├── public/                 # 静态资源
└── package.json           # 项目配置
```

### 访问地址

#### 前端应用 (React UI)
- **外网访问 (域名):** http://forsteri.southeastasia.cloudapp.azure.com:5173
- **外网访问 (公网IP):** http://20.6.81.42:5173
- **本地访问:** http://localhost:5173

#### 网络说明
- **公网IP:** `20.6.81.42` (从外网访问使用此IP)
- **内网IP:** `10.0.0.4` (VM内部网络地址)
- **域名解析:** forsteri.southeastasia.cloudapp.azure.com → 20.6.81.42

#### 访问测试
使用项目提供的测试脚本：
```bash
chmod +x test-access.sh
./test-access.sh
```

### Azure 云服务器配置

#### 1. 网络安全组 (NSG) 配置

确保以下端口在 Azure 安全组中已开放：

**入站规则配置:**
```
规则名称: TimeCraft-Frontend
端口: 5173
协议: TCP
源: Any (0.0.0.0/0)
操作: Allow
优先级: 1000

规则名称: SSH-Access (可选)
端口: 22
协议: TCP
源: Any (0.0.0.0/0)
操作: Allow
优先级: 1010
```

**注意:** 
- 端口 24678 (Vite HMR) 仅用于本地开发，无需对外开放
- 确保优先级不与现有规则冲突

#### 2. Azure CLI 配置 (可选)

如果需要通过 Azure CLI 管理端口：

```bash
# 开放前端端口 5173
az vm open-port --resource-group <资源组名> --name <虚拟机名> --port 5173 --priority 1000

# 查看现有规则
az network nsg rule list --resource-group <资源组名> --nsg-name <网络安全组名> --output table
```

#### 3. 系统环境要求

**操作系统:**
- Ubuntu 18.04+ 或其他 Linux 发行版
- Windows Server 2019+ (支持但推荐 Linux)

**软件要求:**
- Node.js 16+ (推荐 18+)
- npm 8+
- PM2 5+ (自动安装)

**硬件推荐:**
- CPU: 2 核心或以上
- 内存: 4GB 或以上
- 存储: 20GB 或以上

#### 4. 环境变量配置

在 Azure VM 中可选择设置以下环境变量：

```bash
# 在 ~/.bashrc 或 ~/.profile 中添加
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=5173

# 应用配置
source ~/.bashrc
```

**注意:** PM2 配置文件已包含所有必要的环境设置，无需手动配置。

### 故障排除与调试

#### 1. PM2 服务状态检查

```bash
# 检查所有进程状态
pm2 status

# 如果服务未运行
pm2 start ecosystem.config.cjs

# 重启特定服务
pm2 restart timecraft-frontend

# 查看服务详细信息
pm2 describe timecraft-frontend

# 查看实时日志
pm2 logs --lines 50
pm2 logs timecraft-frontend --lines 30
```

#### 2. 网络连接问题

**检查本地服务:**
```bash
# 检查端口是否被监听
netstat -tulpn | grep :5173

# 或使用 ss 命令
ss -tulpn | grep :5173

# 测试本地连接
curl http://localhost:5173
```

**检查外网访问:**
```bash
# 测试域名解析
nslookup forsteri.southeastasia.cloudapp.azure.com
ping forsteri.southeastasia.cloudapp.azure.com

# 测试外网连接 (从VM内部)
curl http://forsteri.southeastasia.cloudapp.azure.com:5173
```

#### 3. 常见错误解决

**端口被占用:**
```bash
# 查找占用端口的进程
lsof -i :5173

# 杀死占用进程 (谨慎使用)
sudo kill -9 <PID>

# 或停止 PM2 中的相应服务
pm2 stop timecraft-frontend
```

**依赖问题:**
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重启服务
pm2 restart ecosystem.config.cjs
```

**权限问题:**
```bash
# 确保脚本可执行
chmod +x start-azure.sh
chmod +x pm2-manage.sh
chmod +x test-access.sh

# 检查日志目录权限
ls -la logs/
chmod 755 logs/
```

#### 4. Vite/前端特定问题

**WebSocket/HMR 错误:**
```
WebSocket connection to 'ws://localhost:24678/?token=xxx' failed
[vite] failed to connect to websocket (Error: WebSocket closed without opened.)
```
**解决方案:**
- ✅ HMR 已在 `vite.config.ts` 中禁用（`hmr: false`）
- ✅ 这个错误不影响应用功能，只是热重载功能不可用
- ✅ 页面刷新仍然可以看到代码更改
- **说明**: 云环境中浏览器无法连接到服务器的 localhost WebSocket

**Host not allowed 错误:**
```
Invalid Host header / Host not allowed
```
- ✅ vite.config.ts 已配置 `server.host: '0.0.0.0'`
- ✅ 已设置 `allowedHosts: true`
- 如仍有问题，重启 PM2 服务

**CORS 跨域错误:**
- ✅ 前端应用读取本地数据文件
- ✅ 无需后端 API 支持
- 检查浏览器控制台错误详情

#### 5. 数据文件问题

# 检查文件权限
chmod 644 data/*.csv data/*.json
chmod 644 public/*.json
```

#### 6. Azure 基础设施问题

**VM 资源不足:**
```bash
# 检查系统资源
free -h        # 内存使用
df -h          # 磁盘使用
top           # CPU 使用
```

**防火墙/安全组问题:**
- 确认 Azure NSG 规则正确配置
- 检查 VM 内部防火墙设置 (ufw, iptables)
- 验证端口 5173 已开放

#### 7. 完整重新部署

如果遇到无法解决的问题，可以执行完整重新部署：

```bash
# 停止并删除所有 PM2 进程
pm2 stop ecosystem.config.cjs
pm2 delete ecosystem.config.cjs

# 清理依赖和缓存
rm -rf node_modules package-lock.json
npm cache clean --force

# 重新部署 (选择对应系统)
./start-azure.sh       # Linux
# 或
start-azure.bat        # Windows
```

### 日常运维指南

#### 日志监控
```bash
# 实时监控所有日志
pm2 logs

# 监控特定服务日志
pm2 logs timecraft-frontend

# 查看历史日志 (指定行数)
pm2 logs --lines 200

# 监控系统日志文件
tail -f logs/frontend-combined.log
```

#### 定期维护
```bash
# 日志清理 (定期执行)
pm2 flush

# 或手动清理日志文件
rm -f logs/*.log

# 重启服务 (定期维护)
pm2 restart ecosystem.config.cjs

# 更新应用代码 (如有更新)
git pull origin main
npm install
pm2 restart ecosystem.config.cjs
```

#### 性能监控
```bash
# 实时监控面板
pm2 monit

# 查看进程详细信息
pm2 describe timecraft-frontend

# 系统资源监控
htop
# 或
top
```

#### 备份重要配置
建议定期备份以下文件：
- `ecosystem.config.cjs` - PM2 配置
- `package.json` - 项目依赖
- `vite.config.ts` - Vite 配置  
- `data/` 目录 - 数据文件

---

## 快速参考

### 常用命令速查
```bash
# 一键部署 (HTTP)
./start-azure.sh

# 一键部署 (HTTPS) - 解决 File System Access API 问题
./start-azure-https.sh

# 管理工具
./pm2-manage.sh

# 访问测试
./test-access.sh

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart ecosystem.config.cjs
```

### 访问地址速查
- **HTTPS (推荐):** https://forsteri.southeastasia.cloudapp.azure.com:5173
- **HTTP:** http://forsteri.southeastasia.cloudapp.azure.com:5173
- **本地前端:** http://localhost:5173

**注意:** File System Access API 需要 HTTPS 环境，建议使用 HTTPS 访问。

### 技术支持
如遇到问题，请提供以下信息：
1. PM2 状态输出: `pm2 status`
2. 错误日志: `pm2 logs --lines 50`
3. 系统信息: `uname -a` 和 `node --version`
4. 网络测试: `./test-access.sh` 的输出

---

**注意:** 确保 Azure VM 有足够的资源 (CPU/内存) 来运行 Node.js 应用程序。建议配置：2核心CPU，4GB内存，20GB存储空间。

---

## HTTPS 配置 (解决 File System Access API 问题)

### 问题说明
File System Access API 要求 HTTPS 环境，HTTP 协议下会出现 `window.showDirectoryPicker is not a function` 错误。

### 解决方案

#### 方案1: 使用 Nginx 反向代理 + Let's Encrypt (推荐)

**1. 安装 Nginx:**
```bash
sudo apt update
sudo apt install nginx
```

**2. 安装 Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
```

**3. 配置 Nginx:**
```bash
sudo nano /etc/nginx/sites-available/timecraft
```

添加以下内容：
```nginx
server {
    listen 80;
    server_name forsteri.southeastasia.cloudapp.azure.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

**4. 启用站点:**
```bash
sudo ln -s /etc/nginx/sites-available/timecraft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**5. 获取 SSL 证书:**
```bash
sudo certbot --nginx -d forsteri.southeastasia.cloudapp.azure.com
```

**6. 更新 Azure 安全组:**
```bash
# 开放 HTTPS 端口
az vm open-port --resource-group <资源组名> --name <虚拟机名> --port 443 --priority 900
az vm open-port --resource-group <资源组名> --name <虚拟机名> --port 80 --priority 901
```

#### 方案2: 使用自签名证书 (开发/测试)

**1. 生成自签名证书:**
```bash
mkdir -p ssl
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
  -subj "/CN=forsteri.southeastasia.cloudapp.azure.com"
```

**2. 安装 @types/node (用于 vite.config.ts):**
```bash
npm install --save-dev @types/node
```

**3. 更新 vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: false,
    cors: true,
    allowedHosts: true,
    hmr: false, // Disable HMR for cloud deployment
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/cert.pem')),
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    cors: true,
    allowedHosts: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/cert.pem')),
    }
  },
  base: './'
})
```

**4. 更新启动脚本:**

在 `start-azure.sh` 中添加证书生成：
```bash
# 在启动前检查并生成 SSL 证书
if [ ! -f "ssl/cert.pem" ]; then
    echo "Creating self-signed SSL certificate..."
    mkdir -p ssl
    openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
      -subj "/CN=forsteri.southeastasia.cloudapp.azure.com"
    echo "SSL certificate created."
fi
```

#### 方案3: 一键 HTTPS 部署脚本

创建 `start-azure-https.sh`:
```bash
#!/bin/bash

echo "=== TimeCraft HTTPS Setup ==="

# 1. Install @types/node
echo "Installing @types/node..."
npm install --save-dev @types/node

# 2. Create SSL directory and certificate
echo "Creating SSL certificate..."
mkdir -p ssl
if [ ! -f "ssl/cert.pem" ]; then
    openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
      -subj "/CN=forsteri.southeastasia.cloudapp.azure.com"
fi

# 3. Update vite.config.ts for HTTPS
echo "Updating vite.config.ts for HTTPS..."
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    open: false,
    cors: true,
    allowedHosts: true,
    hmr: false,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'ssl/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'ssl/cert.pem')),
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    cors: true,
    allowedHosts: true
  },
  base: './'
})
EOF

# 4. Run normal deployment
./start-azure.sh

echo ""
echo "🔒 HTTPS enabled! Access via:"
echo "   https://forsteri.southeastasia.cloudapp.azure.com:5173"
echo ""
echo "⚠️  Browser will show security warning for self-signed certificate."
echo "   Click 'Advanced' -> 'Proceed to forsteri.southeastasia.cloudapp.azure.com'"
```

### 访问地址更新

**使用 Let's Encrypt (推荐):**
- **HTTPS 访问**: https://forsteri.southeastasia.cloudapp.azure.com

**使用自签名证书:**
- **HTTPS 访问**: https://forsteri.southeastasia.cloudapp.azure.com:5173
- **注意**: 浏览器会显示安全警告，需要点击"高级"→"继续访问"

### 快速部署 HTTPS

```bash
# 方案1: Let's Encrypt (需要域名)
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d forsteri.southeastasia.cloudapp.azure.com

# 方案2: 自签名证书 (立即可用)
chmod +x start-azure-https.sh
./start-azure-https.sh
```

### 故障排除

**SSL 证书问题:**
```bash
# 检查证书
openssl x509 -in ssl/cert.pem -text -noout

# 重新生成证书
rm -rf ssl
mkdir ssl
openssl req -x509 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes \
  -subj "/CN=forsteri.southeastasia.cloudapp.azure.com"
```

**端口冲突:**
```bash
# 检查端口占用
sudo netstat -tlnp | grep :443
sudo netstat -tlnp | grep :5173

# 开放防火墙端口 (如果需要)
sudo ufw allow 443
sudo ufw allow 5173
```
