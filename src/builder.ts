import "dotenv/config";
import SchemaBuilder from "@pothos/core";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { getTableConfig } from "drizzle-orm/pg-core";
import { Context as HonoContext } from "hono";
import { setCookie } from "hono/cookie";
import { SignJWT } from "jose";
import PothosDrizzleGeneratorPlugin from "pothos-drizzle-generator";
// import {
//   isOperation,
//   OperationMutation,
//   OperationQuery,
// } from "pothos-drizzle-generator";
import { relations } from "./db/relations";
import type { Context } from "./context";

const db = drizzle({
  connection: process.env.DATABASE_URL!,
  relations,
  logger: true,
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
    // クエリの最大の深さ
    depthLimit: () => 5,
    // 使用しないテーブル
    use: { exclude: ["postsToCategories"] },
    models: {
      users: {
        // データの変更禁止
        // operations: { exclude: ["mutation"] },
      },
      posts: {
        // 上書き禁止フィールド
        inputFields: { exclude: ["createdAt", "updatedAt"] },
        // データ書き込み時は自分のIDを設定
        inputData: ({ ctx }) => {
          const user = ctx.get("user");
          if (!user) throw new Error("No permission");
          return { authorId: user.id };
        },
        // where: ({ ctx, operation }) => {
        //   // 抽出時は公開されているデータか、自分のデータ
        //   if (isOperation(OperationQuery, operation)) {
        //     return {
        //       OR: [{ published: true }, { authorId: { eq: ctx.userId } }],
        //     };
        //   }
        //   // 書き込み時は自分のデータ
        //   if (isOperation(OperationMutation, operation)) {
        //     return { authorId: ctx.userId };
        //   }
        // },
      },
    },
  },
});

// 認証機能の追加
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
            domain: undefined,
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
            domain: undefined,
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
          domain: undefined,
        });
        return true;
      },
    }),
  }),
});

export const schema = builder.toSchema({ sortSchema: false });
