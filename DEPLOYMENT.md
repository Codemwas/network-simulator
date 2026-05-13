# Deployment Guide for Network Simulator

This guide outlines the steps to deploy the Network Simulator application to a web server.

## Prerequisites

- Node.js (v18 or later)
- MySQL (v5.7 or later)
- Git
- A server (VPS, cloud instance, etc.) with root access

## Overview

The application consists of two parts:
1. **Backend**: Node.js/Express API with MySQL database
2. **Frontend**: React/Vite application

In production, you can choose to:
- Deploy both together on the same server (Node.js serving the static React build and the API)
- Deploy the frontend to a static host (Netlify, Vercel, etc.) and the API to a separate Node.js host

We recommend option 1 for simplicity, especially if you are new to deployment.

## Step 1: Set up the MySQL Database

1. Install MySQL if not already installed:
   ```bash
   # On Ubuntu/Debian
   sudo apt update
   sudo apt install mysql-server

   # On CentOS/RHEL
   sudo yum install mysql-server
   ```

2. Start and secure MySQL:
   ```bash
   sudo systemctl start mysql
   sudo systemctl enable mysql
   sudo mysql_secure_installation
   ```

3. Create the database and user:
   ```sql
   CREATE DATABASE network_sim_db;
   CREATE USER 'sim_user'@'localhost' IDENTIFIED BY 'Mwashi1';
   GRANT ALL PRIVILEGES ON network_sim_db.* TO 'sim_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. Import the schema and initial data:
   ```bash
   mysql -u sim_user -pMwashi1 network_sim_db < api/schema.sql
   mysql -u sim_user -pMwashi1 network_sim_db < api/seed-connections.sql
   mysql -u sim_user -pMwashi1 network_sim_db < api/seed-data.sql
   ```

   > Note: If the seed files don't exist, you can create them from the existing data or skip this step. The application will work with an empty database, but some features may show no data until data is added via the simulator.

## Step 2: Configure the Backend

1. Clone the repository to your server:
   ```bash
   git clone <repository-url>
   cd network-simulator
   ```

2. Install backend dependencies:
   ```bash
   cd api
   npm install
   ```

3. Create a `.env` file in the `api` directory (copy from the example or create new):
   ```bash
   cp .env.example .env   # If .env.example exists
   # Or create manually:
   cat > .env <<EOF
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=sim_user
   DB_PASSWORD=Mwashi1
   DB_NAME=network_sim_db
   PORT=3000
   EOF
   ```

   > Important: In production, consider using a stronger password and possibly a remote database host.

4. Test the backend:
   ```bash
   node server.js
   ```
   You should see: `API server listening on http://localhost:3000`
   Test with: `curl http://localhost:3000/api/metrics`

   Press `Ctrl+C` to stop the test.

## Step 3: Build the Frontend

1. Install frontend dependencies (if not already installed):
   ```bash
   cd ..
   npm install
   ```

2. Build the frontend for production:
   ```bash
   npm run build
   ```
   This will create a `dist` directory containing the static files.

## Step 4: Deploy (Option 1: Same Server)

This option serves both the frontend and backend from the same Node.js server.

1. Install `serve` or use Express to serve static files:
   ```bash
   npm install serve
   ```

2. Create a production startup script (e.g., `start-prod.sh`):
   ```bash
   cat > start-prod.sh <<EOF
   #!/bin/bash
   # Start the Network Simulator in production

   cd "$(dirname "$0")"

   # Start API server in background
   echo "Starting API server..."
   node api/server.js > /tmp/api.log 2>&1 &
   API_PID=$!

   # Wait for API to be ready
   sleep 3

   # Serve the frontend build with the API
   echo "Serving frontend build..."
   npx serve -s dist -l 3000 > /tmp/frontend.log 2>&1 &
   FRONTEND_PID=$!

   echo "Network Simulator is running!"
   echo "  API:          http://localhost:3000"
   echo "  Frontend:     http://localhost:3000"
   echo "  Access the app at: http://localhost:3000"

   # Save PIDs for stopping
   echo "$API_PID" > /tmp/api.pid
   echo "$FRONTEND_PID" > /tmp/frontend.pid
   EOF
   chmod +x start-prod.sh
   ```

