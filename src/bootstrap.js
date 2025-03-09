// AWS Lambda runtime interface client for Deno
import { handler } from "./index.ts";

const runtimeApi = Deno.env.get("AWS_LAMBDA_RUNTIME_API");
if (!runtimeApi) {
  console.error("Error: This script is meant to run in an AWS Lambda environment");
  Deno.exit(1);
}

async function processEvents() {
  while (true) {
    try {
      // Get next event
      const res = await fetch(`http://${runtimeApi}/2018-06-01/runtime/invocation/next`);
      const requestId = res.headers.get("Lambda-Runtime-Aws-Request-Id");
      
      if (!requestId) {
        console.error("Error: No request ID in Lambda runtime API response");
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      const event = await res.json();
      
      // Create context
      const context = {
        awsRequestId: requestId,
        functionName: Deno.env.get("AWS_LAMBDA_FUNCTION_NAME"),
        invokedFunctionArn: Deno.env.get("AWS_LAMBDA_FUNCTION_ARN"),
        logGroupName: Deno.env.get("AWS_LAMBDA_LOG_GROUP_NAME"),
        logStreamName: Deno.env.get("AWS_LAMBDA_LOG_STREAM_NAME"),
        memoryLimitInMB: Deno.env.get("AWS_LAMBDA_FUNCTION_MEMORY_SIZE")
      };
      
      try {
        // Process the event
        const result = await handler(event, context);
        
        // Return the response
        await fetch(
          `http://${runtimeApi}/2018-06-01/runtime/invocation/${requestId}/response`,
          {
            method: "POST",
            body: JSON.stringify(result)
          }
        );
      } catch (error) {
        console.error("Handler error:", error);
        
        // Report the error
        await fetch(
          `http://${runtimeApi}/2018-06-01/runtime/invocation/${requestId}/error`,
          {
            method: "POST",
            body: JSON.stringify({
              errorMessage: error.message,
              errorType: error.name,
              stackTrace: error.stack?.split("\n")
            })
          }
        );
      }
    } catch (error) {
      console.error("Runtime error:", error);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Start processing events
processEvents();