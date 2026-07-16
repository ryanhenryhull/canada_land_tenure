import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. API proxy to bypass CORS on cloud storage buckets
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).send("Missing 'url' query parameter.");
    }

    try {
      const headers: Record<string, string> = {};
      
      // Forward Range request headers for COGs and PMTiles
      if (req.headers.range) {
        headers["range"] = req.headers.range;
      }
      if (req.headers["if-range"]) {
        headers["if-range"] = req.headers["if-range"] as string;
      }

      const response = await fetch(targetUrl, { headers });

      // Forward response headers back to the browser
      res.status(response.status);
      
      const copyHeaders = [
        "content-type",
        "content-range",
        "accept-ranges",
        "content-length",
        "etag",
        "last-modified",
        "cache-control"
      ];

      copyHeaders.forEach(h => {
        const val = response.headers.get(h);
        if (val) {
          res.setHeader(h, val);
        }
      });

      // Enable CORS on the proxied response so client can access it
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.setHeader("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");

      // Handle OPTIONS preflight request
      if (req.method === "OPTIONS") {
        return res.status(200).end();
      }

      // Stream body chunks to the client
      if (response.body) {
        const reader = response.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      }
      res.end();
    } catch (err: any) {
      console.error(`Proxy failed for ${targetUrl}:`, err);
      res.status(500).send(`Proxy Error: ${err.message}`);
    }
  });

  // 2. Vite Integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite dev middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
