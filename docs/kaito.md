
--- Repository Documentation ---

# Kaito: Functional HTTP Framework for TypeScript

Kaito is a modern HTTP server framework for TypeScript. It leverages the Web Fetch API and Request/Response objects. Kaito works with Bun, Node.js, Deno, Cloudflare Workers, and Vercel Edge Functions.

## Core Features

-   Full TypeScript support with end-to-end type safety.
-   Fast performance.
-   Small package size.
-   Streaming support with Server-Sent Events (SSE).
-   Flexible request handling.

## Quick Start

### Installation

```bash
bun i @kaito-http/core # Or use pnpm, npm, or yarn
```

### Usage

Create a simple server:

```typescript
import {createUtilities, createKaitoHandler} from '@kaito-http/core';

const {getContext, router} = createUtilities(async (req, res) => {
    return {
        req,
        time: new Date(),
    };
});

const app = router().get('/', async ({ctx}) => {
    return {
        time: ctx.time.toISOString(),
    };
});

const handle = createKaitoHandler({
    getContext,
    router: app,
    onError: async ({error}) => {
        console.error(error);
        return {status: 500, message: 'Internal Server Error'};
    },
});

Bun.serve({
    port: 3000,
    fetch: handle,
});

console.log('Server listening on port 3000');
```

## Packages

### `@kaito-http/core`

#### Summary

Core functionality for Kaito, including routing, context management, and request handling.

#### Installation

```bash
bun i @kaito-http/core
```

#### Public APIs

##### `createUtilities`

Creates utility functions for context and router creation.

```typescript
function createUtilities<Context>(getContext: GetContext<Context>): {
    getContext: GetContext<Context>;
    router: () => Router<Context, Context, never>;
}
```

-   `getContext`: Function to generate context for each request (`GetContext<Context>`).
-   `router`: Function to create a new router instance.

##### `KaitoRequest`

Wraps the standard `Request` object, providing a similar API.

```typescript
class KaitoRequest {
  public readonly url: URL;
  public readonly headers: Headers;
  public readonly method: string;
  public arrayBuffer(): Promise<ArrayBuffer>;
  public blob(): Promise<Blob>;
  public formData(): Promise<FormData>;
  public bytes(): Promise<Uint8Array>;
  public json(): Promise<unknown>;
  public text(): Promise<string>;
  public readonly request: Request
}
```

##### `KaitoHead`

Wraps a `Headers` object and a status code.

```typescript
class KaitoHead {
    public readonly headers: Headers;
    public status(): number;
    public status(status: number): this;
    public toResponse<T>(body: APIResponse<T>): Response;
    public readonly touched: boolean;
}
```

##### `Router`

Manages routes and middleware.

```typescript
class Router<ContextFrom, ContextTo, R extends AnyRoute> {
    static create<Context>(): Router<Context, Context, never>;
    add<Result, Path extends string, Method extends KaitoMethod, Query extends AnyQueryDefinition = {}, Body extends Parsable = never>(method: Method, path: Path, route: RouteConfig): Router;
    merge<PathPrefix extends `/${string}`, OtherRoutes extends AnyRoute>(pathPrefix: PathPrefix, other: Router): Router;
    freeze(server: Omit<HandlerConfig<ContextFrom>, 'router'>): (req: Request) => Promise<Response>;
    get: <...>(...) => Router;
    post: <...>(...) => Router;
    put: <...>(...) => Router;
    patch: <...>(...) => Router;
    delete: <...>(...) => Router;
    head: <...>(...) => Router;
    options: <...>(...) => Router;
    through<NextContext>(through: (context: ContextTo) => Promise<NextContext>): Router;
    routes: Set<Routes>;
}
```

##### `createKaitoHandler`

Creates a request handler function.

```typescript
function createKaitoHandler<Context>(config: HandlerConfig<Context>): (request: Request) => Promise<Response>
```

-   `config`: Configuration object including `router`, `getContext`, `onError`, `transform` and `before`.

##### `KaitoError`

Error class for Kaito applications.

