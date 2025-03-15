import { Application, Router } from "https://deno.land/x/oak@v17.1.4/mod.ts";

const app = new Application();
const port = +(Deno.env.get("PORT") || "8000");

// Logger middleware
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url.pathname} - ${ms}ms`);
});

// Create item router for handling specific item operations
const itemRouter = new Router()
  .get("/", (ctx) => {
    ctx.response.body = {
      success: true,
      message: `Listing all items in category: ${ctx.params.categoryId}`,
      category: ctx.params.categoryId,
    };
  })
  .get("/:itemId", (ctx) => {
    ctx.response.body = {
      success: true,
      message: `Item details`,
      category: ctx.params.categoryId,
      item: {
        id: ctx.params.itemId,
        name: `Sample Item ${ctx.params.itemId}`,
        category: ctx.params.categoryId,
      },
    };
  })
  .post("/", async (ctx) => {
    try {
      // Fixed body parsing for Oak v17
      const body = await ctx.request.body.json();
      
      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        message: "Item created",
        category: ctx.params.categoryId,
        item: {
          ...body,
          category: ctx.params.categoryId,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error processing request:", errorMessage);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: errorMessage,
      };
    }
  })
  .put("/:itemId", async (ctx) => {
    try {
      const itemId = ctx.params.itemId;
      
      // Fixed body parsing for Oak v17
      const body = await ctx.request.body.json();
      
      ctx.response.body = {
        success: true,
        message: `Item ${itemId} updated`,
        category: ctx.params.categoryId,
        item: {
          id: itemId,
          ...body,
          category: ctx.params.categoryId,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("Error in PUT /:itemId:", errorMessage);
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: errorMessage,
      };
    }
  })
  .delete("/:itemId", (ctx) => {
    const itemId = ctx.params.itemId;
    
    ctx.response.body = {
      success: true,
      message: `Item ${itemId} deleted`,
      category: ctx.params.categoryId,
    };
  });

// Main router
const mainRouter = new Router()
  .get("/", (ctx) => {
    ctx.response.body = {
      success: true,
      message: "Hello World",
    };
  })
  // Mount the itemRouter under the /categories/:categoryId/items path
  .use(
    "/categories/:categoryId/items",
    itemRouter.routes(),
    itemRouter.allowedMethods()
  )
  // Add simple routes directly to the main router
  .post("/items", async (ctx) => {
    try {
      // Fixed body parsing for Oak v17
      const body = await ctx.request.body.json();
      
      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        message: "Item created (legacy endpoint)",
        item: body,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: errorMessage,
      };
    }
  })
  .put("/items/:id", async (ctx) => {
    try {
      const id = ctx.params.id;
      
      // Fixed body parsing for Oak v17
      const body = await ctx.request.body.json();
      
      ctx.response.body = {
        success: true,
        message: `Item ${id} updated (legacy endpoint)`,
        item: {
          id,
          ...body,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: errorMessage,
      };
    }
  })
  .delete("/items/:id", (ctx) => {
    const id = ctx.params.id;
    
    ctx.response.body = {
      success: true,
      message: `Item ${id} deleted (legacy endpoint)`,
    };
  });

// Use the mainRouter for all routes
app.use(mainRouter.routes());
app.use(mainRouter.allowedMethods());

// Add error handling
app.addEventListener("error", (evt) => {
  console.log("Unhandled error:", evt.error);
});

console.log(`Server running on http://localhost:${port}`);
await app.listen({ port });