import type { relations } from "./db/relations";
import type { Context as C } from "hono";

export type Context = {
  Variables: {
    user?: typeof relations.users.table.$inferSelect;
  };
};
