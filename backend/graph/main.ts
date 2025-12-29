import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { MessagesAnnotation, StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { vectorSearchTool } from "./vectorSearch.ts";
import { Annotation } from "@langchain/langgraph";

const GraphState = Annotation.Root({
  messages: MessagesAnnotation.spec.messages,
  checkRelevance: Annotation<"generate_with_rag" | "generate_normal" | null>({
    default: () => null,
    reducer: (_, newVal) => newVal,
  }),
});


const responseModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
});

const graderModel = new ChatOpenAI({
  model: "gpt-4.1",
  temperature: 0,
});

const GRADE_PROMPT = `You are a grader assessing relevance of a retrieved text chunks to the previous sentences written so far in a research paper draft.
Here are the retrieved text chunks:

{context}

Here are the previous sentences: {question}
Give a binary score 'yes' or 'no' score to indicate whether the text chunks are relevant.`;

const GradeDocumentsSchema = z.object({
  binaryScore: z.enum(["yes", "no"]).describe("Whether the documents are relevant"),
});

type CitationInfo = {
  file_url?: string;
  citation?: string;
  context?: string;
} | null;

type StructuredResponse = {
  content: string;
  citation?: CitationInfo;
};

function assertEnvVar(key: string): void {
  if (!process.env[key]) {
    throw new Error(`${key} environment variable is not set`);
  }
}

assertEnvVar("GOOGLE_API_KEY");
assertEnvVar("OPENAI_API_KEY");

function serializeToolResult(result: unknown): string {
  return JSON.stringify(result);
}

function formatStructuredResponse(content: string, citationInfo?: CitationInfo): StructuredResponse {
  return {
    content,
    ...(citationInfo && { citation: citationInfo }),
  };
}

async function generateQuestionForRag(content: string): Promise<string> {
  const messages = [
    new SystemMessage(
      "You are an academic writing assistant that generates search queries for vector search. Given the previous 2-3 sentences from a research paper draft, generate a specific question that will help find relevant chunks of text to continue the academic writing. Only return the question itself."
    ),
    new HumanMessage(content),
  ];
  const response = await responseModel.invoke(messages);
  return response.content as string;
}

async function evaluateRagNecessity(content: string): Promise<boolean> {
  const messages = [
    new SystemMessage(`You are an academic writing assistant that determines if the next sentence needs citation.
Analyze the previous 2-3 sentences and determine if the next sentence should include a citation to support the ongoing discussion.
Return 'true' if the next sentence would benefit from citing relevant research papers.
Return 'false' if the next sentence can continue the flow without specific citations.
Only return 'true' or 'false' without any other text.`),
    new HumanMessage(content),
  ];
  const response = await responseModel.invoke(messages);
  return (response.content as string).toLowerCase().trim() === "true";
}

async function executeToolCall(toolCall: {
  function: { name: string; arguments: string };
}): Promise<unknown | null> {
  const toolName = toolCall.function.name;
  const toolArgs = JSON.parse(toolCall.function.arguments) as { query: string };

  if (toolName === "vector_search") {
    return vectorSearchTool.invoke(toolArgs);
  }
  return null;
}

async function retrieveRelevantDocuments(state: typeof MessagesAnnotation.State) {
  const content = state.messages[0]?.content as string;
  const searchQuery = await generateQuestionForRag(content);

  const modelWithTools = responseModel.bindTools([vectorSearchTool]);
  const initialResponse = await modelWithTools.invoke([
    new SystemMessage("Use the vector_search tool with the given query."),
    new HumanMessage(`Using the following search query: '${searchQuery}`),
  ]);

  const retrievedDocuments: string[] = [];
  const toolCalls = initialResponse.tool_calls;

  if (toolCalls && toolCalls.length > 0) {
    for (const toolCall of toolCalls) {
      const toolResult = await executeToolCall({
        function: { name: toolCall.name, arguments: JSON.stringify(toolCall.args) },
      });
      if (toolResult) {
        retrievedDocuments.push(serializeToolResult(toolResult));
      }
    }

    const retrievedContext = JSON.stringify(retrievedDocuments);

    return {
      messages: [
        ...state.messages,
        new ToolMessage({
          content: retrievedContext,
          name: "vector_search",
          tool_call_id: toolCalls[0]?.id ?? "tool_call",
        }),
      ],
    };
  }

  return {
    messages: [
      ...state.messages,
      new ToolMessage({
        content: "No relevant documents found.",
        name: "vector_search",
        tool_call_id: "no_results",
      }),
    ],
  };
}

async function generateResponseWithRag(state: typeof MessagesAnnotation.State) {
  const previousSentences = state.messages[0]?.content as string;
  const toolMessage = state.messages[state.messages.length - 1];

  if (!(toolMessage instanceof ToolMessage) || toolMessage.name !== "vector_search") {
    return {
      messages: [...state.messages, new AIMessage("Error: Invalid message sequence")],
    };
  }

  const retrievedContext = toolMessage.content as string;
  let citationInfo: CitationInfo = null;

  try {
    const contextData = JSON.parse(retrievedContext);
    if (Array.isArray(contextData) && contextData.length > 0) {
      const doc = contextData[0];
      const results = doc?.results ?? [];
      const firstHit = results[0];
      if (firstHit && typeof firstHit === "object") {
        const fields = firstHit.fields ?? {};
        citationInfo = {
          file_url: fields.file_url,
          citation: fields.citation,
          context: fields.text,
        };
      }
    }
  } catch {
    citationInfo = null;
  }

  const messages = [
    new SystemMessage(`You are an academic writing assistant.
Generate ONLY the next single sentence that continues the academic writing based on the previous sentences.
Use the information from the retrieved documents to craft a well-cited sentence.
Your sentence should maintain the academic tone and flow naturally from the previous sentences.
Do not include any form of citation in the final sentence.
Generate ONLY ONE sentence - do not write an entire paragraph or multiple sentences.`),
    new HumanMessage(
      `PREVIOUS SENTENCES: ${previousSentences}\n\nRETRIEVED DOCUMENTS:\n${retrievedContext}`
    ),
  ];

  const response = await responseModel.invoke(messages);
  const structuredResponse = formatStructuredResponse(response.content as string, citationInfo);

  return {
    messages: [...state.messages, new AIMessage(JSON.stringify(structuredResponse))],
  };
}

