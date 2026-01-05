# Pothos Drizzle Generator サンプル - 詳細解説

このドキュメントでは、`pothos-drizzle-generator`を使用して GraphQL API を構築するサンプルプロジェクトの詳細について解説します。

## 1. プロジェクト概要

このプロジェクトは、Hono、Pothos、Drizzle ORM を組み合わせ、`pothos-drizzle-generator`プラグインを活用して GraphQL API を自動生成するサンプルです。
主な目的は、Drizzle ORM で定義されたデータベーススキーマから、GraphQL の型、クエリ、ミューテーションを効率的に生成する方法を示すことです。

[![pothos-drizzle-generator-sample](./image.png)](https://github.com/SoraKumo001/pothos-drizzle-generator-sample)

### 主な特徴

- **スキーマ自動生成**: `pothos-drizzle-generator`が Drizzle スキーマを解析し、GraphQL の CRUD 操作を自動で生成します。
- **ロールベースのアクセス制御 (RBAC)**: `executable`や`where`といったオプションを利用して、スキーマレベルで柔軟なアクセスコントロールを実装します。
- **JWT 認証**: HTTP-only Cookie に保存された JWT（JSON Web Token）を用いた、セキュアなサインイン/サインアウト機能を提供します。
- **Drizzle ORM との連携**: Pothos と Drizzle ORM をシームレスに連携させ、型安全なデータベース操作を実現します。
- **対話的な API エクスプローラー**: Apollo GraphQL Explorer を同梱しており、ブラウザから直接 GraphQL API をテストできます。

## 2. 技術スタック

このプロジェクトで使用されている主要なライブラリとツールは以下の通りです。

| カテゴリ               | ライブラリ/ツール          | バージョン (package.json より) | 概要                                                                                      |
| ---------------------- | -------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------- |
| **Web フレームワーク** | `hono`                     | `^4.11.3`                      | 高速かつ軽量な Web フレームワーク。サーバーのエントリーポイントとして機能します。         |
| **GraphQL**            | `@pothos/core`             | `^4.12.0`                      | 型安全な GraphQL スキーマを構築するためのライブラリ。                                     |
|                        | `graphql`                  | `^16.12.0`                     | GraphQL の公式実装。                                                                      |
|                        | `@hono/graphql-server`     | `^0.7.0`                       | Hono で GraphQL サーバーをホストするためのミドルウェア。                                  |
|                        | `apollo-explorer`          | `^1.1.3`                       | 対話的な GraphQL IDE。                                                                    |
| **ORM**                | `drizzle-orm`              | `1.0.0-beta.8-734e789`         | TypeScript に最適化された軽量な ORM。                                                     |
|                        | `drizzle-kit`              | `1.0.0-beta.8-734e789`         | データベースマイグレーションを管理するツール。                                            |
| **Pothos プラグイン**  | `@pothos/plugin-drizzle`   | `0.16.1`                       | Pothos と Drizzle ORM を連携させるための公式プラグイン。                                  |
|                        | `pothos-drizzle-generator` | `^0.1.24`                      | 本プロジェクトの核となる、Drizzle スキーマから GraphQL スキーマを自動生成するプラグイン。 |
| **データベース**       | `PostgreSQL`               | -                              | Docker で実行されるリレーショナルデータベース。                                           |
| **実行環境**           | `tsx`                      | `^4.21.0`                      | TypeScript ファイルを直接実行するためのツール。                                           |
| **認証**               | `jose`                     | `^6.1.3`                       | JWT の生成と検証を行うためのライブラリ。                                                  |

## 3. プロジェクト構造

主要なファイルとディレクトリの役割は以下の通りです。

```
.
├── src
│   ├── index.ts            # Honoサーバーの設定、認証ミドルウェア、GraphQLエンドポイント
│   ├── builder.ts          # Pothos Schema Builderの設定、pothos-drizzle-generatorの定義
│   ├── context.ts          # アプリケーションコンテキストの型定義 (ユーザー情報など)
│   └── db
│       ├── schema.ts       # Drizzle ORMのテーブルスキーマ定義
│       └── relations.ts    # テーブル間のリレーション定義
├── drizzle                 # Drizzle Kitによって生成されたマイグレーションファイル
├── tools
│   ├── reset.ts            # データベースをリセットするスクリプト
│   └── seed.ts             # 初期データを投入するスクリプト
├── drizzle.config.ts       # Drizzle Kitの設定ファイル
├── package.json            # プロジェクトの依存関係とスクリプト定義
└── tsconfig.json           # TypeScriptのコンパイラ設定
```

## 4. セットアップと開発

### 4.1. 前提条件

- Node.js
- Docker (PostgreSQL の実行に必要)
- pnpm (パッケージマネージャー)

### 4.2. 初期設定

1.  **依存関係のインストール**:
    ```sh
    pnpm install
    ```
2.  **環境変数の設定**:
    `.env`ファイルをプロジェクトルートに作成し、以下の内容を記述します。
    ```
    DATABASE_URL="postgresql://user:password@localhost:5432/postgres?schema=public"
    SECRET="your-super-secret-key"
    ```
3.  **データベースの起動**:
    ```sh
    pnpm run dev:docker
    ```
4.  **マイグレーションの実行**:
    ```sh
    pnpm run drizzle:migrate
    ```
5.  **初期データの投入**:
    ```sh
    pnpm run drizzle:seed
    ```

### 4.3. 開発サーバーの起動

以下のコマンドで開発サーバーを起動します。

```sh
pnpm run dev
```

サーバーは `http://localhost:3000` で利用可能になります。この URL にアクセスすると、Apollo Explorer が開き、API を対話的に操作できます。

### 4.4. 利用可能なスクリプト

`package.json`で定義されている主要なスクリプトです。

- `dev`: 開発サーバーを起動します。ファイルの変更を監視し、自動で再起動します。
- `dev:docker`: Docker Compose を使用して PostgreSQL データベースを起動します。
- `drizzle:generate`: Drizzle スキーマの変更に基づいてマイグレーションファイルを生成します。
- `drizzle:migrate`: マイグレーションファイルを実行してデータベーススキーマを更新します。
- `drizzle:reset`: データベースをリセットし、マイグレーションとシーディングを再実行します。
- `drizzle:seed`: `tools/seed.ts` を実行し、データベースに初期データを投入します。

## 5. 動作の仕組み

### 5.1. データベーススキーマとリレーション (`src/db/schema.ts` と `relations.ts`)

データモデルの定義は、Drizzle ORM の中核です。このプロジェクトでは、`src/db/schema.ts`でテーブル構造を定義し、`src/db/relations.ts`でテーブル間の関連性を定義しています。

#### 5.1.1. テーブルスキーマ定義 (`src/db/schema.ts`)

このファイルは、PostgreSQL データベース内のテーブル、カラム、型を定義します。

```typescript
// src/db/schema.ts
import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";

// ユーザーロールを定義するEnum
export const roleEnum = pgEnum("Role", ["ADMIN", "USER"]);

// 'User'テーブル
export const users = pgTable("User", {
  id: uuid().defaultRandom().primaryKey(),
  email: text().notNull().unique(),
  name: text().notNull().default("User"),
  roles: roleEnum().array().default(["USER"]).notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

// 'Post'テーブル
export const posts = pgTable("Post", {
  id: uuid().defaultRandom().primaryKey(),
  published: boolean().notNull().default(false),
  title: text().notNull().default("New Post"),
  content: text().notNull().default(""),
  authorId: uuid().references(() => users.id, { onDelete: "cascade" }), // 外部キー
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

// 'Category'テーブル
export const categories = pgTable("Category", {
  id: uuid().defaultRandom().primaryKey(),
  name: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

// 'PostToCategory' 中間テーブル (多対多)
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
  (t) => [primaryKey({ columns: [t.postId, t.categoryId] })] // 複合主キー
);
```

- **`users`**: ユーザー情報を格納します。`roles`カラムは`pgEnum`で定義された`roleEnum`の配列であり、`ADMIN`または`USER`の役割を持つことができます。
- **`posts`**: 投稿記事の情報を格納します。`authorId`カラムは`users`テーブルの`id`を参照する外部キーとなっており、ユーザーが削除された場合には関連する投稿も削除されるよう`onDelete: "cascade"`が設定されています。
- **`categories`**: 投稿に付与するカテゴリの情報を格納します。
- **`postsToCategories`**: `posts`と`categories`の多対多（Many-to-Many）関係を実現するための中間テーブルです。`postId`と`categoryId`の組み合わせで複合主キーが設定されています。

#### 5.1.2. リレーション定義 (`src/db/relations.ts`)

`schema.ts`で定義したテーブル構造に基づき、テーブル間のリレーションを Drizzle に伝えます。これにより、`db.query.users.findFirst({ with: { posts: true } })`のように、関連データを簡単に取得できるようになります。

```typescript
// src/db/relations.ts
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema.js";

export const relations = defineRelations(schema, (r) => ({
  // Userは複数のPostを持つ (One-to-Many)
  users: {
    posts: r.many.posts({
      from: r.users.id,
      to: r.posts.authorId,
    }),
  },
  // Postは一人のUser(author)と複数のCategoryを持つ
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
    categories: r.many.categories({
      from: r.posts.id.through(r.postsToCategories.postId),
      to: r.categories.id.through(r.postsToCategories.categoryId),
    }),
  },
  // Categoryは複数のPostを持つ
  categories: {
    posts: r.many.posts(),
  },
  // 中間テーブルのリレーション定義
  postsToCategories: {
    post: r.one.posts({
      from: r.postsToCategories.postId,
      to: r.posts.id,
    }),
    category: r.one.categories({
      from: r.postsToCategories.categoryId,
      to: r.categories.id,
    }),
  },
}));
```

- **users to posts**: `users`は複数の`posts`を持つ一対多（One-to-Many）の関係です。`r.many.posts`で定義します。
- **posts to users**: `posts`は一人の`author`（`users`）に属する多対一（Many-to-One）の関係です。`r.one.users`で定義します。
- **posts to categories**: `posts`と`categories`は多対多（Many-to-Many）の関係です。中間テーブル`postsToCategories`を介して関連付けられるため、`.through()`メソッドを使用しています。
- **postsToCategories**: 中間テーブル自体も、それぞれ`posts`テーブルと`categories`テーブルへの一対一（One-to-One）の関係を持ちます。

これらのリレーション定義は、`pothos-drizzle-generator`が GraphQL スキーマを生成する際に、フィールド間の関連性を理解し、ネストされたクエリ（例: `query { findManyPosts { author { name } } }`）を正しく解決するために不可欠です。

#### 5.1.3. ER 図

`schema.ts`と`relations.ts`に基づいた、データベースの Entity-Relationship (ER) 図は以下の通りです。

```mermaid
erDiagram
    User ||--o{ Post : "author"

    Post ||--o{ PostToCategory : "categories"

    Category ||--o{ PostToCategory : "posts"

    User {
        uuid id PK
        text email UK
        text name
        Role_array roles "Enum: ADMIN, USER"
        timestamp createdAt
        timestamp updatedAt
    }

    Post {
        uuid id PK
        boolean published
        text title
        text content
        uuid authorId FK
        timestamp createdAt
        timestamp updatedAt
        timestamp publishedAt
    }

    Category {
        uuid id PK
        text name
        timestamp createdAt
        timestamp updatedAt
    }

    PostToCategory {
        uuid postId FK "PK"
        uuid categoryId FK "PK"
    }
```

### 5.2. GraphQL スキーマの自動生成 (`src/builder.ts`)

このプロジェクトの心臓部です。`PothosDrizzleGeneratorPlugin` を使って GraphQL スキーマを自動生成します。

```typescript
// src/builder.ts

const builder = new SchemaBuilder<PothosTypes>({
  plugins: [DrizzlePlugin, PothosDrizzleGeneratorPlugin],
  pothosDrizzleGenerator: {
    // ... 設定
  },
});
```

#### 5.2.1. セキュリティとフィルタリング

`pothosDrizzleGenerator`の設定を通じて、グローバルおよびモデル単位で詳細なセキュリティルールを定義しています。

- **グローバルな実行制御**:
  `all.executable` オプションで、認証されていないユーザーによる `mutation` 操作を全て拒否します。これにより、API の書き込み操作が保護されます。

  ```typescript
  executable: ({ operation, ctx }) => {
    if (isOperation(["mutation"], operation) && !ctx.get("user")) {
      return false;
    }
    return true;
  },
  ```

- **行レベルセキュリティ (Row-Level Security)**:
  `posts`モデルの`where`オプションを使用して、ユーザーが見れるデータをフィルタリングします。

  - **クエリ時**: ユーザーは「公開されている投稿」または「自身が作成した投稿」のみを取得できます。
  - **ミューテーション時**: ユーザーは「自身が作成した投稿」に対してのみ更新・削除操作が可能です。

  ```typescript
  where: ({ ctx, operation }) => {
    if (isOperation(["query"], operation)) {
      return {
        OR: [{ authorId: ctx.get("user")?.id }, { published: true }],
      };
    }
    if (isOperation(["mutation"], operation)) {
      return { authorId: ctx.get("user")?.id };
    }
  },
  ```

- **入力データの自動挿入**:
  `posts`モデルの`inputData`オプションを使い、`create`操作時に`authorId`フィールドを現在認証中のユーザー ID で自動的に補完します。
  ```typescript
  inputData: ({ ctx }) => {
    const user = ctx.get("user");
    if (!user) throw new Error("No permission");
    return { authorId: user.id };
  },
  ```

### 5.3. Hono による GraphQL サーバーの実装 (`src/index.ts`)

Hono は、高速で軽量な Web 標準準拠の Web フレームワークです。このプロジェクトでは、Hono を GraphQL サーバーのホストとして使用しています。

#### 5.3.1. GraphQL ミドルウェア

`@hono/graphql-server` パッケージを使用することで、Hono 上で簡単に GraphQL サーバーを稼働させることができます。
`src/index.ts` では、POST リクエストに対して `graphqlServer` ミドルウェアを適用しています。

```typescript
app.post("/", authMiddleware, (c, next) => {
  return graphqlServer({
    schema,
  })(c, next);
});
```

#### 5.3.2. コンテキストストレージ

Hono の `contextStorage` ミドルウェアを使用することで、リクエストスコープ内のどこからでもコンテキスト情報（認証ユーザーなど）にアクセスできるようになります。
これは、GraphQL のリゾルバ内でユーザー情報を取得する際に役立ちます。

```typescript
import { contextStorage } from "hono/context-storage";

app.use(contextStorage());
```

#### 5.3.3. Apollo Explorer

開発者体験を向上させるため、GET リクエストに対しては `apollo-explorer` を表示するように設定されています。
これにより、ブラウザ上で直感的にクエリを作成・実行し、API の動作を確認できます。

```typescript
app.get("/", (c) => {
  return c.html(
    explorer({
      initialState: {
        document: generate(schema, QUERY_GENERATION_DEPTH),
      },
      endpointUrl: "/",
      introspectionInterval: INTROSPECTION_INTERVAL,
    })
  );
});
```

### 5.4. 認証フロー (`src/index.ts` と `src/builder.ts`)

認証は JWT と Cookie を用いて実装されています。

#### 5.4.1. 認証ミドルウェア (`src/index.ts`)

`authMiddleware`は、GraphQL エンドポイントへのすべてのリクエストの前に実行されます。HTTP-only Cookie (`auth-token`) から JWT を抽出し、`jose`ライブラリを使って検証します。

```typescript
// src/index.ts

const authMiddleware = async (
  c: HonoContext<Context>,
  next: () => Promise<void>
) => {
  const cookies = getCookie(c);
  const token = cookies[AUTH_TOKEN_COOKIE] ?? "";

  // JWTの検証とユーザー情報の取得
  // 検証に失敗した場合（トークン期限切れや改ざんなど）、user は undefined となります
  const user = await jwtVerify(token, new TextEncoder().encode(SECRET))
    .then(
      (data) => data.payload.user as typeof relations.users.table.$inferSelect
    )
    .catch(() => undefined);

  // コンテキストへのユーザー情報の保存
  // これにより、後続の処理で c.get('user') や context.get('user') としてアクセス可能になります
  const context = getContext<Context>();
  context.set("user", user);

  return next();
};
```

このミドルウェアにより、検証が成功した場合はユーザー情報が Hono のコンテキストに格納され、Pothos のビルダーやリゾルバ内で利用可能になります。

#### 5.4.2. 認証ミューテーション (`src/builder.ts`)

自動生成される CRUD 操作とは別に、手動で 3 つの認証用ミューテーションを定義しています。 - `signIn`: メールアドレスを受け取り、ユーザーを認証します。成功した場合、JWT を生成し、`auth-token`という名前でセキュアな HTTP-only Cookie に設定します。 - `signOut`: `auth-token` Cookie をクリアし、ユーザーをサインアウトさせます。 - `me`: 現在認証中のユーザー情報を返します。

## 6. API 操作

`pothos-drizzle-generator`により、各モデル（`users`, `posts`, `categories`）に対して以下の GraphQL 操作が自動的に生成されます。

- **クエリ**:

  - `findMany*`: 複数件のレコードを取得します。（例: `findManyUsers`）
  - `findFirst*`: 条件に一致する最初の 1 件を取得します。（例: `findFirstPost`）
  - `count*`: 条件に一致するレコード数を取得します。（例: `countPosts`）

- **ミューテーション**:

  - `create*`: 新しいレコードを作成します。（例: `createPost`）
  - `update*`: 既存のレコードを更新します。（例: `updatePost`）
  - `delete*`: レコードを削除します。（例: `deletePost`）

- **対応フィルタ**:
  クエリでは、`AND`, `OR`, `NOT`, `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `in` など、豊富なフィルタ条件が利用可能です。

### 6.1. クエリの具体例

#### 投稿の取得 (フィルタリングとリレーション)

公開されている投稿を取得し、作成日時で降順にソートします。同時に著者の名前も取得します。

```graphql
query {
  findManyPost(
    where: { published: { eq: true } }
    orderBy: { createdAt: Desc }
  ) {
    id
    title
    content
    createdAt
    author {
      name
    }
  }
}
```

#### 特定のユーザーの検索

メールアドレスでユーザーを検索します。

```graphql
query {
  findFirstUser(where: { email: { eq: "user@example.com" } }) {
    id
    name
    email
    roles
  }
}
```

### 6.2. ミューテーションの具体例

#### 新規投稿の作成

新しい投稿を作成します。`authorId` は認証情報から自動的に設定されるため、入力は不要です。

```graphql
mutation {
  createOnePost(
    input: {
      title: "PothosとDrizzleの連携"
      content: "GraphQL APIの構築が非常に簡単になります。"
      published: true
    }
  ) {
    id
    title
    author {
      name
    }
  }
}
```

#### 投稿の更新

ID を指定して投稿を更新します。カテゴリの関連付けも同時に更新（置換）しています。

```graphql
mutation {
  updatePost(
    where: { id: { eq: "uuid-of-the-post" } }
    input: {
      title: "更新されたタイトル"
      categories: {
        set: [{ id: "uuid-of-category-1" }, { id: "uuid-of-category-2" }]
      }
    }
  ) {
    id
    title
    updatedAt
    categories {
      name
    }
  }
}
```

#### 投稿の削除

ID を指定して投稿を削除します。

```graphql
mutation {
  deletePost(where: { id: { eq: "uuid-of-the-post" } }) {
    id
  }
}
```

### 6.3. 認証ミューテーションの具体例

#### サインイン

メールアドレスを使用してサインインします。
成功すると、サーバーは HTTP-only Cookie に JWT を設定します。以降のリクエストは自動的に認証されます。
サンプルプログラムでは意図的にパスワードは設定していないので、メールアドレスのみで認証が通ります。

```graphql
mutation {
  signIn(email: "user@example.com") {
    id
    email
    name
    roles
  }
}
```

#### 現在のユーザー情報の取得 (Me)

現在サインインしているユーザーの情報を取得します。Cookie による認証が機能しているか確認するのに便利です。

```graphql
mutation {
  me {
    id
    email
    roles
  }
}
```

#### サインアウト

サインアウトし、認証 Cookie をクリアします。

```graphql
mutation {
  signOut
}
```
