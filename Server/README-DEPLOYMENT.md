# JaysKeralaHM Server Deployment Guide

This guide explains how to set up CI/CD pipeline for deploying the server to AWS EC2 instances.

## 🚀 Quick Start

### 1. EC2 Instance Setup

First, set up your EC2 instance:

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Run the setup script
curl -fsSL https://raw.githubusercontent.com/yourusername/jayskeralahm/main/Server/scripts/ec2-setup.sh | bash
```

### 2. GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

#### Required Secrets:
- `EC2_HOST`: Your EC2 instance public IP or domain
- `EC2_USERNAME`: SSH username (usually `ubuntu`)
- `EC2_SSH_KEY`: Your private SSH key for EC2 access
- `EC2_PORT`: SSH port (usually `22`)
- `DATABASE_URL`: Your production database connection string

#### Optional Secrets (for advanced workflow):
- `STAGING_EC2_HOST`: Staging EC2 instance IP
- `PRODUCTION_EC2_HOST`: Production EC2 instance IP
- `STAGING_DATABASE_URL`: Staging database URL
- `PRODUCTION_DATABASE_URL`: Production database URL
- `TEST_DATABASE_URL`: Test database URL

### 3. SSH Key Setup

Generate SSH key pair for GitHub Actions:

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "github-actions@yourdomain.com"

# Add public key to EC2 instance
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys

# Add private key to GitHub Secrets as EC2_SSH_KEY
cat ~/.ssh/id_rsa
```

## 📋 Workflow Files

### Basic Workflow (`server-deploy.yml`)
- Triggers on commits to `Server/**` folder
- Simple deployment to single EC2 instance
- Good for development/staging environments

### Advanced Workflow (`server-deploy-advanced.yml`)
- Supports multiple environments (staging/production)
- Includes testing and linting
- Better error handling and rollback capabilities
- Manual deployment triggers

## 🔧 Environment Configuration

### Production Environment Variables

Create `.env` file on your EC2 instance:

```env
NODE_ENV=production
DATABASE_URL="mysql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
FRONTEND_URL="https://yourdomain.com"
```

### PM2 Configuration

The setup script creates `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'jayskeralahm-server',
    script: 'src/App.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

## 🌐 Nginx Configuration

The setup script configures Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Security Considerations

### Firewall Setup
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw --force enable
```

### SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring and Logs

### PM2 Commands
```bash
# View running processes
pm2 list

# View logs
pm2 logs jayskeralahm-server

# Monitor resources
pm2 monit

# Restart application
pm2 restart jayskeralahm-server
```

### Log Files
- Application logs: `Server/logs/`
- Nginx logs: `/var/log/nginx/`
- System logs: `/var/log/syslog`

## 🚨 Troubleshooting

### Common Issues

1. **Deployment fails with SSH error**
   - Check SSH key in GitHub secrets
   - Verify EC2 security group allows SSH access
   - Ensure correct username and host

2. **Application won't start**
   - Check environment variables
   - Verify database connection
   - Check PM2 logs: `pm2 logs jayskeralahm-server`

3. **Health check fails**
   - Verify application is running on correct port
   - Check firewall settings
   - Ensure health endpoint is accessible

### Debug Commands
```bash
# Check application status
pm2 status

# View recent logs
pm2 logs jayskeralahm-server --lines 50

# Test database connection
npm run db:studio

# Check port usage
sudo netstat -tlnp | grep :3000
```

## 🔄 Manual Deployment

If you need to deploy manually:

```bash
# SSH into EC2 instance
ssh ubuntu@your-ec2-ip

# Navigate to project
cd /home/ubuntu/jayskeralahm/Server

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --only=production

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Restart application
pm2 restart jayskeralahm-server
```

## 📈 Performance Optimization

### PM2 Cluster Mode
The configuration uses cluster mode for better performance:
- Automatically spawns multiple processes
- Load balances requests across instances
- Restarts crashed processes

### Nginx Optimization
```nginx
# Add to nginx config for better performance
gzip on;
gzip_types text/plain text/css application/json application/javascript;
client_max_body_size 10M;
```

## 🔄 Rollback Strategy

The advanced workflow includes automatic backups:

```bash
# Manual rollback
cd /home/ubuntu/jayskeralahm/Server
git reset --hard HEAD~1
npm ci --only=production
pm2 restart jayskeralahm-server
```

## 📞 Support

For issues with deployment:
1. Check GitHub Actions logs
2. Review EC2 instance logs
3. Verify all secrets are correctly configured
4. Ensure database is accessible from EC2

---

**Note**: Replace `yourusername`, `yourdomain.com`, and other placeholders with your actual values. 