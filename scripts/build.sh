#!/bin/bash
set -e

# Create build directory
echo "Creating build directory..."
mkdir -p build

# Download Deno binary for Amazon Linux 2
echo "Downloading Deno binary for Lambda (v2.1.10)..."
curl -fsSL https://github.com/denoland/deno/releases/download/v2.1.10/deno-x86_64-unknown-linux-gnu.zip -o deno.zip
unzip -o deno.zip -d build
rm deno.zip

# Create bootstrap file for Lambda and SAM local
echo "Creating bootstrap file..."
cat > build/bootstrap << 'EOF'
#!/bin/bash
set -e

# Check if we're in a read-only filesystem (SAM or Lambda)
TASK_ROOT=${LAMBDA_TASK_ROOT:-/var/task}
if [ -w ${TASK_ROOT} ]; then
  chmod 755 ${TASK_ROOT}/deno
fi

# Set environment variables
export DENO_DIR=/tmp/deno_dir
export PATH=${TASK_ROOT}:$PATH

# For SAM local testing, Lambda runtime API is at host.docker.internal:3001
# In Lambda, AWS sets this environment variable
if [ -z "${AWS_LAMBDA_RUNTIME_API}" ]; then
  echo "No AWS_LAMBDA_RUNTIME_API found, assuming SAM local environment"
  export AWS_LAMBDA_RUNTIME_API="host.docker.internal:3001"
fi

# Execute the handler
exec ${TASK_ROOT}/deno run \
  --allow-env \
  --allow-net \
  --allow-read \
  --allow-write=/tmp \
  --no-check \
  ${TASK_ROOT}/direct-handler.js
EOF

# Make bootstrap executable
chmod +x build/bootstrap

# Copy the TypeScript files to the build directory
echo "Copying TypeScript files..."
cp -r src build/
cp direct-handler.js build/
cp test-local.ts build/

# For Deno 2.x, we don't use bundle anymore
echo "Preparing handler for Deno 2.1.10..."
# Create a simple JavaScript file that imports and re-exports the handler
cat > build/index.js << 'EOF'
import { handler } from "./src/index.ts";
export { handler };
EOF

echo "Build complete!"