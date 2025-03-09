#!/bin/bash
# First, make sure you've run the build script
./scripts/build.sh

# Create a test event file
cat > event.json << EOF
{
  "message": "This is a local test"
}
EOF

# Invoke the function locally with SAM
sam local invoke DenoFunction --event event.json

# You can also start a local API if you add API Gateway to your template
# sam local start-api
