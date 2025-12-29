type ProcessRequest = {
    urls: string[];
  };
  
  type ProcessResponse = {
    message: string;
  };
  
  type APIResponse<T> = {
    success: boolean;
    data: T | null;
    error: string | null;
  };
  
  export async function handleProcessPapers(req: Request): Promise<Response> {
    try {
      const body = (await req.json()) as ProcessRequest;
  
      if (!body.urls || body.urls.length === 0) {
        return Response.json(
          {
            success: false,
            data: null,
            error: "URL list cannot be empty",
          } satisfies APIResponse<null>,
          { status: 400 }
        );
      }
  
      console.log(`Processing ${body.urls.length} URLs.`);
  
      return Response.json(
        {
          success: true,
          data: {
            message: "Processing started in background",
          },
          error: null,
        } satisfies APIResponse<ProcessResponse>,
        { status: 202 }
      );
    } catch (error) {
      console.error("Error in process_papers:", error);
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