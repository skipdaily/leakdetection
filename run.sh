#!/bin/zsh
# filepath: /Users/admin/Desktop/Leakdetection/run.sh

# Make this script executable
chmod +x run.sh

# Colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo "${GREEN}=====================================${NC}"
echo "${GREEN}  Leak Detection Website Launcher    ${NC}"
echo "${GREEN}=====================================${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "${YELLOW}Warning: .env file not found. Creating from example...${NC}"
  cp .env.example .env
  echo "${YELLOW}Please update the .env file with your credentials.${NC}"
fi

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check if npm is installed
if ! command_exists npm; then
  echo "${RED}Error: npm is not installed. Please install Node.js and npm first.${NC}"
  exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "${YELLOW}Installing dependencies...${NC}"
  npm install
  
  if [ $? -ne 0 ]; then
    echo "${RED}Error installing dependencies. Please check the errors above.${NC}"
    exit 1
  fi
fi

# Check if Supabase schema is already applied
echo "${YELLOW}Would you like to apply the Supabase schema? (y/n)${NC}"
read apply_schema

if [[ $apply_schema == "y" || $apply_schema == "Y" ]]; then
  echo "${GREEN}Applying Supabase schema...${NC}"
  ./scripts/apply-schema.sh
  
  if [ $? -ne 0 ]; then
    echo "${RED}Error applying schema. Please check the errors above.${NC}"
    echo "${YELLOW}You can try again later by running ./scripts/apply-schema.sh${NC}"
  fi
fi

# Start the server
echo "${GREEN}Starting the server...${NC}"
echo "${GREEN}Press Ctrl+C to stop the server${NC}"
npm start
