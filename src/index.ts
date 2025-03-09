// Simple Deno Lambda handler
import { Application, Router, Context, isHttpError, Status } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

interface LambdaContext {
  awsRequestId: string;
  functionName: string;
  invokedFunctionArn: string;
  logGroupName: string;
  logStreamName: string;
  memoryLimitInMB: string;
}

// Create Oak application and router
const app = new Application();
const router = new Router();

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (isHttpError(err)) {
      ctx.response.status = err.status;
      ctx.response.body = {
        status: err.status,
        message: err.message,
        timestamp: new Date().toISOString()
      };
    } else {
      ctx.response.status = Status.InternalServerError;
      ctx.response.body = {
        status: Status.InternalServerError,
        message: "Internal server error",
        timestamp: new Date().toISOString()
      };
    }
    // Log error
    console.error(`[ERROR] ${err.message}`);
  }
});

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
});

// CORS middleware
app.use(oakCors({
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Define routes
router.get("/", (ctx) => {
  ctx.response.body = {
    message: "Hello from Oak on Lambda!",
    timestamp: new Date().toISOString()
  };
});

router.post("/echo", async (ctx) => {
  const body = await ctx.request.body().value;
  ctx.response.body = {
    message: "Echo endpoint",
    received: body,
    timestamp: new Date().toISOString()
  };
});

// Basic health check
router.get("/health", (ctx) => {
  ctx.response.body = {
    status: "healthy",
    timestamp: new Date().toISOString()
  };
});

// Example REST API endpoints
interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

const todos = new Map<string, Todo>();

// List todos
router.get("/todos", (ctx) => {
  ctx.response.body = {
    data: Array.from(todos.values()),
    timestamp: new Date().toISOString()
  };
});

// Get single todo
router.get("/todos/:id", (ctx) => {
  const todo = todos.get(ctx.params.id);
  if (!todo) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = {
      error: "Todo not found",
      timestamp: new Date().toISOString()
    };
    return;
  }
  ctx.response.body = {
    data: todo,
    timestamp: new Date().toISOString()
  };
});

// Create todo
router.post("/todos", async (ctx) => {
  const body = await ctx.request.body().value;
  const id = crypto.randomUUID();
  const todo: Todo = {
    id,
    title: body.title,
    completed: false
  };
  todos.set(id, todo);
  ctx.response.status = Status.Created;
  ctx.response.body = {
    data: todo,
    timestamp: new Date().toISOString()
  };
});

// Update todo
router.patch("/todos/:id", async (ctx) => {
  const todo = todos.get(ctx.params.id);
  if (!todo) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = {
      error: "Todo not found",
      timestamp: new Date().toISOString()
    };
    return;
  }
  const body = await ctx.request.body().value;
  const updated = {
    ...todo,
    ...body
  };
  todos.set(ctx.params.id, updated);
  ctx.response.body = {
    data: updated,
    timestamp: new Date().toISOString()
  };
});

// Delete todo
router.delete("/todos/:id", (ctx) => {
  if (!todos.has(ctx.params.id)) {
    ctx.response.status = Status.NotFound;
    ctx.response.body = {
      error: "Todo not found",
      timestamp: new Date().toISOString()
    };
    return;
  }
  todos.delete(ctx.params.id);
  ctx.response.status = Status.NoContent;
});

// File upload example
router.post("/upload", async (ctx) => {
  const body = ctx.request.body({ type: "form-data" });
  const formData = await body.value.read();
  const file = formData.files?.[0];
  
  if (!file) {
    ctx.response.status = Status.BadRequest;
    ctx.response.body = {
      error: "No file uploaded",
      timestamp: new Date().toISOString()
    };
    return;
  }

  ctx.response.body = {
    message: "File received",
    filename: file.filename,
    contentType: file.contentType,
    timestamp: new Date().toISOString()
  };
});

// Add router middleware
app.use(router.routes());
app.use(router.allowedMethods());

// Lambda handler function
export async function handler(event: any, context?: LambdaContext): Promise<any> {
  // Convert API Gateway event to Oak request
  const request = new Request(`https://${event.requestContext?.domainName || 'localhost'}${event.rawPath}${event.rawQueryString ? '?' + event.rawQueryString : ''}`, {
    method: event.requestContext?.http?.method || 'GET',
    headers: event.headers || {},
    body: event.body ? event.isBase64Encoded 
      ? atob(event.body)
      : event.body
      : null
  });

  // Handle the request with Oak
  const response = await app.handle(request);
  if (!response) {
    throw new Error('No response from Oak application');
  }

  // Convert Oak response to API Gateway format
  const responseBody = await response.text();
  
  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body: responseBody,
    isBase64Encoded: false
  };
}