// Direct handler for SAM local testing
import { handler } from "./index.js";

async function handleLambdaEvent() {
  const runtimeApi = Deno.env.get("AWS_LAMBDA_RUNTIME_API");
  if (!runtimeApi) {
    throw new Error("AWS_LAMBDA_RUNTIME_API not set");
  }

  while (true) {
    try {
      // Get next event
      const response = await fetch(`http://${runtimeApi}/2018-06-01/runtime/invocation/next`);
      const requestId = response.headers.get("Lambda-Runtime-Aws-Request-Id");
      const event = await response.json();

      // Create context
      const context = {
        awsRequestId: requestId,
        functionName: Deno.env.get("AWS_LAMBDA_FUNCTION_NAME") || "local-function",
        invokedFunctionArn: "local-function-arn",
        logGroupName: "local-log-group",
        logStreamName: "local-log-stream",
        memoryLimitInMB: "128"
      };

      try {
        // Process the event
        const result = await handler(event, context);

        // Send the response
        await fetch(
          `http://${runtimeApi}/2018-06-01/runtime/invocation/${requestId}/response`,
          {
            method: "POST",
            body: JSON.stringify(result)
          }
        );
      } catch (error) {
        // Send the error
        await fetch(
          `http://${runtimeApi}/2018-06-01/runtime/invocation/${requestId}/error`,
          {
            method: "POST",
            body: JSON.stringify({
              errorMessage: String(error),
              errorType: error.name || "Error"
            })
          }
        );
      }
    } catch (error) {
      console.error("Runtime error:", error);
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

handleLambdaEvent();