# Resume PDF Generation Server

A Node.js server for generating PDF resumes using Puppeteer with Docker support.

## 🐳 Docker Setup

### Prerequisites
- Docker
- Docker Compose

### Quick Start

#### Development Mode (with live reload)
```bash
# Start development server with volume mounting
make dev

# Or using docker-compose directly
docker-compose --profile dev up --build
```

#### Production Mode
```bash
# Start production server
make prod

# Or using docker-compose directly
docker-compose --profile prod up --build -d
```

### Available Commands

```bash
# Show all available commands
make help

# Build images
make build-dev    # Development image
make build-prod   # Production image

# Manage containers
make clean        # Clean up Docker resources
make stop         # Stop all containers
make logs         # Show server logs
make health       # Check server health
```

## 🚀 Local Development (without Docker)

### Prerequisites
- Node.js 24.3.0

### Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Or for production
npm run build && npm start
```

## 📋 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### PDF Generation
- `POST /api/generate-pdf` - Generate PDF for resume type
- `GET /api/resume-types` - List available resume types
- `GET /api/download-pdf` - Download generated PDF

### Documentation
- `GET /api-docs` - Interactive API documentation (Swagger UI)

## 🔧 Configuration

### Environment Variables
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `BASE_URL` - Base URL for PDF generation
- `ALLOWED_ORIGINS` - CORS allowed origins

### PDF Generation Settings
- `PDF_WIDTH` - PDF page width (default: 8.5in)
- `PDF_HEIGHT` - PDF page height (default: auto)
- `PDF_PRINT_BACKGROUND` - Include backgrounds (default: true)
- `PDF_MARGIN_*` - Page margins
- `PDF_SCALE` - Content scale factor (default: 1.0)

## 📁 Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── types/           # TypeScript types
│   └── docs/            # OpenAPI documentation
├── Dockerfile           # Production Docker image
├── Dockerfile.dev       # Development Docker image
└── .dockerignore        # Docker build exclusions
```

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Generate PDF
```bash
curl -X POST http://localhost:3000/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"resumeType": "staff_platform_engineer"}'
```

### List Resume Types
```bash
curl http://localhost:3000/api/resume-types
```

## 🔍 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000

   # Kill the process or change port in docker-compose.yml
   ```

2. **Puppeteer issues in Docker**
   - The Dockerfile includes all necessary Chromium dependencies
   - Ensure you're using the provided Docker images

3. **Volume mounting issues**
   - Ensure Docker has permission to access the project directory
   - Check that the paths in docker-compose.yml are correct

### Logs
```bash
# View server logs
make logs

# Or directly
docker-compose logs -f
```

## 📊 Monitoring

### Health Check
The server includes a health check endpoint that monitors:
- Server status
- PDF generator service status
- Timestamp of last check

### Docker Health Check
The Docker image includes a health check that runs every 30 seconds.

## 🔒 Security

- CORS is configured for development and production
- File download paths are validated to prevent directory traversal
- Environment variables control sensitive settings
- Production builds exclude development dependencies

## 📈 Performance

- PDF generation is optimized for single-page output
- Puppeteer is configured for headless operation
- File caching is implemented for generated PDFs
- Alpine Linux base image for smaller container size
