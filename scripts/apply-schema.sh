#!/bin/bash
# filepath: /Users/admin/Desktop/Leakdetection/scripts/apply-schema.sh

# Make sure we're in the project root directory
cd "$(dirname "$0")/.."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create it first."
  echo "You can copy .env.example to .env and fill in your credentials."
  exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install it first."
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Run the schema application script
echo "Applying database schema to Supabase..."
node scripts/apply-schema.js

echo "Done!"
