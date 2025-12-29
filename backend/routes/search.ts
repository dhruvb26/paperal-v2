import { querySonar } from "../utils/sonar_helper";
import { queryTavily } from "../utils/tavily_helper";
import { queryScholar } from "../utils/scholar_helper";
import { processUrl } from "../utils/matching";

type SearchRequest = {
  topic: string;
};

type SearchResponse = {
  urls: string[];
};

type APIResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export async function handleSearchPapers(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as SearchRequest;

    if (!body.topic?.trim()) {
      return Response.json(
        {
          success: false,
          data: null,
          error: "Topic cannot be empty",
        } satisfies APIResponse<null>,
        { status: 400 }
      );
    }

    try {
      const sonarQuery = `
        Find academic papers about ${body.topic}. 
        
        Format the response as a structured list of papers.
      `;

      const tavilyQuery = `academic research papers on ${body.topic} filetype:pdf`;
      const scholarQuery = `${body.topic} filetype:pdf`;

      const [sonarResults, tavilyResults, scholarResults] = await Promise.all([
        querySonar(sonarQuery),
        queryTavily(tavilyQuery, 5),
        queryScholar(scholarQuery, 5),
      ]);

      const allUrls = [
        ...sonarResults.urls,
        ...tavilyResults,
        ...scholarResults,
      ];

      const processedUrls: string[] = [];

      for (const url of allUrls) {
        const processed = await processUrl(url);
        if (processed) {
          processedUrls.push(processed);
        }
      }

      if (processedUrls.length === 0) {
        return Response.json(
          {
            success: false,
            data: null,
            error: "No papers found for the given topic",
          } satisfies APIResponse<null>,
          { status: 404 }
        );
      }

      return Response.json(
        {
          success: true,
          data: { urls: processedUrls },
          error: null,
        } satisfies APIResponse<SearchResponse>,
        { status: 200 }
      );
    } catch (error) {
      console.error("Error in paper search flow:", error);
      return Response.json(
        {
          success: false,
          data: null,
          error: "Failed to execute paper search flow",
        } satisfies APIResponse<null>,
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Error in search_papers:", error);
    return Response.json(
      {
        success: false,
        data: null,
        error: "An internal server error occurred",
      } satisfies APIResponse<null>,
      { status: 500 }
    );
  }
}