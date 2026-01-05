# Pothos Drizzle Generator Sample

A Pothos plugin that automatically generates GraphQL schemas based on Drizzle schema information.
This sample demonstrates how to build a GraphQL API with Hono, Pothos, and Drizzle ORM using the [`pothos-drizzle-generator`](https://www.npmjs.com/package/pothos-drizzle-generator) plugin.

![](./document/image.png)

## Key Features

- **Automatic Schema Generation**: Leverages `pothos-drizzle-generator` to generate GraphQL types, queries, and mutations directly from Drizzle ORM schemas.
- **Role-Based Access Control (RBAC)**: Implements security at the schema level using the `executable` and `where` configurations.
- **JWT Authentication**: Secure sign-in/sign-out functionality using JSON Web Tokens (JWT) stored in HTTP-only cookies.
- **Drizzle ORM Integration**: Seamless integration between Pothos and Drizzle for type-safe database operations.
- **Interactive API Explorer**: Includes Apollo Explorer for testing GraphQL operations.

## Project Structure

- `src/index.ts`: The entry point of the application. Sets up the Hono server, authentication middleware, and GraphQL endpoints.
- `src/builder.ts`: Configures the Pothos Schema Builder, including the Drizzle plugin and the schema generator. Defines the global and model-specific security rules.
- `src/db/`: Contains Drizzle schema and relation definitions.
- `src/context.ts`: Defines the application context, including user information.

## How it Works

### 1. Schema Generation (`src/builder.ts`)

The `pothos-drizzle-generator` plugin is configured within the `SchemaBuilder`. It automatically maps Drizzle tables to GraphQL types.

```typescript
const builder = new SchemaBuilder<PothosTypes>({
  plugins: [DrizzlePlugin, PothosDrizzleGeneratorPlugin],
  pothosDrizzleGenerator: {
    // Configuration for automatic generation
  },
});
```

### 2. Security and Filtering

Security is implemented globally and per model within `src/builder.ts`:

- **Global Execution Control**: Prevents unauthenticated users from performing any mutations.
- **Row-Level Security**: Uses the `where` option to filter data based on the authenticated user. For example, users can only see their own private posts or any public posts.
- **Auto-Injection**: The `inputData` option automatically sets fields like `authorId` based on the current user session during creation.

### 3. Authentication Flow (`src/index.ts`)

- **Middleware**: `authMiddleware` extracts the JWT from the `auth-token` cookie, verifies it using a secret key, and stores the user object in Hono's context.
- **Mutations**: The `signIn` mutation verifies user credentials (email in this sample), generates a JWT, and sets it in a secure cookie. The `signOut` mutation clears this cookie.

## Setup and Development

### Prerequisites

- Node.js
- Docker (for PostgreSQL)
- pnpm

### Initialization

1. **Start Database**:

   ```sh
   pnpm run dev:docker
   ```

2. **Run Migrations**:

   ```sh
   pnpm run drizzle:migrate
   ```

3. **Seed Data**:
   ```sh
   pnpm run drizzle:seed
   ```

### Execution

Start the development server:

```sh
pnpm run dev
```

The server will be available at `http://localhost:3000`. You can access the Apollo Explorer at this URL to interact with the API.

## API Operations

The following operations are automatically generated for each model (unless excluded):

- **Queries**: `findMany`, `findFirst`, `count`
- **Mutations**: `create`, `update`, `delete`
- **Supported Filters**: `AND`, `OR`, `NOT`, `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `like`, `in`, etc.
