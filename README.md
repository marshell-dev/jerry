# jerry

![CI](https://github.com/marshell-dev/jerry/actions/workflows/ci.yml/badge.svg)

`jerry` is a small TypeScript-first HTTP client for browser, Node.js, and CLI runtimes.

The repository is published on GitHub and can be consumed directly from git. It is not published to npm.

## Highlights

- Callable default export: `jerry(config)` and `jerry(url, config)`
- Instance factory with `create()`
- Request and response interceptors with deterministic FIFO execution
- Abort via `AbortSignal` and built-in timeout support
- Dual adapters for browser and Node.js with a shared fetch transport
- Normalized `JerryError` for network, timeout, abort, parse, and HTTP status failures
- ESM, CommonJS, and `.d.ts` output

## Architecture

- `src/core`: public API orchestration, config resolution, dispatch, and error normalization
- `src/adapters`: browser and Node adapters built on top of a shared fetch adapter
- `src/interceptors`: interceptor manager with explicit add/eject semantics
- `src/utils`: URL building, header normalization, request body preparation, runtime detection
- `src/types`: public contracts and generic result typing

## Installation

Install from GitHub and pin to a tag:

```bash
bun add github:marshell-dev/jerry#v0.1.0
```

```bash
pnpm add github:marshell-dev/jerry#v0.1.0
```

```bash
npm i github:marshell-dev/jerry#v0.1.0
```

`prepare` is enabled in this repository, so package managers can build the library when installing from git.

## Quick Start

```ts
import jerry from "jerry";

interface User {
  id: string;
  name: string;
}

const client = jerry.create({
  baseURL: "https://api.example.com",
});

const response = await client.get<User>("/me");
console.log(response.data.name);

const data = await client.get<User>("/me", {
  responseMode: "data",
});
console.log(data.name);
```

## API Shape

```ts
jerry(config);
jerry.create(defaultConfig);

instance.request<T>(config);
instance.get<T>(url, config);
instance.post<T>(url, data, config);
instance.put<T>(url, data, config);
instance.patch<T>(url, data, config);
instance.delete<T>(url, config);
instance.head<T>(url, config);
instance.options<T>(url, config);

instance.interceptors.request.use(onFulfilled, onRejected);
instance.interceptors.response.use(onFulfilled, onRejected);
instance.interceptors.request.eject(id);
instance.interceptors.response.eject(id);
```

## Interceptors

```ts
import jerry from "jerry";

const api = jerry.create({
  baseURL: "https://api.example.com",
});

api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    Authorization: "Bearer token",
  };

  return config;
});

api.interceptors.response.use((response) => {
  return response;
});
```

## Error Handling

```ts
import jerry from "jerry";

try {
  await jerry.get("https://api.example.com/missing");
} catch (error) {
  if (jerry.isJerryError(error)) {
    console.error(error.code, error.kind, error.status);
  }
}
```

`JerryError` normalizes:

- network failures
- timeout failures
- abort failures
- non-2xx HTTP responses
- response parse errors
- adapter/configuration errors

## Examples

- Browser example: [`examples/browser.ts`](./examples/browser.ts)
- Node.js example: [`examples/node.ts`](./examples/node.ts)
- CLI example: [`examples/cli.ts`](./examples/cli.ts)

## Build

```bash
bun install
bun run build
```

## Test

```bash
bun run test
```

## Release Flow

For GitHub-based consumption, cut a git tag and reference that tag from downstream projects:

```bash
git tag v0.1.0
git push origin v0.1.0
```

Then install:

```bash
bun add github:marshell-dev/jerry#v0.1.0
```
