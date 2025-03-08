# Deno Lambda with Oak and SAM Local

A production-ready Oak web server running on AWS Lambda, with local testing support via SAM. This project demonstrates how to run a full-featured Oak web application on Lambda, complete with middleware, REST APIs, and file upload support.

## Features

- **Oak Web Framework** with API Gateway integration
- **Middleware Stack**:
  - Error handling with proper status codes
  - Request logging with timing information
  - CORS support for cross-origin requests
  
- **API Endpoints**:
  - `GET /health` - Health check endpoint
  - `GET /` - Welcome message
  - `POST /echo` - Echo back request body
  
- **Todo API Example**:
  - `GET /todos` - List all todos
  - `GET /todos/:id` - Get a specific todo
  - `POST /todos` - Create a new todo
  - `PATCH /todos/:id` - Update a todo
  - `DELETE /todos/:id` - Delete a todo
  
- **File Handling**:
  - `POST /upload` - File upload endpoint

## Prerequisites

- Deno (v1.40 or later)
- AWS SAM CLI
- Docker

## Quick Start

1. Build the Lambda package:
```bash
./scripts/build.sh
```

2. Test locally with SAM:
```bash
./scripts/sam-test.sh
```

## Testing Different Endpoints

The `events/` directory contains example API Gateway event payloads for testing different endpoints:

```bash
# Build the project first
./scripts/build.sh

# Test health check endpoint
sam local invoke DenoFunction --event events/health.json

# Test creating a todo
sam local invoke DenoFunction --event events/create-todo.json

# Test the echo endpoint
sam local invoke DenoFunction --event events/echo.json

# Or use the convenience script to test with default event
./scripts/sam-test.sh
```

Example responses:

```json
# Health check response
{
  "statusCode": 200,
  "headers": {
    "content-type": "application/json; charset=UTF-8",
    "access-control-allow-origin": "*"
  },
  "body": {
    "status": "healthy",
    "timestamp": "2025-02-28T16:22:55.150Z"
  }
}

# Echo endpoint response
{
  "statusCode": 200,
  "headers": {
    "content-type": "application/json; charset=UTF-8",
    "access-control-allow-origin": "*"
  },
  "body": {
    "message": "Echo endpoint",
    "received": {
      "message": "Hello Oak!",
      "data": {
        "foo": "bar"
      }
    },
    "timestamp": "2025-02-28T16:22:45.994Z"
  }
}
```

## Project Structure

```
.
├── src/               # Source code
│   └── index.ts      # Oak server and Lambda handler
├── events/           # Test event payloads
│   └── create-todo.json
├── scripts/          
│   ├── build.sh      # Builds the Lambda package
│   └── sam-test.sh   # Runs local tests with SAM
├── direct-handler.js  # Lambda runtime handler
└── template.yaml     # SAM template
```

## How It Works

The project uses Oak as a web framework running on a custom Deno runtime:

1. **Request Flow**:
   - API Gateway receives the HTTP request
   - Lambda invokes our Deno function
   - Request is converted to Oak format
   - Oak middleware processes the request
   - Response is converted back to API Gateway format

2. **Local Testing**:
   - SAM Local emulates API Gateway and Lambda
   - Provides the Lambda Runtime API
   - Allows testing with real HTTP requests

## API Routes

After deploying, you can hit the endpoints using these commands (replace `{api_url}` with your API Gateway URL):

```bash
# Health check
curl {api_url}/health

# Welcome message
curl {api_url}/

# Echo endpoint
curl -X POST {api_url}/echo \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Oak!"}'

# Todo API
# List todos
curl {api_url}/todos

# Get single todo
curl {api_url}/todos/{id}

# Create todo
curl -X POST {api_url}/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Oak"}'

# Update todo
curl -X PATCH {api_url}/todos/{id} \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete todo
curl -X DELETE {api_url}/todos/{id}

# File upload
curl -X POST {api_url}/upload \
  -F "file=@./path/to/your/file.txt"
```

For local testing with SAM, use `http://127.0.0.1:3000` as the API URL.

## Example Response

```json
{
  "statusCode": 200,
  "headers": {
    "content-type": "application/json; charset=UTF-8",
    "access-control-allow-origin": "*"
  },
  "body": {
    "message": "Hello from Oak on Lambda!",
    "timestamp": "2025-02-28T15:32:02.405Z"
  }
}
```

## Deployment

The included `template.yaml` can be used to deploy your function to AWS:

```bash
sam deploy --guided
```

This will:
1. Create an API Gateway HTTP API
2. Deploy your Lambda function
3. Set up the necessary IAM roles
4. Provide you with an API endpoint

## Local Development

For quick iterations during development:

1. Make changes to `src/index.ts`
2. Run `./scripts/build.sh && ./scripts/sam-test.sh`
3. Check the output in your terminal

The Oak server includes hot reloading in development mode when running locally.
