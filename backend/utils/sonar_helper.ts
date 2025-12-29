interface SonarResponse {
    citations?: string[];
    related_questions?: string[];
  }
  
  interface QueryResult {
    urls: string[];
    related_questions: string[];
  }
  
  export async function querySonar(query: string): Promise<QueryResult> {
    const url = "https://api.perplexity.ai/chat/completions";
  
    const payload = {
      response_format: {
        type: "json_schema",
        json_schema: {
          schema: { type: "array", items: { type: "string" } },
        },
      },
      return_related_questions: true,
      model: "sonar",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that helps with finding peer-review papers that are accesible as a pdf on a given topic. Only return the urls of the papers without any other text or markdown formatting.",
        },
        {
          role: "user",
          content: query,
        },
      ],
    };
  
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      console.error(`Sonar API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text().catch(() => "Unable to read error");
      console.error("Sonar error details:", errorText);
      return {
        urls: [],
        related_questions: [],
      };
    }

    try {
      const responseJson = (await response.json()) as SonarResponse;
      
      return {
        urls: responseJson.citations ?? [],
        related_questions: responseJson.related_questions ?? [],
      };
    } catch (error) {
      console.error("Failed to parse Sonar response as JSON:", error);
      return {
        urls: [],
        related_questions: [],
      };
    }
  }