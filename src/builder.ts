import SchemaBuilder from "@pothos/core";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { getTableConfig } from "drizzle-orm/pg-core";
import { GraphQLSchema } from "graphql";
import { setCookie } from "hono/cookie";
import { SignJWT } from "jose";
import PothosDrizzleGeneratorPlugin, {
  isOperation,
} from "pothos-drizzle-generator";
import { format } from "sql-formatter";
import { relations } from "./db/relations.js";
import type { Context } from "./context.js";
import type { Context as HonoContext } from "hono";

/**
 * Helper function to retrieve and validate environment variables.
 * Throws an error if the specified variable is not set.
 */
const getEnvVariable = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
};

// Database connection string from environment variables
const connectionString = getEnvVariable("DATABASE_URL");

// Secret key for JWT token signing and verification
const SECRET = getEnvVariable("SECRET");

// JWT token expiration time: 400 days in seconds
const TOKEN_MAX_AGE = 60 * 60 * 24 * 400;

// Cookie configuration shared across authentication operations
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/",
};

// Tables to exclude from GraphQL schema generation
// Junction tables like "postsToCategories" are typically excluded
const EXCLUDE_TABLES: Array<keyof typeof relations> = ["postsToCategories"];

// Extract schema name from connection string (defaults to "public")
const url = new URL(connectionString);
const searchPath = url.searchParams.get("schema") ?? "public";

// Initialize Drizzle ORM client with PostgreSQL connection
// Includes custom query logger for debugging SQL statements
const db = drizzle({
  connection: {
    connectionString,
    options: `--search_path=${searchPath}`,
  },
  relations,
  logger: {
    logQuery: (query, params) => {
      const formattedParams = params.map((value, index) => {
        const stringValue =
          typeof value === "string" ? `'${value}'` : String(value);
        return `${stringValue} /*$${index + 1}*/`;
      });
      console.info(
        `--\n${format(query, {
          language: "postgresql",
          keywordCase: "upper",
          expressionWidth: 100,
          params: Object.fromEntries(formattedParams.map((p, i) => [i + 1, p])),
        })};`
      );
    },
  },
});

export interface PothosTypes {
  DrizzleRelations: typeof relations;
  Context: HonoContext<Context>;
}

/**
 * Initialize Pothos Schema Builder with plugins:
 * - DrizzlePlugin: Integrates Drizzle ORM with Pothos
 * - PothosDrizzleGeneratorPlugin: Automatically generates GraphQL schema from Drizzle schema
 */
const builder = new SchemaBuilder<PothosTypes>({
  plugins: [DrizzlePlugin, PothosDrizzleGeneratorPlugin],
  drizzle: {
    client: () => db,
    relations,
    getTableConfig,
  },
  pothosDrizzleGenerator: {
    // Exclude specific tables from schema generation (e.g., junction tables)
    use: { exclude: EXCLUDE_TABLES },
    // Global configuration applied to all models
    all: {
      // Maximum query depth to prevent deeply nested queries (protection against DoS)
      depthLimit: () => 5,
      // Controls whether operations (findMany, findFirst, count, create, update, delete) are executable
      // This guards against unauthorized mutations by requiring authentication
      executable: ({ operation, ctx }) => {
        if (isOperation(["mutation"], operation) && !ctx.get("user")) {
          return false;
        }
        return true;
      },
      // Configure input fields for create/update operations
      // Excludes auto-managed system fields from user input
      inputFields: () => {
        return { exclude: ["createdAt", "updatedAt"] };
      },
    },
    // Model-specific configuration
    models: {
      posts: {
        // Automatically inject data during create/update operations
        // Sets authorId to the current authenticated user
        inputData: ({ ctx }) => {
          const user = ctx.get("user");
          if (!user) throw new Error("No permission");
          return { authorId: user.id };
        },
        // Apply WHERE clause filters based on operation type
        // This implements row-level security
        where: ({ ctx, operation }) => {
          // For queries (findMany, findFirst, count): show published posts or user's own posts
          if (isOperation(["query"], operation)) {
            return {
              OR: [{ authorId: ctx.get("user")?.id }, { published: true }],
            };
          }
          // For mutations (create, update, delete): only allow operations on user's own posts
          if (isOperation(["mutation"], operation)) {
            return { authorId: ctx.get("user")?.id };
          }
        },
      },
    },
  },
});

/**
 * Authentication mutations
 * Provides user authentication functionality including sign-in, sign-out, and current user retrieval
 */
builder.mutationType({
  fields: (t) => ({
    // Returns the currently authenticated user
    me: t.drizzleField({
      type: "users",
      nullable: true,
      resolve: (_query, _root, _args, ctx) => {
        const user = ctx.get("user");
        return user || null;
      },
    }),
    // Authenticates a user by email and sets JWT cookie
    signIn: t.drizzleField({
      args: { email: t.arg({ type: "String" }) },
      type: "users",
      nullable: true,
      resolve: async (_query, _root, { email }, ctx) => {
        const user =
          email &&
          (await db.query.users.findFirst({ where: { email: email } }));
        if (!user) {
          // Authentication failed: clear any existing auth cookie
          setCookie(ctx, "auth-token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
        } else {
          // Authentication successful: generate JWT and set secure cookie
          const token = await new SignJWT({ user: user })
            .setProtectedHeader({ alg: "HS256" })
            .sign(new TextEncoder().encode(SECRET));
          setCookie(ctx, "auth-token", token, {
            ...COOKIE_OPTIONS,
            maxAge: TOKEN_MAX_AGE,
          });
        }
        return user || null;
      },
    }),
    // Signs out the current user by clearing the authentication cookie
    signOut: t.field({
      args: {},
      type: "Boolean",
      nullable: true,
      resolve: async (_root, _args, ctx) => {
        setCookie(ctx, "auth-token", "", { ...COOKIE_OPTIONS, maxAge: 0 });
        return true;
      },
    }),
  }),
});

export const schema: GraphQLSchema = builder.toSchema({ sortSchema: false });
