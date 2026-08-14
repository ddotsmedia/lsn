# 🌐 PRODUCTION DEPLOYMENT TO LSN.AE
## Little Smarties Website & Admin Panel

**Domain**: lsn.ae  
**VPS IP**: 187.127.185.239  
**Frontend**: https://lsn.ae  
**Admin Panel**: https://admin.lsn.ae  
**Status**: Ready for Production Deployment

---

## 📋 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Phase 1 deployed and working on VPS
- [ ] DNS access to registrar (al-watan.ae)
- [ ] Email for Let's Encrypt: admin@lsn.ae
- [ ] Team notified of deployment window
- [ ] Backup of current configuration created

### DNS Configuration (Step 1)
- [ ] Add A record: lsn.ae → 187.127.185.239
- [ ] Add A record: admin.lsn.ae → 187.127.185.239
- [ ] Add A record: www.lsn.ae → 187.127.185.239
- [ ] Wait for DNS propagation (verify with nslookup)
- [ ] Verify DNS resolves correctly

### Nginx Installation (Step 2)
- [ ] Install nginx and certbot
- [ ] Backup default nginx configuration
- [ ] Stop nginx service

### Nginx Configuration (Step 3)
- [ ] Create /etc/nginx/sites-available/lsn.ae
- [ ] Configure reverse proxy for frontend (port 3000)
- [ ] Configure reverse proxy for backend API (port 3001)
- [ ] Configure HTTP → HTTPS redirect
- [ ] Configure security headers
- [ ] Add static file caching rules
- [ ] Test nginx configuration (nginx -t)
- [ ] Enable site symlink
- [ ] Start nginx

### SSL Certificates (Step 4)
- [ ] Install Let's Encrypt certificates
- [ ] Verify certificate files exist
- [ ] Reload nginx with SSL config
- [ ] Test HTTPS connection
- [ ] Verify certificate validity with openssl

### Backend CORS (Step 5)
- [ ] Update CORS origins in backend
- [ ] Add: https://lsn.ae
- [ ] Add: https://www.lsn.ae
- [ ] Add: https://admin.lsn.ae
- [ ] Rebuild frontend and backend
- [ ] Redeploy Docker services
- [ ] Verify no CORS errors in console

### Testing (Step 6-8)
- [ ] Website loads at https://lsn.ae
- [ ] HTTP redirects to HTTPS
- [ ] SSL certificate shows valid
- [ ] Admin login at https://admin.lsn.ae works
- [ ] Section editing works
- [ ] API calls succeed (no CORS errors)
- [ ] Mobile responsive
- [ ] Performance acceptable

### SSL Renewal (Step 9)
- [ ] Create renewal script
- [ ] Add to crontab
- [ ] Verify cron job entry

### Security Hardening (Step 12)
- [ ] Update system packages
- [ ] Install fail2ban
- [ ] Configure rate limiting
- [ ] Set up log rotation
- [ ] Configure firewall (UFW)
- [ ] Test firewall rules

### Final Verification (Step 13)
- [ ] All tests passing
- [ ] No errors in logs
- [ ] Git commit created
- [ ] Changes pushed to git
- [ ] Production ready confirmed

---

## ⏱️ ESTIMATED TIMELINE

| Phase | Action | Time |
|-------|--------|------|
| 1 | DNS Setup | 5-10 min |
| 2-3 | Nginx Installation | 10-15 min |
| 4 | SSL Certificates | 5-10 min |
| 5 | CORS Update | 5-10 min |
| 6-8 | Testing | 10-15 min |
| 9-12 | Security & Renewal | 10-15 min |
| **TOTAL** | **Complete Setup** | **50-75 minutes** |

---

## 🔑 KEY CREDENTIALS & ENDPOINTS

### Production URLs
```
Website:     https://lsn.ae
Website Alt: https://www.lsn.ae
Admin Panel: https://admin.lsn.ae
API:         https://lsn.ae/api/v1
```

### Admin Login
```
Email:    admin@lsn.ae
Password: AdminSecret123!
```

### Let's Encrypt
```
Email:       admin@lsn.ae
Certificates: /etc/letsencrypt/live/lsn.ae/
Renewal:     Automatic (daily cron check)
```

---

## 📊 NGINX CONFIGURATION HIGHLIGHTS

### Reverse Proxy Routing
```
https://lsn.ae          → http://localhost:3000 (Next.js frontend)
https://lsn.ae/api/v1/  → http://localhost:3001 (Express API)
https://admin.lsn.ae    → http://localhost:3000 (Same frontend)
```

### Security Headers
```
Strict-Transport-Security: max-age=31536000
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer-when-downgrade
```

### SSL/TLS
```
Protocols: TLSv1.2, TLSv1.3
Ciphers: HIGH:!aNULL:!MD5
Certificate: Let's Encrypt
HTTP/2: Enabled
```

### Performance
```
Static Caching: 30 days
Gzip: Enabled
Proxy Timeouts: 60 seconds
Connection Keep-Alive: Enabled
```

---

## 🔒 SECURITY MEASURES

✅ **HTTPS Encryption**
- All traffic encrypted with TLS 1.2+
- Certificate from Let's Encrypt
- HTTP automatically redirects to HTTPS

