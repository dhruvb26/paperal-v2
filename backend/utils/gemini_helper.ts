import { readFileSync } from "fs";

type TopicMetadata = {
  main_topic: string;
  sub_topics: string[];
  research_question: string;
};

type Citation = {
  in_text: string;
};

type DocumentMetadata = {
  title: string;
  description: string;
  year: string;
  authors: string[];
  citations: Citation;
};

type GeminiResponse = {
  candidates?: {
    content: {
      parts: { text: string }[];
    };
  }[];
};

const GEMINI_API_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";

function parseJsonSafely<T>(text: string): T | null {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      return JSON.parse(jsonMatch[1]);
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function readPrompt(
  promptFile: string,
  kwargs: Record<string, string>
): string {
  try {
    let prompt = readFileSync(promptFile, "utf-8");

    for (const [key, value] of Object.entries(kwargs)) {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    }

    return prompt;
  } catch (e) {
    console.error(`Error reading prompt: ${String(e)}`);
    return "";
  }
}

export async function makeGeminiCall(
  prompt: string,
  modelName: string = DEFAULT_MODEL
): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const url = `${GEMINI_API_ENDPOINT}/${modelName}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseJson = (await response.json()) as GeminiResponse;

    const text = responseJson.candidates?.[0]?.content.parts[0]?.text;
    if (text) {
      return text.trim();
    } else {
      throw new Error("No valid response from Gemini API");
    }
  } catch (e) {
    console.error(`Error calling Gemini API: ${String(e)}`);
    return "";
  }
}

export async function extractMetadata(docInfo: string): Promise<DocumentMetadata> {
  try {
    const prompt = `Based on the following document excerpt, extract the title, authors, a short description, year of publication, and create an APA style in-text citation.
Return the information in a valid JSON format with these exact keys: title, description, authors (as list), citations.in_text, year

If you cannot determine any field with high confidence, use null for that field.

Document excerpt:
${docInfo}

Example output format:
{
    "title": "The Impact of AI on Modern Society",
    "description": "The Impact of AI on Modern Society is a paper that discusses the impact of AI on modern society. It is a paper that was published in 2024.",
    "authors": ["Smith, J.", "Jones, K."],
    "citations": {
        "in_text": "(Smith & Jones, 2024)"
    },
    "year": "2024"
}`;

    const responseText = await makeGeminiCall(prompt);

    const metadata = parseJsonSafely<DocumentMetadata>(responseText);
    if (metadata === null) {
      throw new Error("No valid JSON found in response");
    }

    if (
      !("title" in metadata) ||
      !("description" in metadata) ||
      !("authors" in metadata) ||
      !("citations" in metadata) ||
      !("in_text" in metadata.citations)
    ) {
      throw new Error("Missing required fields in Gemini response");
    }

    return metadata;
  } catch (e) {
    console.error(`Error extracting metadata with Gemini: ${String(e)}`);
    return {
      title: "",
      description: "",
      year: "",
      authors: [],
      citations: {
        in_text: "",
      },
    };
  }
}

export async function extractResearchTopic(
  userQuery: string
): Promise<TopicMetadata> {
  try {
    const prompt = `You are a research topic extraction assistant. Your task is to analyze the user's query and extract the main research topic they want to write about
that will also be the title of the research paper. Don't use conjunctions and don't use colons.

Please identify the core research topic and provide it in the following JSON format:

{
    "main_topic": "The primary research topic.",
    "sub_topics": ["List of related sub-topics or aspects to explore"],
    "research_question": "A well-formulated research question based on the topic"
}

User Query: ${userQuery}

Provide only the JSON response without any additional text or explanation.`;

    const responseText = await makeGeminiCall(prompt);

    const topicData = parseJsonSafely<TopicMetadata>(responseText);
    if (topicData === null) {
      throw new Error("No valid JSON found in response");
    }

    if (
      !("main_topic" in topicData) ||
      !("sub_topics" in topicData) ||
      !("research_question" in topicData)
    ) {
      throw new Error("Missing required fields in Gemini response");
    }

    return topicData;
  } catch (e) {
    console.error(`Error extracting research topic with Gemini: ${String(e)}`);
    return {
      main_topic: "",
      sub_topics: [],
      research_question: "",
    };
  }
}
