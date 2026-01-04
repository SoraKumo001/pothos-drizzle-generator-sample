import "dotenv/config";
import { graphqlServer } from "@hono/graphql-server";
import { serve } from "@hono/node-server";
import { explorer } from "apollo-explorer/html";
import { generate } from "graphql-auto-query";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { getContext } from "hono/context-storage";
import { getCookie } from "hono/cookie";
import { jwtVerify } from "jose";
import { schema } from "./builder.js";
import type { Context } from "./context.js";
import type { relations } from "./db/relations.js";
import type { Context as HonoContext } from "hono";

/**
 * Helper function to retrieve and validate environment variables.
 */
const getEnvVariable = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

// Secret key for JWT verification
const SECRET = getEnvVariable("SECRET");

// Cookie name for authentication token
const AUTH_TOKEN_COOKIE = "auth-token";

// Apollo Explorer introspection interval (10 seconds)
const INTROSPECTION_INTERVAL = 10000;

// Sample query generation depth
const QUERY_GENERATION_DEPTH = 1;

// Server port
const PORT = 3000;

/**
 * Middleware to extract and verify JWT token from cookies
 * Sets the authenticated user in the request context
 */
const authMiddleware = async (
  c: HonoContext<Context>,
  next: () => Promise<void>
) => {
  const cookies = getCookie(c);
  const token = cookies[AUTH_TOKEN_COOKIE] ?? "";

  /**
   * Verify JWT token and extract user information
   * If verification fails (invalid/expired token), user will be undefined
   */
  const user = await jwtVerify(token, new TextEncoder().encode(SECRET))
    .then(
      (data) => data.payload.user as typeof relations.users.table.$inferSelect
    )
    .catch(() => undefined);

  // Store user in request context
  const context = getContext<Context>();
  context.set("user", user);

  return next();
};

/**
 * Initialize Hono application with custom context type
 * The Context type provides type-safe access to user authentication state
 */
const app = new Hono<Context>();

/**
 * Enable context storage middleware
 * This allows access to the request context from anywhere in the application
 */
app.use(contextStorage());

/**
 * Apollo Explorer endpoint
 * Provides an interactive GraphQL IDE for testing queries and mutations
 */
app.get("/", (c) => {
  return c.html(
    explorer({
      initialState: {
        // Auto-generate sample GraphQL operations from the schema
        document: generate(schema, QUERY_GENERATION_DEPTH),
      },
      // GraphQL endpoint URL for the explorer to connect to
      endpointUrl: "/",
      // Automatically refresh schema periodically
      introspectionInterval: INTROSPECTION_INTERVAL,
    })
  );
});

/**
 * GraphQL endpoint
 * Handles GraphQL queries and mutations via POST requests
 * Authentication is handled by the authMiddleware
 */
app.post("/", authMiddleware, (c, next) => {
  return graphqlServer({
    schema,
  })(c, next);
});

/**
 * Start the HTTP server
 */
serve(app);

console.log(`Server running at http://localhost:${PORT}`);
