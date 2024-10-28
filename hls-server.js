const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const findRemoveSync = require("find-remove");
const PORT = 9000;
const app = express();

// Set the path for ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Create HTTP server
http
  .createServer(function (request, response) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS, POST, GET",
      "Access-Control-Max-Age": 2592000, // 30 days
    };

    // Handle OPTIONS preflight requests
    if (request.method === "OPTIONS") {
      response.writeHead(204, headers);
      response.end();
      return;
    }

    // Resolve the file path
    const filePath = "./libs" + request.url;
    const videoFolderPath = path.join(__dirname, "outputVideo");

    // Check if the request is for a video file in the ./outputVideo directory
    if (request.url.startsWith("/video")) {
      const videoFilePath = path.join(videoFolderPath, path.basename(request.url));

      // Check if the video file exists
      if (fs.existsSync(videoFilePath)) {
        const stat = fs.statSync(videoFilePath);
        const fileSize = stat.size;
        const range = request.headers.range;

        if (range) {
          // Handle partial content requests for streaming
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = end - start + 1;
          const file = fs.createReadStream(videoFilePath, { start, end });

          const videoHeaders = {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/mp4",
            ...headers,
          };

          response.writeHead(206, videoHeaders);
          file.pipe(response);
        } else {
          // Serve the whole file
          const videoHeaders = {
            "Content-Length": fileSize,
            "Content-Type": "video/mp4",
            ...headers,
          };
          response.writeHead(200, videoHeaders);
          fs.createReadStream(videoFilePath).pipe(response);
        }
        return;
      } else {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.end("Video file not found");
        return;
      }
    }

    // Handle .ts files and other static files
    if (filePath === path.join(__dirname, "libs", "index.ts")) {
      // Remove .ts files older than 30 seconds
      var result = findRemoveSync("./libs", {
        age: { seconds: 30 },
        extensions: ".ts",
      });
      console.log("Removed files:", result);
    }

    // Fallback to reading other files
    fs.readFile(filePath, function (error, content) {
      if (error) {
        if (error.code === "ENOENT") {
          fs.readFile("./404.html", function (error404, content404) {
            response.writeHead(404, {
              "Content-Type": "text/html",
              ...headers,
            });
            response.end(content404, "utf-8");
          });
        } else {
          response.writeHead(500, { ...headers });
          response.end(
            `Sorry, check with the site admin for error: ${error.code} ..\n`
          );
        }
      } else {
        response.writeHead(200, { "Content-Type": "text/html", ...headers });
        response.end(content, "utf-8");
      }
    });
  })
  .listen(PORT);

console.log(`Server listening on PORT ${PORT}`);
