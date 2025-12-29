import { handleSearchPapers } from "./routes/search";
import { handleExtractTopic } from "./routes/topic";
import { handleProcessPapers } from "./routes/process";
import { handleGenerate } from "./routes/generate";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

const server = Bun.serve({
  port: 3001,
  routes: {
    "/topic": {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async (req) => {
        console.log("POST /topic hit");
        const response = await handleExtractTopic(req);
        return addCorsHeaders(response);
      },
    },
    "/search": {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async (req) => {
        const response = await handleSearchPapers(req);
        return addCorsHeaders(response);
      },
    },
    "/process": {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async (req) => {
        const response = await handleProcessPapers(req);
        return addCorsHeaders(response);
      },
    },
    "/generate": {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async (req) => {
        const response = await handleGenerate(req);
        return addCorsHeaders(response);
      },
    },
  },

  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);