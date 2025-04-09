#!/bin/bash

# Setup script for Valey Docker development environment

echo "🐳 Setting up Valey development environment using Docker"
echo "======================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "📝 Visit https://docs.docker.com/get-docker/ for installation instructions."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "📝 Visit https://docs.docker.com/compose/install/ for installation instructions."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from example..."
    cp .env.example .env
    echo "✅ Created .env file."
else
    echo "📄 .env file already exists. Skipping..."
fi

# Build Docker images
echo "🏗️ Building Docker images..."
docker-compose build

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Show logs
echo "📊 Showing logs..."
echo "Press Ctrl+C to exit logs (services will continue running)"
echo "======================================================"
docker-compose logs -f

# Note: The script will hang here showing logs until the user presses Ctrl+C
# When the user exits the logs, show next steps
echo "✅ Development environment is now running!"
echo "📝 You can access the application at: http://localhost:9000"
echo ""
echo "📝 Useful commands:"
echo "  - docker-compose up -d    # Start containers in background"
echo "  - docker-compose logs -f  # View logs"
echo "  - docker-compose down     # Stop containers"
echo "  - npm run docker:dev      # Start containers (npm script)"
echo "  - npm run docker:logs     # View logs (npm script)"
echo "  - npm run docker:stop     # Stop containers (npm script)" 