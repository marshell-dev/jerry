import jerry from "../src";

interface Healthcheck {
  ok: boolean;
  version: string;
}

const client = jerry.create({
  baseURL: "https://service.example.internal",
  headers: {
    "User-Agent": "jerry-example/0.1.0",
  },
});

async function main(): Promise<void> {
  const response = await client.get<Healthcheck>("/health");
  console.log(response.status, response.data.version);
}

void main();