✅ **Security Headers**
- HSTS enabled (forces HTTPS)
- Clickjacking protection (X-Frame-Options)
- MIME type sniffing prevention
- XSS protection enabled
- Referrer policy configured

✅ **Authentication**
- Admin panel requires login
- JWT tokens for API
- CORS restricted to known domains

✅ **Rate Limiting**
- API rate limiting enabled
- 10 requests per second limit
- Protects against brute-force

✅ **Firewall**
- UFW firewall configured
- Only ports 22 (SSH), 80 (HTTP), 443 (HTTPS) open
- Application ports (3000, 3001) only accessible locally

✅ **Log Monitoring**
- Nginx access logs available
- Nginx error logs monitored
- Log rotation configured (14-day retention)

✅ **Intrusion Prevention**
- fail2ban installed
- Blocks repeated failed login attempts
- Automatic IP banning for suspicious activity

---

## 📈 PERFORMANCE TARGETS

After production deployment, verify:

| Metric | Target | Method |
|--------|--------|--------|
| Page Load | < 2 seconds | Chrome DevTools |
| TTFB | < 500ms | curl timing |
| SSL Handshake | < 100ms | openssl s_client |
| API Response | < 200ms | curl timing |
| Uptime | 99.9%+ | Monitoring |
| Cache Hit Ratio | > 80% | Nginx stats |

---

## 🆘 TROUBLESHOOTING REFERENCE

### DNS Not Resolving
```bash
# Check DNS
nslookup lsn.ae
dig lsn.ae

# May take 24-48 hours to propagate
# Try with different DNS server: nslookup lsn.ae 8.8.8.8
```

### Nginx Not Starting
```bash
# Check configuration
sudo nginx -t

# View error logs
sudo tail -50 /var/log/nginx/error.log

# Check service status
sudo systemctl status nginx
```

### SSL Certificate Issues
```bash
# Verify certificate
sudo certbot certificates

# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/lsn.ae/fullchain.pem -text -noout

# Manual renewal
sudo certbot renew --force-renewal
```

### CORS Errors
```bash
# Check backend CORS config
grep -A 5 "cors({" apps/backend/src/app.ts

# Verify API response headers
curl -v https://lsn.ae/api/v1/health

# Should include: Access-Control-Allow-Origin: https://lsn.ae
```

### Port Already in Use
```bash
# Check what's using port 80/443
sudo lsof -i :80
sudo lsof -i :443

# Kill process if needed
sudo kill -9 <PID>
```

---

## 📝 DEPLOYMENT EXECUTION ORDER

**CRITICAL: Execute in this order on VPS**

1. ✅ Verify Phase 1 deployed and running
2. Configure DNS records at registrar
3. Install Nginx and Certbot
4. Create Nginx configuration
5. Test Nginx config (nginx -t)
6. Install SSL certificates
7. Reload Nginx
8. Update backend CORS
9. Rebuild and redeploy services
10. Test all endpoints
11. Configure SSL renewal
12. Security hardening
13. Final verification
14. Commit to git

---

## 🚀 QUICK START EXECUTION

After DNS is set up and propagated:

```bash
# SSH to VPS
ssh root@187.127.185.239
cd /opt/littlesmarties

# Run production deployment script
bash deploy-production.sh

# Monitor deployment
tail -f /var/log/nginx/error.log

# Verify after completion
curl -v https://lsn.ae
curl -v https://admin.lsn.ae
```

---

## ✅ SUCCESS VERIFICATION

Deployment is successful when:

✅ https://lsn.ae loads with green padlock  
✅ https://admin.lsn.ae shows login  
✅ Admin login works with credentials  
✅ Section editing saves changes  
✅ No CORS errors in console (F12)  
✅ SSL certificate shows valid  
✅ Page load time < 2 seconds  
✅ No errors in nginx logs  
✅ Nginx running and enabled  
✅ Let's Encrypt renewal scheduled  

---

## 📞 PRODUCTION SUPPORT

### Monitoring
- Access logs: `/var/log/nginx/access.log`
- Error logs: `/var/log/nginx/error.log`
- Docker status: `docker-compose ps`
- Disk space: `df -h`
- Memory: `free -h`

### Health Checks
```bash
# Website
curl -v https://lsn.ae

# Admin
curl -v https://admin.lsn.ae

# API
curl https://lsn.ae/api/v1/health

# SSL Certificate
openssl s_client -connect lsn.ae:443 -servername lsn.ae
```

### Common Tasks
```bash
# View nginx status
sudo systemctl status nginx

# Restart nginx (graceful)
sudo systemctl reload nginx

# View recent logs
sudo tail -50 /var/log/nginx/error.log

# Check certificate expiry
sudo certbot certificates

# Renew certificate (manual)
sudo certbot renew --force-renewal
```

---

## 📚 SUPPORTING DOCUMENTATION

Files included:
- `deploy-production.sh` - Automated deployment script
- `nginx-lsn.ae.conf` - Nginx configuration
- `PRODUCTION_DEPLOYMENT_PLAN.md` - This file
- `TROUBLESHOOTING.md` - Detailed troubleshooting guide

---

**Status**: Ready for Production Deployment  
**Created**: August 14, 2026  
**Last Updated**: August 14, 2026
