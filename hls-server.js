const express = require("express");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const findRemoveSync = require("find-remove");
const dotenv = require("dotenv");
const PORT = 9000;
const app = express();

// Load environment variables from .env file
dotenv.config();

// Set the path for ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Middleware to handle CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
  res.header("Access-Control-Max-Age", 2592000); // 30 days
  next();
});

// Handle OPTIONS preflight requests
app.options("*", (req, res) => {
  res.sendStatus(204);
});

// Function to capture the latest image from RTSP stream
function captureLatestImage(rtspUrl, outputDir, callback) {
  const outputPath = path.join(outputDir, 'latest.jpg');

  ffmpeg(rtspUrl)
    .frames(1)
    .output(outputPath)
    .on('start', (commandLine) => {
      console.log('Spawned Ffmpeg with command: ' + commandLine);
    })
    .on('end', () => {
      console.log('Image captured successfully');
      callback(null, outputPath);
    })
    .on('error', (err, stdout, stderr) => {
      console.error('Error capturing image:', err.message);
      console.error('ffmpeg stdout:', stdout);
      console.error('ffmpeg stderr:', stderr);
      callback(err);
    })
    .run();
}

// Route to capture the latest image from RTSP stream for camera 1
app.get("/camera-1/capture-image", (req, res) => {
  const rtspUrl = process.env.CAMERA_RTSP_1; // Replace with your RTSP stream URL
  const outputDir = path.join(__dirname, 'outputImages-camera-1');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  captureLatestImage(rtspUrl, outputDir, (err, imagePath) => {
    if (err) {
      res.status(500).send(`Failed to capture image: ${err.message}`);
    } else {
      res.sendFile(imagePath);
    }
  });
});

// Route to capture the latest image from RTSP stream for camera 2
app.get("/camera-2/capture-image", (req, res) => {
  const rtspUrl = process.env.CAMERA_RTSP_2; // Replace with your RTSP stream URL
  const outputDir = path.join(__dirname, 'outputImages-camera-2');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  captureLatestImage(rtspUrl, outputDir, (err, imagePath) => {
    if (err) {
      res.status(500).send(`Failed to capture image: ${err.message}`);
    } else {
      res.sendFile(imagePath);
    }
  });
});

// Route to serve the index file
app.get(["/", "/index.html"], (req, res) => {
  const indexPath = path.join(__dirname, "outputVideo", "index.html");
  fs.readFile(indexPath, (error, content) => {
    if (error) {
      res.status(500).send(`Error reading index file: ${error.message}`);
    } else {
      res.setHeader("Content-Type", "text/html");
      res.send(content);
    }
  });
});

// Route to handle .ts files and other static files
app.get("/libs/:filename", (req, res) => {
  const filePath = path.join(__dirname, "libs", req.params.filename);

  if (filePath === path.join(__dirname, "libs", "index.ts")) {
    const result = findRemoveSync("./libs", {
      age: { seconds: 30 },
      extensions: ".ts",
    });
    console.log("Removed files:", result);
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        fs.readFile("./404.html", (error404, content404) => {
          res.status(404).send(content404);
        });
      } else {
        res.status(500).send(`Sorry, check with the site admin for error: ${error.code}`);
      }
    } else {
      res.setHeader("Content-Type", "text/html");
      res.send(content);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on PORT ${PORT}`);
});