```typescript
class KaitoError extends Error {
    constructor(public readonly status: number, message: string)
}
```

##### `sse`

Utility for creating Server-Sent Events (SSE) responses from different sources.

```typescript
function sse<U, E extends string, T extends SSEEvent<U, E>>(
    source: SSESource<U, E> | AsyncGenerator<T, unknown, unknown> | (() => AsyncGenerator<T, unknown, unknown>),
): KaitoSSEResponse<T>
```

##### `sseFromAnyReadable`

Creates SSE responses from ReadableStreams, transforming chunks into SSE events.

```typescript
export function sseFromAnyReadable<R, U, E extends string>(
    stream: ReadableStream<R>,
    transform: (chunk: R) => SSEEvent<U, E>,
): KaitoSSEResponse<SSEEvent<U, E>>
```

##### `experimental_createCORSTransform`

Creates a transform function to apply CORS headers with sane defaults for most apps.

```typescript
export function experimental_createCORSTransform(origins: string[])
```

#### Dependencies

-   Zod (for schema validation).

### `@kaito-http/client`

#### Summary

A typed HTTP client for Kaito servers.

#### Installation

```bash
bun i @kaito-http/client
```

#### Public APIs

##### `createKaitoHTTPClient`

Creates a type-safe HTTP client.

```typescript
function createKaitoHTTPClient<APP extends Router<any, any, any> = never>(
    rootOptions: KaitoHTTPClientRootOptions,
): {
    get: <...>(...) => Promise<...>;
    post: <...>(...) => Promise<...>;
    put: <...>(...) => Promise<...>;
    patch: <...>(...) => Promise<...>;
    delete: <...>(...) => Promise<...>;
    head: <...>(...) => Promise<...>;
    options: <...>(...) => Promise<...>;
}
```

-   `rootOptions`: Configuration object with base URL, `fetch` and `before` hooks.

##### `KaitoClientHTTPError`

Error class for HTTP client errors.

```typescript
class KaitoClientHTTPError extends Error {
    constructor(
        public readonly request: Request,
        public readonly response: Response,
        public readonly body: ErroredAPIResponse,
    );
}
```

##### `isKaitoClientHTTPError`

Type guard to check if an error is a `KaitoClientHTTPError`.

```typescript
function isKaitoClientHTTPError(error: unknown): error is KaitoClientHTTPError
```

#### Usage

```typescript
import {createKaitoHTTPClient} from '@kaito-http/client';
import type {App} from '../api/index.ts';

const api = createKaitoHTTPClient<App>({
    base: 'http://localhost:3000',
});

const user = await api.get('/v1/users/:id', {
    params: {
        id: '123',
    },
});

console.log(user);
```

### `@kaito-http/uws`

#### Summary

Provides a uWebSockets.js-based HTTP server for Node.js.

#### Installation

```bash
bun i @kaito-http/uws
```

#### Public APIs

##### `KaitoServer.serve`

Starts the HTTP server.

```typescript
class KaitoServer {
    static serve(options: ServeUserOptions): Promise<KaitoServer>;
    close(): void;
    readonly address: string;
    readonly url: string;
}
```

-   `options`: Server options including port, host, and the fetch handler.

##### `getRemoteAddress`

Gets the remote address (ip address) of the request. Only available with `@kaito-http/uws`.

```typescript
function getRemoteAddress(): string
```

#### Dependencies

-   uWebSockets.js (provided via a GitHub URL)

## Configuration Options

### Handler Configuration

-   `router`: The root router for the application.
-   `getContext`: Function to create the context for each request.
-   `onError`: Function to handle errors and format the error response.
-   `before`: Function to run before a request is handled, allowing for early responses (e.g., for OPTIONS requests).
-   `transform`: Function to transform the response before sending it to the client (e.g., for setting CORS headers).

### Client Configuration

-   `base`: Base URL for the API.
-   `fetch`: Custom `fetch` implementation.
-   `before`: Function to modify requests before they are sent.


--- End of Documentation ---
