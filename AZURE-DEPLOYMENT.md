# TimeCraft Azure Cloud 部署指南

## 通过 forsteri.southeastasia.cloudapp.azure.com 访问 TimeCraft

### 快速启动

#### Windows:
```batch
start-azure.bat
```

#### Linux:
```bash
chmod +x start-azure.sh
./start-azure.sh
```

### 手动启动命令

```bash
# 安装依赖
npm install

# 启动后端服务器 (端口 3001)
node server.js &

# 启动前端服务器 (端口 5173, 绑定到所有网络接口)
npm run dev:azure
```

### 访问地址

- **外网访问 (公网IP):** http://20.6.81.42:5173
- **外网访问 (域名):** http://forsteri.southeastasia.cloudapp.azure.com:5173
- **本地访问:** http://localhost:5173
- **后端API (公网IP):** http://20.6.81.42:3001
- **后端API (域名):** http://forsteri.southeastasia.cloudapp.azure.com:3001

**重要说明:**
- 公网IP: `20.6.81.42` (从外网访问使用此IP)
- 内网IP: `10.0.0.4` (Vite显示的Network地址，仅VM内部使用)
- 域名会自动解析到公网IP `20.6.81.42`

### Azure 云服务器配置要求

#### 1. 防火墙/安全组设置
确保以下端口在Azure安全组中已开放：
- **入站规则:**
  - 端口 5173 (TCP) - Vite前端服务器
  - 端口 3001 (TCP) - Express后端服务器
  - 端口 22 (TCP) - SSH (如果需要)

#### 2. 网络安全组 (NSG) 配置
```
规则名称: TimeCraft-Frontend
端口: 5173
协议: TCP
源: Any (0.0.0.0/0)
操作: Allow

规则名称: TimeCraft-Backend  
端口: 3001
协议: TCP
源: Any (0.0.0.0/0)
操作: Allow
```

#### 3. Azure CLI 命令 (如果需要)
```bash
# 开放端口 5173
az vm open-port --resource-group <资源组名> --name <虚拟机名> --port 5173

# 开放端口 3001  
az vm open-port --resource-group <资源组名> --name <虚拟机名> --port 3001
```

### 环境变量配置

在Azure VM中设置以下环境变量：
```bash
export NODE_ENV=production
export HOST=0.0.0.0
export PORT=5173
export BACKEND_PORT=3001
```

### 生产环境部署

#### 1. 构建生产版本
```bash
npm run build
```

#### 2. 使用 PM2 进程管理器 (推荐)
```bash
# 安装 PM2
npm install -g pm2

# 启动后端
pm2 start server.js --name "timecraft-backend"

# 启动前端 (生产模式)
pm2 start "npm run preview" --name "timecraft-frontend"

# 保存 PM2 配置
pm2 save
pm2 startup
```

### 故障排除

#### 1. Host not allowed 错误
如果遇到 "To allow this host, add to `server.allowedHosts`" 错误：
- ✅ vite.config.ts 已配置 `allowedHosts: true` (允许所有主机)
- ✅ 配置了 `host: '0.0.0.0'` (监听所有接口)
- ✅ 移除了不支持的 CLI 参数

**重启Vite服务器:**
```bash
# 停止当前服务器 (Ctrl+C)
# 然后重新启动
npm run dev:azure
```

**手动验证配置:**
```bash
# 检查配置文件
cat vite.config.ts

# 重新安装依赖 (如果需要)
npm install
```

#### 2. 无法访问外网
- 检查Azure安全组是否开放了端口5173和3001
- 确认VM的公网IP地址是否正确绑定到域名
- 检查本地防火墙设置

#### 2. CORS 错误
- 确认server.js中的CORS设置允许所有来源
- 检查Vite配置中的CORS设置

#### 3. 端口被占用
```bash
# 检查端口占用
netstat -tulpn | grep :5173
netstat -tulpn | grep :3001

# 杀死占用端口的进程
sudo kill -9 <PID>
```

#### 4. 检查服务状态
```bash
# 检查服务是否运行
curl http://localhost:5173
curl http://localhost:3001

# 检查外网访问
curl http://forsteri.southeastasia.cloudapp.azure.com:5173
```

### 域名解析验证

```bash
# 验证域名解析
nslookup forsteri.southeastasia.cloudapp.azure.com

# 测试连接
ping forsteri.southeastasia.cloudapp.azure.com
```

### 日志查看

```bash
# PM2 日志 (如果使用PM2)
pm2 logs

# 直接运行的日志
# 前端: 查看启动终端输出
# 后端: 查看node server.js输出
```

---

**注意:** 确保Azure VM有足够的资源(CPU/内存)来运行Node.js应用程序。
