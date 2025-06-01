#!/bin/bash
# filepath: /Users/admin/Desktop/Leakdetection/setup.sh

# Make script executable
chmod +x setup.sh

# Install dependencies
echo "Installing dependencies..."
npm install

# Set up environment variables
echo "Setting up environment variables..."
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp .env.example .env
  echo "Please update the .env file with your credentials."
fi

# Start the server
echo "Starting the server..."
npm start
