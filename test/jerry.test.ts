import { after, before, describe, it } from "node:test";
import * as assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import jerry, { JerryError, createFetchAdapter } from "../src";

interface TestServer {
  baseURL: string;
  close: () => Promise<void>;
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    request.on("error", reject);
  });
}

async function createTestServer(): Promise<TestServer> {
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");

    if (url.pathname === "/json") {
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          method: request.method,
          params: Object.fromEntries(url.searchParams.entries()),
        }),
      );
      return;
    }

    if (url.pathname === "/echo" && request.method === "POST") {
      const body = await readBody(request);
      response.setHeader("content-type", "application/json");
      response.end(
        JSON.stringify({
          body: JSON.parse(body),
          headers: request.headers,
        }),
      );
      return;
    }

    if (url.pathname === "/text") {
      response.setHeader("content-type", "text/plain");
      response.end("plain-text-response");
      return;
    }

    if (url.pathname === "/slow") {
      const delay = Number(url.searchParams.get("delay") ?? "50");
      await new Promise((resolve) => setTimeout(resolve, delay));
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ delayed: delay }));
      return;
    }

    if (url.pathname === "/status/418") {
      response.statusCode = 418;
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ error: "teapot" }));
      return;
    }

    response.statusCode = 404;
    response.end("not-found");
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("Unable to start test server");
  }

  return {
    baseURL: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}

describe("jerry", () => {
  let server: TestServer;

  before(async () => {
    server = await createTestServer();
  });

  after(async () => {
    await server.close();
  });

  it("performs a GET request with baseURL and query params", async () => {
    const client = jerry.create({ baseURL: server.baseURL });
    const response = await client.get<{ method: string; params: Record<string, string> }>("/json", {
      params: { page: 2, q: "jerry" },
    });

    assert.equal(response.status, 200);
    assert.equal(response.data.method, "GET");
    assert.deepEqual(response.data.params, { page: "2", q: "jerry" });
  });

  it("returns only data when responseMode=data is explicit", async () => {
    const client = jerry.create({ baseURL: server.baseURL });
    const data = await client.get<{ method: string; params: Record<string, string> }>("/json", {
      responseMode: "data",
    });

    assert.deepEqual(data, {
      method: "GET",
      params: {},
    });
  });

  it("serializes JSON bodies and normalizes request headers", async () => {
    const client = jerry.create({ baseURL: server.baseURL });
    const response = await client.post<{ body: { hello: string }; headers: Record<string, string> }>(
      "/echo",
      { hello: "world" },
    );

    assert.deepEqual(response.data.body, { hello: "world" });
    assert.equal(response.data.headers["content-type"], "application/json");
  });

  it("executes request and response interceptors in registration order", async () => {
    const client = jerry.create({ baseURL: server.baseURL });
    const events: string[] = [];

    const firstRequestInterceptor = client.interceptors.request.use((config) => {
      events.push("request-1");
      config.headers = { ...config.headers, "x-first": "1" };
      return config;
    });

    client.interceptors.request.use((config) => {
      events.push("request-2");
      config.headers = { ...config.headers, "x-second": "2" };
      return config;
    });

    client.interceptors.response.use((response) => {
      events.push("response-1");
      return response;
    });

    client.interceptors.response.use((response) => {
      events.push("response-2");
      return response;
    });

    client.interceptors.request.eject(firstRequestInterceptor);

    await client.get("/json");

    assert.deepEqual(events, ["request-2", "response-1", "response-2"]);
  });

  it("normalizes non-2xx responses into JerryError with response details", async () => {
    const client = jerry.create({ baseURL: server.baseURL });

    await assert.rejects(
      () => client.get("/status/418"),
      (error: unknown) => {
        assert.ok(error instanceof JerryError);
        const jerryError = error as JerryError;
        assert.equal(jerryError.code, "ERR_BAD_STATUS");
        assert.equal(jerryError.kind, "http");
        assert.equal(jerryError.response?.status, 418);
        assert.deepEqual(jerryError.response?.data, { error: "teapot" });
        return true;
      },
    );
  });

  it("supports timeouts through AbortController composition", async () => {
    const client = jerry.create({ baseURL: server.baseURL });

    await assert.rejects(
      () => client.get("/slow?delay=100", { timeout: 10 }),
      (error: unknown) => {
        assert.ok(error instanceof JerryError);
        const jerryError = error as JerryError;
        assert.equal(jerryError.code, "ERR_TIMEOUT");
        assert.equal(jerryError.kind, "timeout");
        return true;
      },
    );
  });

  it("supports user-driven abort signals", async () => {
    const client = jerry.create({ baseURL: server.baseURL });
    const controller = new AbortController();

    const request = client.get("/slow?delay=100", { signal: controller.signal });
    controller.abort();

    await assert.rejects(
      () => request,
      (error: unknown) => {
        assert.ok(error instanceof JerryError);
        const jerryError = error as JerryError;
        assert.equal(jerryError.code, "ERR_ABORTED");
        assert.equal(jerryError.kind, "abort");
        return true;
      },
    );
  });

  it("accepts a custom adapter", async () => {
    const adapter = createFetchAdapter("node");
    const client = jerry.create({ adapter, baseURL: server.baseURL });
    const response = await client.get<{ method: string; params: Record<string, string> }>("/json");

    assert.equal(response.data.method, "GET");
  });
});
