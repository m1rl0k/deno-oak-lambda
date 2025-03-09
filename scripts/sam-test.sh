#!/bin/bash
# Script to test the Lambda function locally with SAM

# First, make sure you've run the build script
if [ ! -f "build/deno" ]; then
  echo "Build directory not found or incomplete. Running build script..."
  ./scripts/build.sh
fi

# Create a test event file if it doesn't exist
if [ ! -f "event.json" ]; then
  cat > event.json << EOF
{
  "message": "Testing with SAM local"
}
EOF
  echo "Created test event file: event.json"
fi

# Invoke the function locally with SAM
echo "Invoking function with SAM local..."
sam local invoke DenoFunction --event event.json