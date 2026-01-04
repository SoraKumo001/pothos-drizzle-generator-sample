import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("Role", ["ADMIN", "USER"]);

export const users = pgTable("User", {
  id: uuid().defaultRandom().primaryKey(),
  email: text().notNull().unique(),
  name: text().notNull().default("User"),
  roles: roleEnum().array().default(["USER"]).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const posts = pgTable("Post", {
  id: uuid().defaultRandom().primaryKey(),
  published: boolean().notNull().default(false),
  title: text().notNull().default("New Post"),
  content: text().notNull().default(""),
  authorId: uuid().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("Category", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const postsToCategories = pgTable(
  "PostToCategory",
  {
    postId: uuid()
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    categoryId: uuid()
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.categoryId] })]
);
