import { extractResearchTopic } from "../utils/gemini_helper";

type QueryRequest = {
  query: string;
};

type TopicMetadata = {
  main_topic: string;
  sub_topics: string[];
  research_question: string;
};

type APIResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

function jsonResponse<T>(data: T, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleExtractTopic(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as QueryRequest;

    if (!body.query?.trim()) {
      const response: APIResponse<null> = {
        success: false,
        data: null,
        error: "Query cannot be empty",
      };
      return jsonResponse(response, 400);
    }

    const topicData = await extractResearchTopic(body.query);

    if (
      !topicData ||
      !topicData.main_topic ||
      !topicData.sub_topics?.length ||
      !topicData.research_question
    ) {
      const response: APIResponse<null> = {
        success: false,
        data: null,
        error: "Failed to extract valid topic information from the query",
      };
      return jsonResponse(response, 422);
    }

    const response: APIResponse<TopicMetadata> = {
      success: true,
      data: topicData,
      error: null,
    };
    return jsonResponse(response, 200);
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.error(`Validation error in extract_topic: ${String(e)}`);
      const response: APIResponse<null> = {
        success: false,
        data: null,
        error: String(e),
      };
      return jsonResponse(response, 400);
    }

    console.error(`Error in extract_topic: ${String(e)}`);
    const response: APIResponse<null> = {
      success: false,
      data: null,
      error: "An internal server error occurred",
    };
    return jsonResponse(response, 500);
  }
}


