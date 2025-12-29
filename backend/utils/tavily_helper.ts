interface TavilyResult {
    url: string;
    title?: string;
    content?: string;
    score?: number;
    raw_content?: string;
  }
  
  interface TavilyResponse {
    results: TavilyResult[];
  }
  
  export async function queryTavily(
    query: string | string[],
    maxResults: number = 5
  ): Promise<string[]> {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: Array.isArray(query) ? query.join(" ") : query,
        search_depth: "advanced",
        chunks_per_source: 3,
        max_results: maxResults,
        include_domains: ["arxiv.org"],
      }),
    });
  
    const data = (await response.json()) as TavilyResponse;
  
    return data.results.map((result) => result.url);
  }