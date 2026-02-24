# Security Notes

## JWT Secret Rotation
If you suspect JWT secrets are compromised:
1. SSH into server: ssh root@app.lytherahub.com
2. Generate new secrets: openssl rand -hex 32
3. Update /opt/lytherahub/backend/.env: SECRET_KEY and JWT_SECRET_KEY
4. Restart backend: docker compose -f docker-compose.prod.yml restart backend
5. All existing sessions will be invalidated — users must log in again

## Demo Access Code
Current demo access: ?access=lytherahub2026
To change it: update the string in frontend/src/auth/AuthContext.jsx and redeploy frontend.

## Emergency Lockdown
To take the app offline immediately:
docker compose -f docker-compose.prod.yml stop frontend

To block all traffic:
ufw deny 80/tcp && ufw deny 443/tcp