3. Start the application:
   ```bash
   ./start-prod.sh
   ```

4. To stop:
   ```bash
   kill $(cat /tmp/api.pid) $(cat /tmp/frontend.pid)
   rm -f /tmp/api.pid /tmp/frontend.pid
   ```

## Step 5: Deploy (Option 2: Separate Hosts)

### Frontend Deployment (e.g., to Netlify or Vercel)

1. Set the environment variable for the API URL:
   - In Netlify: Site Settings > Build & Deploy > Environment
   - In Vercel: Project Settings > Environment Variables
   - Add: `VITE_API_BASE=https://your-api-domain.com`

2. Build and deploy:
   ```bash
   npm run build
   ```
   Then deploy the `dist` directory to your static host.

### Backend Deployment (e.g., to Heroku, AWS EC2, etc.)

1. Ensure the `api` directory contains:
   - `server.js`
   - `db.js`
   - `package.json`
   - `.env` (with production database credentials)

2. For Heroku:
   - Create a `Procfile`: `web: node server.js`
   - Deploy via Git

3. For AWS EC2:
   - Follow the same steps as in Step 2 above, but on your EC2 instance.

## Step 6: Environment Variables

### Backend (.env in api/)
| Variable | Example | Description |
|----------|---------|-------------|
| DB_HOST | localhost | Database host |
| DB_PORT | 3306 | Database port |
| DB_USER | sim_user | Database user |
| DB_PASSWORD | Mwashi1 | Database password |
| DB_NAME | network_sim_db | Database name |
| PORT | 3000 | Server port |

### Frontend (.env in project root)
| Variable | Example | Description |
|----------|---------|-------------|
| VITE_API_BASE | /api | Base URL for API requests (use full URL if frontend and backend are on different domains) |

> Note: If deploying frontend and backend on the same origin (same domain and port), `VITE_API_BASE` can be `/api` (or even omitted, defaulting to `/api`). If on different origins (e.g., frontend on `https://app.example.com` and backend on `https://api.example.com`), set `VITE_API_BASE` to `https://api.example.com`.

## Step 7: HTTPS (Recommended for Production)

To serve your application over HTTPS, consider using:
- A reverse proxy like Nginx or Caddy in front of your Node.js server
- Or use a platform that provides HTTPS automatically (like Heroku, Vercel, Netlify with custom domain)

### Example Nginx Configuration (for same-server deployment)

```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        root /path/to/network-simulator/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then obtain an SSL certificate via Let's Encrypt:
```bash
sudo certbot --nginx -d your_domain.com
```

## Step 8: Maintenance

- To view logs: `tail -f /tmp/api.log` and `tail -f /tmp/sim.log`
- To monitor CPU/memory: `htop` or `top`
- To restart: Use the stop script then start script, or reboot the server

## Troubleshooting

- **API not responding**: Check if the API server is running (`ps aux | grep node.*server`) and if port 3000 is listening (`ss -tlnp | grep 3000`). Check `/tmp/api.log` for errors.
- **Frontend not loading**: Check if the Vite dev server is running (for development) or if the static files are being served correctly (for production). Check browser console for errors.
- **Database connection errors**: Verify the `.env` file in the `api` directory has correct credentials and that the MySQL server is accessible.

## Notes

- The simulator (`api/simulator.js`) updates the database every 5 seconds to provide changing data for the dashboard. It is essential for the live monitoring features.
- In production, consider setting up a process manager like PM2 to keep the API and simulator running indefinitely.
- Always keep your dependencies up to date: `npm update` in both the root and `api` directories.

## Support

If you encounter issues, please check the logs and ensure all prerequisites are met. For further assistance, refer to the project's issue tracker.