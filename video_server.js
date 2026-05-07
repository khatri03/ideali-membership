const http = require("http");
const fs = require("fs");
const path = require("path");

const videoPath = process.argv[2];
const port = Number(process.argv[3] || 4173);

if (!videoPath || !fs.existsSync(videoPath)) {
  console.error("Video not found:", videoPath);
  process.exit(1);
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function sendHtml(res, body) {
  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function serveVideo(req, res) {
  const stat = fs.statSync(videoPath);
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      "Content-Type": "video/mp4",
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(videoPath).pipe(res);
    return;
  }

  const match = /bytes=(\d+)-(\d*)/.exec(range);
  if (!match) {
    res.writeHead(416, {
      "Content-Range": `bytes */${stat.size}`,
    });
    res.end();
    return;
  }

  const start = Number(match[1]);
  const end = match[2] ? Number(match[2]) : Math.min(start + 1024 * 1024, stat.size - 1);
  const chunkSize = end - start + 1;

  res.writeHead(206, {
    "Content-Range": `bytes ${start}-${end}/${stat.size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": "video/mp4",
    "Cache-Control": "no-store",
  });

  fs.createReadStream(videoPath, { start, end }).pipe(res);
}

const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Video Inspector</title>
  <style>
    body { margin: 0; background: #0f172a; color: white; font-family: system-ui, sans-serif; }
    .wrap { display: grid; place-items: center; min-height: 100vh; }
    video { width: min(96vw, 1280px); max-height: 92vh; background: black; }
  </style>
</head>
<body>
  <div class="wrap">
    <video id="v" controls autoplay muted src="/video.mp4"></video>
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === "/") {
    return sendHtml(res, html);
  }

  if (req.url && req.url.startsWith("/video.mp4")) {
    return serveVideo(req, res);
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Video inspector listening on http://127.0.0.1:${port}`);
});
