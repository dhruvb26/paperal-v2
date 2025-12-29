import { handleSearchPapers } from "./routes/search";
import { handleExtractTopic } from "./routes/topic";
import { handleProcessPapers } from "./routes/process";

const server = Bun.serve({
  port: 3001,
  routes: {
    "/topic": {
      POST: (req) => {
        console.log("POST /topic hit");
        return handleExtractTopic(req);
      },
    },
    "/search": {
        POST: (req) => {
            return handleSearchPapers(req);
        },
    },
    "/process": {
        POST: (req) => {
            return handleProcessPapers(req);
        },
    },
  },

  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);