# WSL2 快速开始（3步）

## ? 最快速的方法

### 1. 在 WSL2 终端中进入项目目录

```bash
# 如果项目在Windows文件系统中（D盘）
cd /mnt/d/Users/Lenovo/Desktop/LLM_help_se/homework3/app_507029916162

# 或者将项目复制到WSL2文件系统（推荐，性能更好）
cp -r /mnt/d/Users/Lenovo/Desktop/LLM_help_se ~/projects/
cd ~/projects/LLM_help_se/homework3/app_507029916162
```

### 2. 确保 Docker 正在运行

```bash
# 检查Docker状态
docker ps

# 如果显示错误，启动Docker
sudo service docker start
```

### 3. 运行构建脚本

```bash
# 给脚本执行权限（只需第一次）
chmod +x build_docker_wsl2.sh

# 运行构建（自动构建+导出）
./build_docker_wsl2.sh
```

**完成！** 镜像文件 `tuzhixing-app.tar.gz` 已生成。

---

## ? 文件位置

构建完成后，文件位置：
- 如果在 `/mnt/d/...` 下构建：文件在 Windows 中可以直接访问
- 如果在 `~/projects/...` 下构建：
  ```bash
  # 查看完整路径
  realpath tuzhixing-app.tar.gz
  
  # 复制到Windows可访问位置
  cp tuzhixing-app.tar.gz /mnt/d/Users/Lenovo/Desktop/
  ```

---

## ? 性能提示

**强烈建议**: 将项目复制到 WSL2 文件系统再构建！

```bash
# 复制项目到WSL2（只需一次）
cp -r /mnt/d/Users/Lenovo/Desktop/LLM_help_se ~/projects/

# 在WSL2文件系统中构建（速度快很多）
cd ~/projects/LLM_help_se/homework3/app_507029916162
./build_docker_wsl2.sh

# 构建完成后复制结果到Windows
cp tuzhixing-app.tar.gz /mnt/d/Users/Lenovo/Desktop/
```

---

## ? 遇到问题？

### Docker未运行
```bash
sudo service docker start
```

### 权限问题
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 构建太慢
- 使用 `~/projects/` 而不是 `/mnt/d/`（WSL2文件系统性能更好）

详细指南: [WSL2_DOCKER_GUIDE.md](./WSL2_DOCKER_GUIDE.md)


