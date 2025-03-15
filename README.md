# deno-zip

This example shows how to deploy a Deno app on Lambda with SnapStart enabled.

The Deno app is compiled to a single binary using `deno compile`, packaged into Zip file and deployed to Lambda with Web Adapter.

We use `java11` runtime to get SnapStart support with one caveat: no runtime hooks.

```yaml
  DenoFunction:
    Type: AWS::Serverless::Function 
    Properties:
      CodeUri: src
      Handler: app
      Runtime: java11
      AutoPublishAlias: live
      SnapStart:
        ApplyOn: PublishedVersions
      Architectures:
        - x86_64
      Layers:
        - !Sub arn:aws:lambda:${AWS::Region}:753240598075:layer:LambdaAdapterLayerX86:24
      MemorySize: 512
      Environment:
        Variables:
          AWS_LAMBDA_EXEC_WRAPPER: /opt/bootstrap
          DENO_DIR: /tmp
          PORT: 8000
      Events:
        HelloWorld:
          Type: HttpApi
    Metadata:
      BuildMethod: makefile
```

## Prerequisites

- [Deno](https://deno.land/manual/getting_started/installation) installed
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) installed
- AWS credentials configured

## Local Development and Testing

### Running the Deno Application Locally

1. Navigate to the `src` directory:
   ```shell
   cd src
   ```

2. Run the Deno application:
   ```shell
   deno run --allow-net --allow-env main.ts
   ```

3. The application will start on port 8000 (or the port specified in the `PORT` environment variable).

### Testing the API Endpoints

You can test the API endpoints using curl:

#### GET Request
```shell
curl http://localhost:8000/
```
Expected response:
```json
{"success":true,"message":"Hello World"}
```

#### POST Request
```shell
curl -X POST -H "Content-Type: application/json" -d '{"name":"Test Item","description":"This is a test item"}' http://localhost:8000/items
```
Expected response:
```json
{"success":true,"message":"Item created","item":{"name":"Test Item","description":"This is a test item"}}
```

#### PUT Request
```shell
curl -X PUT -H "Content-Type: application/json" -d '{"name":"Updated Item","description":"This item has been updated"}' http://localhost:8000/items/123
```
Expected response:
```json
{"success":true,"message":"Item 123 updated","item":{"id":"123","name":"Updated Item","description":"This item has been updated","updatedAt":"..."}}
```

#### DELETE Request
```shell
curl -X DELETE http://localhost:8000/items/123
```
Expected response:
```json
{"success":true,"message":"Item 123 deleted"}
```

### Testing with AWS SAM Local

You can use AWS SAM CLI to test the Lambda function locally before deploying to AWS:

1. Build the application:
   ```shell
   sam build
   ```

2. Invoke the Lambda function locally with a test event:
   ```shell
   sam local invoke DenoFunction -e events/get-root.json
   ```

3. Start a local API Gateway to test HTTP endpoints:
   ```shell
   sam local start-api --port 3000
   ```
   Then access the API at http://localhost:3000/

### Testing on ARM64 Architecture

If you're developing on an ARM-based machine (e.g., M1/M2/M3 Mac), you'll need to make the following adjustments:

1. Update the template.yaml file to use ARM64 architecture and the corresponding Lambda layer:
   ```yaml
   Architectures:
     - arm64
   Layers:
     - !Sub arn:aws:lambda:${AWS::Region}:753240598075:layer:LambdaAdapterLayerArm64:23
   ```

2. Update the Makefile in the src directory to compile for the correct architecture:
   ```makefile
   build-DenoFunction:
     deno compile --allow-net --allow-env --target aarch64-unknown-linux-gnu -o $(ARTIFACTS_DIR)/app main.ts
   ```

3. Build and start the local API Gateway:
   ```shell
   sam build
   sam local start-api --port 3000
   ```

4. Test the endpoints using curl:
   ```shell
   # Test root endpoint
   curl http://localhost:3000/
   
   # Test categories endpoint
   curl http://localhost:3000/categories/1/items
   
   # Test item detail endpoint
   curl http://localhost:3000/categories/1/items/42
   
   # Test POST endpoint
   curl -X POST -H "Content-Type: application/json" -d '{"name":"test item"}' http://localhost:3000/items
   ```

### Troubleshooting SAM Local Testing

- **Port Already in Use**: If port 3000 is already in use, you can either specify a different port or kill the process:
  ```shell
  # Find and kill the process using port 3000
  lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
  
  # Or use a different port
  sam local start-api --port 3001
  ```

- **Architecture Mismatch**: If you see errors like "cannot execute binary file" or "Exec format error", ensure your architecture settings match your development machine.

- **Lambda Container Errors**: If you see init errors in the Lambda container, check the SAM CLI output for detailed error messages.

### Using Test Event JSON Files

The `events` directory contains sample event JSON files for testing with SAM local:

- `get-root.json`: Simulates a GET request to the root endpoint
- `post-item.json`: Simulates a POST request to create a new item
- `put-item.json`: Simulates a PUT request to update an existing item

## Build and Deploy to AWS

Make sure Deno is already installed. Run the following commands on a x86_64 machine:

```shell
sam build 
sam deploy -g
```

After deployment, you'll receive an API Gateway endpoint URL where your Deno application is accessible.

## Troubleshooting

### Common Issues

1. **Request Body Parsing Issues**: This example uses Oak v17.1.4, which handles request bodies differently than older versions:
   ```typescript
   // For Oak v17.x (current version)
   const body = await ctx.request.body({ type: "json" }).value;
   ```

2. **Port Already in Use**: If you get an "Address already in use" error, kill the process using the port:
   ```shell
   lsof -i :8000 | grep deno | awk '{print $2}' | xargs kill -9
   ```

3. **Lambda Layer Issues**: If you encounter issues with the Lambda Adapter Layer when testing locally, try running the Deno application directly instead of using `sam local invoke`.
