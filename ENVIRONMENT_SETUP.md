# Environment Configuration Guide

## Backend Environment Variables (Railway)

Set these environment variables in your Railway dashboard:

```
CORS_ORIGINS=https://canvas-connect-eight.vercel.app,http://localhost:5173,http://localhost:3000
SECRET_KEY=0y=y#tq188ebf#)4e_7a=!t_4th8$9v2)@428^!abrgm68=vq)
FLASK_ENV=production
PORT=5000
NIXPACKS_PYTHON_VERSION=3.9
```

## Frontend Environment Variables

### Local Development (.env.local)
```
VITE_API_BASE_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

### Production (Netlify/Vercel)
Set these in your deployment platform's environment variables:
```
VITE_API_BASE_URL=https://canvasconnect-production.up.railway.app
VITE_SOCKET_URL=https://canvasconnect-production.up.railway.app
```

## Firebase Setup

1. Add your production domain to Firebase Console:
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add: `canvas-connect-eight.vercel.app`

## Deployment URLs

- **Frontend (Vercel)**: https://canvas-connect-eight.vercel.app
- **Backend (Railway)**: https://canvasconnect-production.up.railway.app

## Troubleshooting

### Railway Deployment Issues
- Ensure gunicorn is in requirements.txt
- Check that railway.toml has correct startCommand
- Verify environment variables are set

### Frontend Connection Issues  
- Verify VITE_API_BASE_URL points to correct backend URL
- Check CORS settings on backend include frontend domain
- Ensure environment variables are set in deployment platform
