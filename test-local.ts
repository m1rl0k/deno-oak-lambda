import { handler } from "./src/index.ts";

// Create a test event object
const testEvent = {
  message: "Testing Deno Lambda function locally"
};

// Create a mock Lambda context
const context = {
  awsRequestId: "test-request-id",
  functionName: "test-function",
  invokedFunctionArn: "test-arn",
  logGroupName: "test-log-group",
  logStreamName: "test-log-stream",
  memoryLimitInMB: "128"
};

console.log("Testing handler...");
console.log("Input event:", JSON.stringify(testEvent, null, 2));

// Invoke the handler and get the result
const result = await handler(testEvent, context);
console.log("\nResult:", JSON.stringify(result, null, 2));