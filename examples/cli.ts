import jerry from "../src";

interface SearchResult {
  total_count: number;
  items: Array<{ full_name: string }>;
}

async function main(): Promise<void> {
  const query = process.argv[2] ?? "typescript";

  const data = await jerry.get<SearchResult>("https://api.github.com/search/repositories", {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "jerry-cli-example",
    },
    params: { q: query, per_page: 3 },
    responseMode: "data",
  });

  for (const item of data.items) {
    console.log(item.full_name);
  }
}

void main();

