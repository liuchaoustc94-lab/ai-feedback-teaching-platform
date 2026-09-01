# 部署文件

生产环境使用独立 Conda 环境运行 FastAPI，SQLite 文件放在版本目录之外，Nginx 只将 `/api` 反代到 `127.0.0.1:8001`。

1. 将 `aift-api.env.example` 复制到服务器的 `/etc/ai-feedback-teaching-platform/api.env`，只在服务器填写 `AIFT_BOOTSTRAP_ADMIN_PASSWORD`，并设置为 root 可读（`0600`）。
2. 将 `ai-feedback-teaching-platform.service` 安装到 `/etc/systemd/system/`。示例使用 `/opt/aift-conda` 前缀；若服务器环境前缀不同，把 `ExecStart` 改为实际环境中的 `uvicorn` 绝对路径。
3. 以 `ai-feedback` 用户运行服务，并让其拥有 `/var/lib/ai-feedback-teaching-platform` 的读写权限。
4. 用 `ai-feedback-ip-https.conf` 替换现有 IP HTTPS server 块，用 `ai-feedback-teaching-platform-8080.conf` 替换旧的 8080 静态 server 块；保留 80 端口的 ACME challenge 和 HTTPS 跳转配置。
5. 执行 `nginx -t && systemctl reload nginx`，再执行 `systemctl enable --now ai-feedback-teaching-platform`。

管理员初始账号固定为 `admin`。首次登录后必须修改密码；初始密码不写入仓库。
