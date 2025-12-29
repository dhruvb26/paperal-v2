import { queryGraph } from "../graph/main";

type GraphQueryRequest = {
  query: string;
};

type GraphQueryResponse = {
  response: {
    text: string;
    is_referenced: boolean;
    href: string | null;
    citations?: {
      'in-text': string;
    };
    context?: string;
  };
};

type APIResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

export async function handleGenerate(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as GraphQueryRequest;

    if (!body.query?.trim()) {
      return Response.json(
        {
          success: false,
          data: null,
          error: "Query cannot be empty",
        } satisfies APIResponse<null>,
        { status: 400 }
      );
    }

    try {
      const result = await queryGraph(body.query);

      if (!result) {
        return Response.json(
          {
            success: false,
            data: null,
            error: "No response generated from the graph",
          } satisfies APIResponse<null>,
          { status: 404 }
        );
      }

      // Parse the result from the graph
      const parsedResult = JSON.parse(result);
      
      // Transform to match frontend expectations
      const formattedResponse = {
        text: parsedResult.content || "",
        is_referenced: !!parsedResult.citation,
        href: parsedResult.citation?.file_url || null,
        citations: parsedResult.citation?.citation 
          ? { 'in-text': parsedResult.citation.citation }
          : undefined,
        context: parsedResult.citation?.context || undefined,
      };

      return Response.json(
        {
          success: true,
          data: { response: formattedResponse },
          error: null,
        } satisfies APIResponse<GraphQueryResponse>,
        { status: 200 }
      );
    } catch (error) {
      console.error("Error in graph query flow:", error);
      return Response.json(
        {
          success: false,
          data: null,
          error: "Failed to execute graph query flow",
        } satisfies APIResponse<null>,
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Error in query_graph_route:", error);
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