async function generateNormalResponse(state: typeof MessagesAnnotation.State) {
  const previousSentences = state.messages[0]?.content as string;

  const response = await responseModel.invoke([
    new SystemMessage(`You are an academic writing assistant.
Generate ONLY the next single sentence that continues the academic writing based on the previous sentences.
Your sentence should maintain the academic tone and flow naturally from the previous sentences.
Generate ONLY ONE sentence - do not write an entire paragraph or multiple sentences.`),
    new HumanMessage(previousSentences),
  ]);

  const structuredResponse = formatStructuredResponse(response.content as string);

  return {
    messages: [...state.messages, new AIMessage(JSON.stringify(structuredResponse))],
  };
}

async function checkRelevance(
  state: typeof MessagesAnnotation.State
): Promise<{ checkRelevance: "generate_with_rag" | "generate_normal" }> {
  const previousSentences = state.messages[0]?.content as string;
  const toolMessage = state.messages[state.messages.length - 1];

  if (!(toolMessage instanceof ToolMessage) || toolMessage.name !== "vector_search") {
    return { checkRelevance: "generate_normal" };
  }

  const retrievedContext = toolMessage.content as string;
  if (retrievedContext === "No relevant documents found.") {
    return { checkRelevance: "generate_normal" };
  }

  const prompt = GRADE_PROMPT.replace("{question}", previousSentences).replace(
    "{context}",
    retrievedContext
  );

  const structuredGrader = graderModel.withStructuredOutput(GradeDocumentsSchema);
  const response = await structuredGrader.invoke([new HumanMessage(prompt)]);

  if (response.binaryScore === "yes") {
    return { checkRelevance: "generate_with_rag" };
  }
  return { checkRelevance: "generate_normal" };
}

type PaperState = typeof MessagesAnnotation.State & {
  paperContent: string;
};

async function generateQueryOrRespond(state: PaperState) {
  const content = state.paperContent;

  let response;

  if (await evaluateRagNecessity(content)) {
    const searchQuery = await generateQuestionForRag(content);

    const modelWithTools = responseModel.bindTools([vectorSearchTool]);
    const initialResponse = await modelWithTools.invoke([
      new SystemMessage(
        "You are a helpful research assistant. Use the vector_search tool to find relevant papers and incorporate them into your response."
      ),
      new HumanMessage(
        `Using the following search query: '${searchQuery}', find relevant papers to help answer: ${content}`
      ),
    ]);

    const retrievedDocuments: string[] = [];
    const toolCalls = initialResponse.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const toolResult = await executeToolCall({
          function: { name: toolCall.name, arguments: JSON.stringify(toolCall.args) },
        });
        if (toolResult) {
          retrievedDocuments.push(serializeToolResult(toolResult));
        }
      }

      const retrievedContext = retrievedDocuments.join("\n\n--- DOCUMENT SEPARATOR ---\n\n");

      const messages = [
        new SystemMessage(`You are a helpful research assistant.
You MUST use the information from the retrieved documents to answer the user's question.
Base your response primarily on the provided documents.
Include specific citations and references to the retrieved content.
Be accurate and comprehensive in using the retrieved information.`),
        new HumanMessage(`QUESTION: ${content}\n\nRETRIEVED DOCUMENTS:\n${retrievedContext}`),
      ];

      response = await responseModel.invoke(messages);
    } else {
      response = await responseModel.invoke([
        new SystemMessage(
          "You are a helpful research assistant. Provide a general response without specific citations."
        ),
        new HumanMessage(content),
      ]);
    }
  } else {
    response = await responseModel.invoke([
      new SystemMessage(
        "You are a helpful research assistant. Provide a general response without specific citations."
      ),
      new HumanMessage(content),
    ]);
  }

  return { messages: [response] };
}

export async function buildRagGraph(saveGraph: boolean = false) {
    const workflow = new StateGraph(GraphState)
      .addNode("retrieve_documents", retrieveRelevantDocuments)
      .addNode("check_relevance", checkRelevance)
      .addNode("generate_with_rag", generateResponseWithRag)
      .addNode("generate_normal", generateNormalResponse)
      .addEdge("__start__", "retrieve_documents")
      .addEdge("retrieve_documents", "check_relevance")
      .addConditionalEdges("check_relevance", (state) => {
        return state.checkRelevance ?? "generate_normal";
      })
      .addEdge("generate_with_rag", END)
      .addEdge("generate_normal", END);

  const graph = workflow.compile();

  if (saveGraph) {
    const graphPng = await graph.getGraph().drawMermaidPng();
    await Bun.write("sample/graph.png", graphPng);
  }

  return graph;
}

export async function queryGraph(query: string): Promise<string> {
  const workflow = await buildRagGraph();
  const result = await workflow.invoke({ messages: [new HumanMessage(query)] });
  const lastMessage = result.messages[result.messages.length - 1];
  return lastMessage?.content as string;
}

export { generateQueryOrRespond, vectorSearchTool };
