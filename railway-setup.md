# Railway Deployment Setup Guide

## Step 1: Get Your Railway URLs

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Find your backend service and copy its URL (e.g., `https://your-backend-name.railway.app`)
3. Find your frontend service and copy its URL (e.g., `https://your-frontend-name.railway.app`)

## Step 2: Configure Backend Environment Variables

In your **Backend** service on Railway:

1. Go to the "Variables" tab
2. Add these environment variables:
   ```
   FRONTEND_URL=https://shopify-insights-frontend-production.up.railway.app
   NODE_ENV=production
   ```

## Step 3: Configure Frontend Environment Variables

In your **Frontend** service on Railway:

1. Go to the "Variables" tab
2. Add this environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://ingest-api-production.up.railway.app/api
   ```

## Step 4: Update Backend CORS Configuration

✅ **COMPLETED** - The backend CORS configuration has been updated with your frontend URL: `https://shopify-insights-frontend-production.up.railway.app`

## Step 5: Redeploy Both Services

After setting the environment variables:

1. **Backend**: Railway will automatically redeploy when you add environment variables
2. **Frontend**: Railway will automatically redeploy when you add environment variables

## Step 6: Test the Connection

1. Visit your frontend URL
2. Try to log in or access any API endpoint
3. Check the browser's Network tab to see if API calls are successful
4. Check Railway logs for both services to ensure they're communicating

## Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your frontend URL is correctly added to the backend CORS configuration
2. **404 Errors**: Ensure the API URL includes `/api` at the end
3. **Connection Refused**: Check that both services are running and accessible
4. **Environment Variables**: Make sure all environment variables are set correctly

### Check Logs:

- Backend logs: Railway Dashboard → Backend Service → Deployments → View Logs
- Frontend logs: Railway Dashboard → Frontend Service → Deployments → View Logs

## Your Actual URLs:

- Backend: `https://ingest-api-production.up.railway.app`
- Frontend: `https://shopify-insights-frontend-production.up.railway.app`
- API URL: `https://ingest-api-production.up.railway.app/api`
