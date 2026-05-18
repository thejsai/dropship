const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { searchProducts, getProviderStatus } = require("./src/providers");

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": MIME_TYPES[".json"] });
  res.end(JSON.stringify(payload, null, 2));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (error, buffer) => {
    if (error) {
      sendJson(res, 404, { error: "File not found" });
      return;
    }

    res.writeHead(200, { "Content-Type": mimeType });
    res.end(buffer);
  });
}

function resolvePublicPath(requestPath) {
  const normalizedPath = requestPath === "/" ? "/index.html" : requestPath;
  const requestedPath = path.normalize(path.join(PUBLIC_DIR, normalizedPath));

  if (!requestedPath.startsWith(PUBLIC_DIR)) {
    return null;
  }

  return requestedPath;
}

async function requestHandler(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === "/api/health") {
    sendJson(res, 200, {
      status: "ok",
      checkedAt: new Date().toISOString(),
      provider: getProviderStatus()
    });
    return;
  }

  if (requestUrl.pathname === "/api/search") {
    const query = requestUrl.searchParams.get("q");
    const source = requestUrl.searchParams.get("source") || "auto";
    const marketplace = requestUrl.searchParams.get("marketplace") || "US";

    if (!query || query.trim().length < 2) {
      sendJson(res, 400, {
        error: "Query must be at least 2 characters"
      });
      return;
    }

    try {
      const response = await searchProducts({
        query: query.trim(),
        source,
        marketplace
      });
      sendJson(res, 200, response);
    } catch (error) {
      sendJson(res, 500, {
        error: "Search failed",
        details: error.message
      });
    }
    return;
  }

  const filePath = resolvePublicPath(requestUrl.pathname);

  if (!filePath) {
    sendJson(res, 403, { error: "Forbidden" });
    return;
  }

  sendFile(res, filePath);
}

function createServer() {
  return http.createServer((req, res) => {
    requestHandler(req, res).catch((error) => {
      sendJson(res, 500, {
        error: "Unexpected server error",
        details: error.message
      });
    });
  });
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`Dropship Scout Lite running at http://localhost:${PORT}`);
  });
}

module.exports = { createServer };
