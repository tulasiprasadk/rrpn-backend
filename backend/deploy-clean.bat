@echo off
REM Safe deploy-clean: requires ALLOW_PROD_DEPLOY=true to proceed

IF /I "%ALLOW_PROD_DEPLOY%" NEQ "true" (
	echo.
	echo *********************************************************
	echo * PRODUCTION DEPLOY GUARD: ALLOW_PROD_DEPLOY is not true *
	echo * To proceed, set the environment variable ALLOW_PROD_DEPLOY=true *
	echo * Example (PowerShell): $env:ALLOW_PROD_DEPLOY='true'       *
	echo *********************************************************
	echo.
	pause
	exit /b 1
)

REM Clean build, push, and deploy for rrnagar-backend on Windows

REM Remove node_modules and dist if they exist
IF EXIST node_modules rmdir /s /q node_modules
IF EXIST dist rmdir /s /q dist

REM Build Docker image without cache
docker build --no-cache -t rrnagar-backend:latest .

REM Tag image for Artifact Registry
docker tag rrnagar-backend:latest asia-south1-docker.pkg.dev/rr-nagar-481003/rrw-backend/rrnagar-backend:latest

REM Push image to Artifact Registry
docker push asia-south1-docker.pkg.dev/rr-nagar-481003/rrw-backend/rrnagar-backend:latest

REM Deploy to Cloud Run
gcloud run deploy rrnagar-backend --image asia-south1-docker.pkg.dev/rr-nagar-481003/rrw-backend/rrnagar-backend:latest --platform managed --region asia-south1 --allow-unauthenticated
