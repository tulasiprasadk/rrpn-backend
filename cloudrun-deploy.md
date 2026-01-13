# Deploying to Google Cloud Run

## Prerequisites
- Google Cloud account
- gcloud CLI installed and authenticated
- Project and billing enabled

## Steps

1. **Build Docker image**
   ```sh
   docker build -t gcr.io/PROJECT_ID/rrnagar-backend .
   ```
2. **Push to Google Container Registry**
   ```sh
   docker push gcr.io/PROJECT_ID/rrnagar-backend
   ```
3. **Deploy to Cloud Run**
   ```sh
   gcloud run deploy rrnagar-backend \
     --image gcr.io/PROJECT_ID/rrnagar-backend \
     --platform managed \
     --region REGION \
     --allow-unauthenticated
   ```

## Environment Variables
- Set required environment variables using `--set-env-vars` or via Cloud Console.

## Notes
- Update port in Dockerfile if your app uses a different port.
- Remove Vercel-specific files/configs if not needed.
