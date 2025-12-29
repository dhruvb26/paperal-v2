import * as cheerio from "cheerio";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function queryScholar(
  query: string | string[],
  maxResults: number = 10
): Promise<string[]> {
  const searchQuery = Array.isArray(query) ? query.join(" ") : query;
  const encodedQuery = encodeURIComponent(searchQuery);

  const numPages = Math.ceil(maxResults / 10);
  const allUrls: string[] = [];

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  };

  for (let page = 0; page < numPages; page++) {
    const url = `https://scholar.google.com/scholar?start=${page * 10}&q=${encodedQuery}&hl=en&as_sdt=0,5`;

    try {
      await sleep(2000);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      $("div.gs_ri").each((_, element) => {
        const linkElem = $(element).find("a").first();
        const href = linkElem.attr("href");

        if (href) {
          allUrls.push(href);
        }

        if (allUrls.length >= maxResults) {
          return false;
        }
      });

      if (allUrls.length >= maxResults) {
        return allUrls.slice(0, maxResults);
      }
    } catch (error) {
      console.error("Error fetching results from Google Scholar:", error);
      break;
    }
  }

  return allUrls;
}