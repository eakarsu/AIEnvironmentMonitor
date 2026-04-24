#!/bin/bash

# AI Environment Monitor - Startup Script
# This script cleans ports, sets up the database, seeds data, and starts the application

set -e

echo "=========================================="
echo "  AI Environment Monitor - Startup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
    echo -e "${RED}✗ .env file not found!${NC}"
    exit 1
fi

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Clean up ports
echo -e "\n${BLUE}[1/6] Cleaning up ports...${NC}"
kill_port 3000
kill_port 3001
echo -e "${GREEN}✓ Ports cleaned${NC}"

# Check if PostgreSQL is running
echo -e "\n${BLUE}[2/6] Checking PostgreSQL...${NC}"
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql 2>/dev/null || \
    pg_ctl -D /usr/local/var/postgres start 2>/dev/null || \
    sudo service postgresql start 2>/dev/null || \
    echo -e "${RED}Please start PostgreSQL manually${NC}"
    sleep 2
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Install dependencies if needed
echo -e "\n${BLUE}[3/6] Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
fi
if [ ! -d "client/node_modules" ]; then
    cd client && npm install && cd ..
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Setup database
echo -e "\n${BLUE}[4/6] Setting up database...${NC}"
npm run db:setup
echo -e "${GREEN}✓ Database setup complete${NC}"

# Seed database
echo -e "\n${BLUE}[5/6] Seeding database...${NC}"
npm run db:seed
echo -e "${GREEN}✓ Database seeded with sample data${NC}"

# Start application with hot reload
echo -e "\n${BLUE}[6/6] Starting application with hot reload...${NC}"
echo -e "${GREEN}=========================================="
echo -e "  Server: http://localhost:3001"
echo -e "  Client: http://localhost:3000"
echo -e "==========================================${NC}"
echo ""

# Unset PORT so React client defaults to 3000 (server falls back to 3001 via its own code)
unset PORT

# Start with concurrently for hot reload
npm run dev
