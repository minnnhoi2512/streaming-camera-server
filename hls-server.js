const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

const PORT = 4000;
const app = express();

// Set the path for ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Create HTTP server
http.createServer(function (request, response) {
    // console.log('Request starting...', new Date());

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
        'Access-Control-Max-Age': 2592000, // 30 days
    };

    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
        response.writeHead(204, headers);
        response.end();
        return;
    }

    const filePath = './libs' + request.url;
    console.log(filePath);

    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code === 'ENOENT') {
                fs.readFile('./404.html', function (error404, content404) {
                    response.writeHead(404, { 'Content-Type': 'text/html', ...headers });
                    response.end(content404, 'utf-8');
                });
            } else {
                response.writeHead(500, { ...headers });
                response.end(`Sorry, check with the site admin for error: ${error.code} ..\n`);
            }
        } else {
            response.writeHead(200, { 'Content-Type': 'text/html', ...headers });
            response.end(content, 'utf-8');
        }
    });
}).listen(PORT);

console.log(`Server listening on PORT ${PORT}`);
