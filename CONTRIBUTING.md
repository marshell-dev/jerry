# Contributing

## Local Development

```bash
bun install
bun run build
bun run test
```

## Project Structure

- `src/core`: public API, request flow, config merge, error normalization
- `src/adapters`: runtime-specific transport adapters
- `src/interceptors`: request and response interceptor manager
- `src/utils`: pure helpers for URL, headers, body, response parsing
- `src/types`: public TypeScript contracts
- `test`: integration-style tests against a local HTTP server

## Pull Requests

- Keep the public API intentional and explicit.
- Add or update tests for any behavior change.
- Avoid adding runtime dependencies unless there is a strong reason.
- Preserve dual output targets: ESM, CommonJS, and declaration files.

## Release Notes

This repository is consumed directly from GitHub tags. Before tagging a release:

1. Run `bun run build`
2. Run `bun run test`
3. Update README examples or docs if the API changed
4. Create and push a semver tag such as `v0.1.0`

