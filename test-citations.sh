#!/bin/bash

# Make sure Node.js environment is set to development
export NODE_ENV=development

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Run the standalone test script with ts-node
npx ts-node src/trigger/test-extract-citations.ts 