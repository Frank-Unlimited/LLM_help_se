# 域名访问配置指南

## 🌐 配置 www.hanhc.asia 域名访问

如果访问 `www.hanhc.asia` 时出现"拒绝连接"错误，请按照以下步骤检查配置。

---

## ✅ 检查清单

### 1. DNS 解析配置

**确保域名 A 记录正确指向服务器 IP**：

```bash
# 检查域名解析
nslookup www.hanhc.asia
# 或
dig www.hanhc.asia
```

**应该看到你的服务器公网 IP**。如果解析错误，请：
- 登录域名注册商/DNS 服务商（如阿里云 DNS）
- 添加 A 记录：`www.hanhc.asia` → `你的服务器IP`
- 等待 DNS 生效（通常几分钟到几小时）

### 2. 服务器防火墙/安全组

**确保开放以下端口**：

```bash
# 检查防火墙规则（CentOS/RHEL）
sudo firewall-cmd --list-all

# 检查防火墙规则（Ubuntu/Debian）
sudo ufw status

# 如果使用云服务器，检查安全组规则
# - HTTP (80端口)
# - HTTPS (443端口)
```

**开放端口**：
```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### 3. 容器运行状态

**确认 Docker 容器正在运行**：

```bash
# 检查容器状态
docker ps | grep tuzhixing-app

# 检查容器端口映射
docker port tuzhixing-app

# 应该显示：6666/tcp -> 0.0.0.0:6666
```

如果容器未运行，启动它：
```bash
docker start tuzhixing-app
# 或
docker run -d \
  --name tuzhixing-app \
  -p 6666:6666 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
```

### 4. 配置外部 Nginx（必需）

**容器只监听 6666 端口，需要通过外部 Nginx 反向代理**：

#### 安装系统 Nginx

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
```

#### 创建 Nginx 配置文件

创建 `/etc/nginx/sites-available/www.hanhc.asia`：

```nginx
# HTTP 配置（可选，如果只需要 HTTPS 可以删除）
server {
    listen 80;
    server_name www.hanhc.asia hanhc.asia;
    
    # 可选：重定向到 HTTPS
    # return 301 https://$server_name$request_uri;
    
    # 或者直接代理到容器（HTTP）
    location / {
        proxy_pass http://127.0.0.1:6666;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持（如果需要）
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# HTTPS 配置（推荐）
server {
    listen 443 ssl http2;
    server_name www.hanhc.asia hanhc.asia;
    
    # SSL 证书路径（使用 Let's Encrypt 或阿里云证书）
    ssl_certificate /etc/nginx/ssl/www.hanhc.asia.crt;
    ssl_certificate_key /etc/nginx/ssl/www.hanhc.asia.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://127.0.0.1:6666;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket 支持
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/www.hanhc.asia /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 如果测试通过，重启 Nginx
sudo systemctl restart nginx

# 设置开机自启
sudo systemctl enable nginx
```

---

## 🔒 配置 HTTPS（推荐）

### 方案 1：使用 Let's Encrypt 免费证书（推荐）

```bash
# 安装 certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx -y

# 获取 SSL 证书（自动配置 Nginx）
sudo certbot --nginx -d www.hanhc.asia -d hanhc.asia

# 测试自动续期
sudo certbot renew --dry-run
```

**certbot 会自动**：
- 获取 SSL 证书
- 配置 Nginx
- 设置自动续期

### 方案 2：使用阿里云 SSL 证书

1. **在阿里云控制台申请 SSL 证书**（免费 DV 证书）
2. **下载证书文件**（选择 Nginx 格式）
3. **上传到服务器**：

```bash
# 创建 SSL 目录
sudo mkdir -p /etc/nginx/ssl

# 上传证书文件（使用 scp 或其他方式）
# 假设证书文件为 www.hanhc.asia.crt 和 www.hanhc.asia.key
sudo cp www.hanhc.asia.crt /etc/nginx/ssl/
sudo cp www.hanhc.asia.key /etc/nginx/ssl/
sudo chmod 600 /etc/nginx/ssl/*
```

4. **使用上面的 Nginx 配置**

---

## 🔍 故障排查

### 1. 测试本地访问

```bash
# 在服务器上测试容器是否正常
curl http://localhost:6666/api/health

# 测试外部 Nginx
curl http://localhost
curl http://www.hanhc.asia
```

### 2. 检查 Nginx 日志

```bash
# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/access.log
```

### 3. 检查端口监听

