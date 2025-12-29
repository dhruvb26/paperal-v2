import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { query as pineconeQuery } from "../utils/pinecone.ts";

const vectorSearchSchema = z.object({
  query: z.string().describe("The search query to find relevant papers"),
});

type VectorSearchResult = {
  query: string;
  results: unknown;
};

export const vectorSearchTool = tool(
  async ({ query }): Promise<VectorSearchResult> => {
    const response = await pineconeQuery("library", query);

    return {
      query,
      results: response,
    };
  },
  {
    name: "vector_search",
    description:
      "Useful for searching through research papers to find relevant citations and content",
    schema: vectorSearchSchema,
  }
);