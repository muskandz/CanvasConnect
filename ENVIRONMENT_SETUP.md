# Environment Configuration Guide

## Backend Environment Variables (Render.com)

Set these environment variables in your Render dashboard:

```
CORS_ORIGINS=https://canvas-connect-eight.vercel.app,http://localhost:5173,http://localhost:3000
SECRET_KEY=0y=y#tq188ebf#)4e_7a=!t_4th8$9v2)@428^!abrgm68=vq)
FLASK_ENV=production
PORT=10000
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
VITE_API_BASE_URL=https://your-app-name.onrender.com
VITE_SOCKET_URL=https://your-app-name.onrender.com
```

## Firebase Setup

1. Add your production domain to Firebase Console:
   - Go to Firebase Console → Authentication → Settings → Authorized domains
   - Add: `canvas-connect-eight.vercel.app`

## Deployment URLs

- **Frontend (Vercel)**: https://canvas-connect-eight.vercel.app
- **Backend (Render)**: https://your-app-name.onrender.com

## Troubleshooting

### Render Deployment Issues
- Check that requirements.txt includes all dependencies
- Verify Python version compatibility
- Ensure environment variables are set correctly

### Frontend Connection Issues  
- Verify VITE_API_BASE_URL points to correct Render URL
- Check CORS settings on backend include frontend domain
- Ensure environment variables are set in deployment platform