```bash
# 检查 80 端口
sudo netstat -tlnp | grep :80
sudo ss -tlnp | grep :80

# 检查 443 端口
sudo netstat -tlnp | grep :443
sudo ss -tlnp | grep :443

# 检查 6666 端口（容器）
sudo netstat -tlnp | grep :6666
```

### 4. 检查 DNS 解析

```bash
# 在服务器上测试
ping www.hanhc.asia

# 使用 dig 查看详细 DNS 信息
dig www.hanhc.asia +short
```

### 5. 测试容器内部

```bash
# 进入容器检查
docker exec -it tuzhixing-app sh

# 在容器内测试
curl http://localhost:6666/api/health
```

---

## 📋 完整配置示例

### 场景 1：只使用 HTTP（不推荐，但可以测试）

```bash
# 1. 确保容器运行在 6666 端口
docker run -d \
  --name tuzhixing-app \
  -p 6666:6666 \
  --restart unless-stopped \
  crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest

# 2. 配置 Nginx（仅 HTTP）
sudo nano /etc/nginx/sites-available/www.hanhc.asia
```

Nginx 配置：
```nginx
server {
    listen 80;
    server_name www.hanhc.asia hanhc.asia;
    
    location / {
        proxy_pass http://127.0.0.1:6666;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 场景 2：使用 HTTPS（推荐）

```bash
# 1. 使用 Let's Encrypt 自动配置
sudo certbot --nginx -d www.hanhc.asia -d hanhc.asia

# 2. certbot 会自动配置好一切！
```

---

## ✅ 验证配置

配置完成后，测试访问：

```bash
# 1. HTTP 访问（如果配置了）
curl -I http://www.hanhc.asia

# 2. HTTPS 访问
curl -I https://www.hanhc.asia

# 3. 在浏览器访问
# http://www.hanhc.asia:6666 （直接访问容器，不推荐）
# http://www.hanhc.asia （通过 Nginx，推荐）
# https://www.hanhc.asia （HTTPS，最推荐）
```

---

## ⚠️ 常见错误

### 错误 1：连接被拒绝

**原因**：
- DNS 未解析
- 防火墙未开放端口
- Nginx 未运行

**解决**：
```bash
# 检查 Nginx 状态
sudo systemctl status nginx

# 启动 Nginx
sudo systemctl start nginx

# 检查端口
sudo netstat -tlnp | grep nginx
```

### 错误 2：502 Bad Gateway

**原因**：
- 容器未运行
- 容器端口不是 6666

**解决**：
```bash
# 检查容器
docker ps | grep tuzhixing-app

# 检查端口映射
docker port tuzhixing-app

# 重启容器
docker restart tuzhixing-app
```

### 错误 3：SSL 证书错误

**原因**：
- 证书路径错误
- 证书文件权限问题

**解决**：
```bash
# 检查证书文件
ls -la /etc/nginx/ssl/

# 修复权限
sudo chmod 600 /etc/nginx/ssl/*.key
sudo chmod 644 /etc/nginx/ssl/*.crt
```

---

## 🚀 快速配置脚本

创建一键配置脚本 `setup-domain.sh`：

```bash
#!/bin/bash

DOMAIN="www.hanhc.asia"
EMAIL="your-email@example.com"  # Let's Encrypt 需要邮箱

echo "开始配置域名 $DOMAIN..."

# 1. 安装 Nginx
if ! command -v nginx &> /dev/null; then
    echo "安装 Nginx..."
    sudo apt-get update
    sudo apt-get install nginx -y
fi

# 2. 安装 certbot
if ! command -v certbot &> /dev/null; then
    echo "安装 certbot..."
    sudo apt-get install certbot python3-certbot-nginx -y
fi

# 3. 确保容器运行
echo "检查容器状态..."
if ! docker ps | grep -q tuzhixing-app; then
    echo "启动容器..."
    docker run -d \
      --name tuzhixing-app \
      -p 6666:6666 \
      --restart unless-stopped \
      crpi-925djdtsud86yqkr.cn-hangzhou.personal.cr.aliyuncs.com/hhc510105200301150090/hhc:latest
fi

# 4. 获取 SSL 证书
echo "获取 SSL 证书..."
sudo certbot --nginx -d $DOMAIN -d ${DOMAIN#www.} --non-interactive --agree-tos --email $EMAIL

# 5. 重启 Nginx
sudo systemctl restart nginx

echo "配置完成！"
echo "访问: https://$DOMAIN"
```

**使用**：
```bash
chmod +x setup-domain.sh
./setup-domain.sh
```

---

**配置完成后，访问 `https://www.hanhc.asia` 应该可以正常访问了！** 🎉

