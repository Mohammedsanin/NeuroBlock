# Deploying NeuroBlocks to Render

## Prerequisites
- GitHub account
- Render account (free): https://render.com
- Gemini API key: https://makersuite.google.com/app/apikey

## Deployment Steps

### 1. Prepare Your Repository

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/neuro-blocks.git
git push -u origin main
```

### 2. Deploy on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name**: `neuro-blocks`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Python 3`
   - **Build Command**: 
     ```
     pip install -r backend/requirements.txt && npm install && npm run build
     ```
   - **Start Command**: 
     ```
     cd backend && gunicorn app:app --bind 0.0.0.0:$PORT
     ```
   - **Plan**: Free

5. **Add Environment Variables:**
   - Click "Environment" tab
   - Add: `GEMINI_API_KEY` = `your_gemini_api_key_here`

6. **Click "Create Web Service"**

### 3. Update Frontend API URL

After deployment, Render will give you a URL like: `https://neuro-blocks.onrender.com`

Update your frontend to use this URL:

**In `src/lib/api.ts`**, change:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

Then add to your repository's `.env` file:
```
VITE_API_URL=https://neuro-blocks.onrender.com
```

Commit and push - Render will auto-redeploy!

### 4. Configure Flask to Serve Frontend

The backend is already configured to serve the built frontend files from the `dist/` folder.

## Important Notes

### Free Tier Limitations
- ⚠️ **Spins down after 15 minutes of inactivity**
- ⚠️ **First request after sleep takes ~30 seconds**
- ✅ **750 hours/month free**
- ✅ **Automatic HTTPS**

### Keeping It Awake (Optional)
Use a service like UptimeRobot to ping your app every 14 minutes.

### Environment Variables
Never commit your `.env` file! Add it to `.gitignore`:
```
backend/.env
.env
```

## Troubleshooting

### Build Fails
- Check `backend/requirements.txt` has all dependencies
- Ensure Python version is 3.11+

### App Won't Start
- Check logs in Render dashboard
- Verify `GEMINI_API_KEY` is set correctly

### CORS Errors
- Ensure Flask-CORS is installed
- Check `app.py` has `CORS(app)`

## Alternative: Serve Frontend with Flask

If you want Flask to serve the frontend (single service), update `backend/app.py`:

```python
from flask import send_from_directory
import os

# Serve frontend
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(os.path.join('../dist', path)):
        return send_from_directory('../dist', path)
    return send_from_directory('../dist', 'index.html')
```

Then your build command becomes:
```
npm install && npm run build && pip install -r backend/requirements.txt
```

## Success! 🎉

Your app should now be live at: `https://your-app-name.onrender.com`

Test it by:
1. Uploading a dataset
2. Training a model
3. Viewing results
4. Using AI explanations
