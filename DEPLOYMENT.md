# Deployment Guide

Comprehensive guide for deploying the Document Q&A System to production.

## Prerequisites

- Server with 2GB+ RAM (4GB recommended)
- Python 3.9 or later
- Node.js 18+ (for frontend)
- Reverse proxy (nginx or Caddy)
- Domain name (optional, but recommended)
- SSL certificate (Let's Encrypt recommended)

## Production Checklist

Before deploying to production:

- [ ] Add authentication/authorization
- [ ] Configure CORS properly (restrict origins)
- [ ] Set up HTTPS with SSL certificate
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Back up your data directory regularly
- [ ] Use environment variables for secrets (never commit .env)
- [ ] Set up automatic restarts (systemd, supervisor, PM2)
- [ ] Configure firewall rules
- [ ] Test with production-like data volumes

## Server Setup

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Dependencies

```bash
# Install Python
sudo apt install python3 python3-pip python3-venv -y

# Install Node.js (optional, for frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm (for frontend)
npm install -g pnpm
```

### 3. Create Application User

```bash
sudo useradd -m -s /bin/bash docqa
sudo su - docqa
```

### 4. Clone and Setup

```bash
cd /home/docqa
git clone https://github.com/TejasLamba2006/hack_for_bharat_2026.git
cd hack_for_bharat_2026

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
nano .env  # Edit with your production settings
```

## Configuration

### Production Environment Variables

```env
# Production settings
HOST=127.0.0.1  # Bind to localhost (nginx will handle external)
PORT=9000

# API Keys (use production keys)
OPENROUTER_API_KEY=your_production_key_here

# Model configuration
LLM_MODEL=deepseek/deepseek-chat-v3.1
LLM_API_BASE=https://openrouter.ai/api/v1

# Data directory
DATA_DIR=/var/docqa/data_room

# Embedding configuration
EMBEDDER_TYPE=sentence-transformers
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Performance settings
CHUNK_SIZE=1000
TOP_K=5
```

### Systemd Service

Create `/etc/systemd/system/docqa-backend.service`:

```ini
[Unit]
Description=Document Q&A Backend Server
After=network.target

[Service]
Type=simple
User=docqa
WorkingDirectory=/home/docqa/hack_for_bharat_2026
Environment="PATH=/home/docqa/hack_for_bharat_2026/venv/bin"
ExecStart=/home/docqa/hack_for_bharat_2026/venv/bin/python -m backend.services.pathway_rag_server
Restart=always
RestartSec=10

# Security settings
PrivateTmp=yes
NoNewPrivileges=yes

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable docqa-backend
sudo systemctl start docqa-backend
sudo systemctl status docqa-backend
```

## Nginx Configuration

### Install Nginx

```bash
sudo apt install nginx -y
```

### Configure Site

Create `/etc/nginx/sites-available/docqa`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=docqa_limit:10m rate=10r/s;

upstream docqa_backend {
    server 127.0.0.1:9000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Logging
    access_log /var/log/nginx/docqa_access.log;
    error_log /var/log/nginx/docqa_error.log;

    # Max upload size
    client_max_body_size 100M;

    # Backend API
    location / {
        limit_req zone=docqa_limit burst=20 nodelay;
        
        proxy_pass http://docqa_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for long-running LLM requests
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/docqa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

Auto-renewal is configured automatically. Test it:

```bash
sudo certbot renew --dry-run
```

## Frontend Deployment

### Build Frontend

```bash
cd frontend
pnpm install
pnpm build
```

### Serve with PM2

```bash
npm install -g pm2
pm2 start npm --name "docqa-frontend" -- start
pm2 save
pm2 startup
```

### Or serve with Nginx

Add to nginx config:

```nginx
location / {
    root /home/docqa/hack_for_bharat_2026/frontend/out;
    try_files $uri $uri/ /index.html;
}
```

## Monitoring

### View Logs

```bash
# Backend logs
sudo journalctl -u docqa-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/docqa_access.log
sudo tail -f /var/log/nginx/docqa_error.log
```

### System Resources

```bash
# CPU and memory usage
htop

# Disk usage
df -h
du -sh /var/docqa/data_room
```

## Backups

### Automated Backup Script

Create `/home/docqa/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/docqa"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup documents
tar -czf $BACKUP_DIR/data_room_$DATE.tar.gz /var/docqa/data_room

# Backup cache (optional, can be regenerated)
tar -czf $BACKUP_DIR/cache_$DATE.tar.gz /home/docqa/hack_for_bharat_2026/Cache

# Keep only last 7 days
find $BACKUP_DIR -name "data_room_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "cache_*.tar.gz" -mtime +7 -delete
```

Add to crontab:

```bash
crontab -e
# Add: 0 2 * * * /home/docqa/backup.sh
```

## Security

### Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### API Key Rotation

Regularly rotate your OpenRouter API key:

1. Generate new key at <https://openrouter.ai/keys>
2. Update `.env` file
3. Restart service: `sudo systemctl restart docqa-backend`

## Scaling

### Vertical Scaling

- Increase server RAM for larger documents
- Use faster CPU for quicker embeddings
- Add SSD for faster file I/O

### Horizontal Scaling

For high-traffic deployments:

1. Use a load balancer (nginx, HAProxy)
2. Run multiple backend instances
3. Share `data_room` via NFS or S3
4. Use Redis for caching (future enhancement)

## Troubleshooting

### Service Won't Start

```bash
sudo journalctl -u docqa-backend -n 50
```

Common issues:

- Wrong Python path in systemd service
- Missing environment variables
- Port already in use
- Permission issues with data_room

### High Memory Usage

- Reduce `CHUNK_SIZE` in `.env`
- Use a smaller embedding model
- Limit document size (split large PDFs)

### Slow Responses

- Check OpenRouter API status
- Verify network connectivity
- Review nginx timeout settings
- Monitor server resources with `htop`

## Updates

### Update Code

```bash
cd /home/docqa/hack_for_bharat_2026
git pull
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart docqa-backend
```

### Update Dependencies

```bash
pip install --upgrade -r requirements.txt
```

## Cost Estimation

**Monthly costs for small deployment (1000 queries/month):**

- VPS (DigitalOcean, Linode): $12-24/month (2GB RAM)
- Domain: $10-15/year
- SSL: Free (Let's Encrypt)
- OpenRouter API (DeepSeek): ~$3/month
- **Total: ~$15-27/month**

## Support

- GitHub Issues: <https://github.com/TejasLamba2006/hack_for_bharat_2026/issues>
- Documentation: See README.md and API_ENDPOINTS.md
