# 🐳 Frame Dock - Docker Management Dashboard

A modern, lightweight Docker container management dashboard with automated scheduling capabilities.

## 🚀 Quick Start (TL;DR)

```bash
# Pull and run from Docker Hub
docker compose -f docker-compose.frame-dock.yml up -d

# Access at: http://localhost:8765
# Login: admin / admin123
```

> 📦 **Docker Hub**: [`surajadev/frame-dock`](https://hub.docker.com/r/surajadev/frame-dock)




## ✨ Features

- 🐳 **Container Management**: Full CRUD operations for Docker containers
- 📅 **Automated Scheduling**: Schedule container actions (start/stop/restart) with flexible time expressions
- 🖼️ **Image Management**: View, delete, and prune Docker images
- 📊 **Resource Monitoring**: Track CPU, memory, and network usage
- ⚙️ **Settings**: User management and application configuration
- 🎨 **Modern UI**: Beautiful dark theme with responsive design

## 🏗️ Architecture

### 🐍 Backend (FastAPI + Python)
- **Framework**: FastAPI ⚡
- **Database**: SQLite 💾
- **Docker Integration**: Docker SDK for Python 🐋
- **Scheduling**: APScheduler ⏰

### ⚛️ Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript 💙
- **Build Tool**: Vite ⚡
- **Styling**: Tailwind CSS 🎨
- **Icons**: Lucide React 🎯
- **HTTP Client**: Axios 🌐

## 🚀 Quick Start

### 📋 Prerequisites
- 🐍 Python 3.8+
- 📦 Node.js 18+
- 🐳 Docker installed and running

### 🔧 Backend Setup

1️⃣ Create and activate virtual environment:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

2️⃣ Install dependencies:
```bash
pip install -r requirements.txt
```

3️⃣ Configure environment:
```bash
# Copy .env.example to .env and configure
cp .env.example .env
```

4️⃣ Run the backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend will be available at `http://localhost:8000`  
📚 API documentation at `http://localhost:8000/docs`

> **💡 Note**: When running via Docker, the application will be available at `http://localhost:8765`

### 🎨 Frontend Setup

1️⃣ Navigate to UI folder:
```bash
cd ui
```

2️⃣ Install dependencies:
```bash
npm install
```

3️⃣ Start development server:
```bash
npm run dev
```

✅ Frontend will be available at `http://localhost:3000`

## 🔐 Default Login Credentials

**After starting Frame Dock, login with:**

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | `admin123` |

> ⚠️ **IMPORTANT**: Change the default password immediately after first login via Settings → Change Password

**Access Points:**
- 🌐 **Application**: `http://localhost:8765` (Docker) or `http://localhost:8000` (Local)


## 📖 API Documentation

Full API documentation is available at `/docs` when the backend is running.

🔑 Key endpoints:
- 🐳 `/api/v1/docker/containers` - Container management
- 📅 `/api/v1/schedules` - Schedule management
- 🖼️ `/api/v1/docker/images` - Image management

## 📁 Project Structure

```
frame-dock-py/
├── 🐍 app/                 # Backend application
│   ├── 🛣️ api/            # API routes
│   ├── ⚙️ core/           # Core configuration
│   ├── 💾 models/         # Database models
│   ├── 📋 schemas/        # Pydantic schemas
│   └── 🔧 services/       # Business logic
├── ⚛️ ui/                 # Frontend application
│   └── src/
│       ├── 🧩 components/ # React components
│       ├── 📄 pages/      # Page components
│       ├── 🌐 api.ts      # API client
│       └── 📝 types.ts    # TypeScript types
├── 📦 requirements.txt    # Python dependencies
└── 📖 README.md          # This file
```

## 💻 Development

### 🐳 Docker Deployment (Recommended)

Frame Dock is available as a pre-built Docker image on Docker Hub for easy deployment.

#### 🚀 Option 1: Docker Hub (Production - Fastest)

**Pull and run the latest image:**

```bash
# Pull the image
docker pull surajadev/frame-dock:latest

# Run with Docker
docker run -d \
  --name frame-dock \
  -p 8765:8000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v ./data:/app/data \
  -e SECRET_KEY=your-secret-key-here \
  -e TZ=Asia/Colombo \
  --restart unless-stopped \
  surajadev/frame-dock:latest
```

**Or use Docker Compose (Recommended):**

```bash
# Use the Frame Dock compose file
docker compose -f docker-compose.frame-dock.yml up -d
```

**Configuration:**
1. Copy `.env.example` to `.env`
2. Update the `SECRET_KEY` in `.env` (important for production!)
3. Run: `docker compose -f docker-compose.frame-dock.yml up -d`

#### 🔧 Option 2: Build Locally (Development)

**Build and run from source:**

```bash
# Build the image
docker build -t frame-dock:latest .

# Run with docker-compose
docker compose up -d
```

This option builds the image locally, which is useful for development or customization.

## 🎯 Features in Detail

### 🐳 Container Management
- ✅ Create containers with custom configuration (ports, environment variables, volumes)
- ▶️ Start, stop, restart, and delete containers
- 📊 View real-time container stats
- 🔍 Filter and search containers

### 📅 Scheduling
- 🌅 **Daily**: Run actions at specific times (e.g., "22:30")
- 📆 **Weekly**: Run actions on specific days (e.g., "mon 08:00")
- 📌 **Monthly**: Run actions on specific dates (e.g., "1 00:00")
- ⏱️ **Custom**: One-time execution at specific datetime

### 🖼️ Image Management
- 👀 View all local Docker images
- 🗑️ Delete individual images
- 🧹 Prune unused images to free up space

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details
