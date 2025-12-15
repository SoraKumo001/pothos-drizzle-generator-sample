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
import { schema } from "./builder";
import type { Context } from "./context";
import type { relations } from "./db/relations";

const app = new Hono<Context>();
app.use(contextStorage());

// Apollo Explorer
app.get("/", (c) => {
  return c.html(
    explorer({
      initialState: {
        // Set up sample GraphQL operations
        document: generate(schema, 1),
      },
      endpointUrl: "/",
      introspectionInterval: 10000,
    })
  );
});
app.post("/", async (c, next) => {
  // Get the user from the token
  const cookies = getCookie(c);
  const token = cookies["auth-token"] ?? "";
  const secret = process.env.SECRET;
  const user = await jwtVerify(token, new TextEncoder().encode(secret))
    .then(
      (data) => data.payload.user as typeof relations.users.table.$inferSelect
    )
    .catch(() => undefined);
  const context = getContext<Context>();
  context.set("user", user);

  return graphqlServer({
    schema,
  })(c, next);
});

serve(app);

console.log("http://localhost:3000");
