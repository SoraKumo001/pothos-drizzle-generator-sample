import SchemaBuilder from "@pothos/core";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { getTableConfig } from "drizzle-orm/pg-core";
import { GraphQLSchema } from "graphql";
import { setCookie } from "hono/cookie";
import { SignJWT } from "jose";
import PothosDrizzleGeneratorPlugin, {
  isOperation,
  OperationMutation,
  OperationQuery,
} from "pothos-drizzle-generator";
import { format } from "sql-formatter";
import { relations } from "./db/relations.js";
import type { Context } from "./context.js";
import type { Context as HonoContext } from "hono";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const url = new URL(connectionString);
const searchPath = url.searchParams.get("schema") ?? "public";

const db = drizzle({
  connection: {
    connectionString,
    options: `--search_path=${searchPath}`,
  },
  relations,
  logger: {
    logQuery: (query, params) => {
      console.info(format(query, { language: "postgresql" }), "\n--\n", params);
    },
  },
});

export interface PothosTypes {
  DrizzleRelations: typeof relations;
  Context: HonoContext<Context>;
}

const builder = new SchemaBuilder<PothosTypes>({
  plugins: [
    DrizzlePlugin,
    PothosDrizzleGeneratorPlugin, // Set plugin
  ],
  drizzle: {
    client: () => db,
    relations,
    getTableConfig,
  },
  pothosDrizzleGenerator: {
    // Tables not used
    use: { exclude: ["postsToCategories"] },
    // Applies to all models
    all: {
      // Maximum query depth
      depthLimit: () => 5,
      executable: ({ operation, ctx }) => {
        // Prohibit write operations if the user is not authenticated
        if (isOperation(OperationMutation, operation) && !ctx.get("user")) {
          return false;
        }
        return true;
      },
      inputFields: () => {
        // Exclude auto-generated fields
        return { exclude: ["createdAt", "updatedAt"] };
      },
    },
    // Apply to individual models
    models: {
      posts: {
        // Set the current user's ID when writing data
        inputData: ({ ctx }) => {
          const user = ctx.get("user");
          if (!user) throw new Error("No permission");
          return { authorId: user.id };
        },
        where: ({ ctx, operation }) => {
          // When querying, only return published data or the user's own data
          if (isOperation(OperationQuery, operation)) {
            return {
              OR: [
                { authorId: { eq: ctx.get("user")?.id } },
                { published: { eq: true } },
              ],
            };
          }
          // When writing, only allow operations on the user's own data
          if (isOperation(OperationMutation, operation)) {
            return { authorId: ctx.get("user")?.id };
          }
        },
      },
    },
  },
});

// Addition of authentication functionality
builder.mutationType({
  fields: (t) => ({
    me: t.drizzleField({
      type: "users",
      nullable: true,
      resolve: (_query, _root, _args, ctx) => {
        const user = ctx.get("user");
        return user || null;
      },
    }),
    signIn: t.drizzleField({
      args: { email: t.arg({ type: "String" }) },
      type: "users",
      nullable: true,
      resolve: async (_query, _root, { email }, ctx) => {
        const user =
          email &&
          (await db.query.users.findFirst({ where: { email: email } }));
        if (!user) {
          setCookie(ctx, "auth-token", "", {
            httpOnly: true,
            sameSite: "strict",
            path: "/",
            maxAge: 0,
          });
        } else {
          const secret = process.env.SECRET;
          if (!secret) throw new Error("SECRET_KEY is not defined");
          const token = await new SignJWT({ user: user })
            .setProtectedHeader({ alg: "HS256" })
            .sign(new TextEncoder().encode(secret));
          setCookie(ctx, "auth-token", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 400,
            sameSite: "strict",
            path: "/",
          });
        }
        return user || null;
      },
    }),
    signOut: t.field({
      args: {},
      type: "Boolean",
      nullable: true,
      resolve: async (_root, _args, ctx) => {
        setCookie(ctx, "auth-token", "", {
          httpOnly: true,
          sameSite: "strict",
          path: "/",
          maxAge: 0,
        });
        return true;
      },
    }),
  }),
});

export const schema: GraphQLSchema = builder.toSchema({ sortSchema: false });
