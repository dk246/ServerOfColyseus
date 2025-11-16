const { Server } = require("colyseus");
const { createServer } = require("http");
const express = require("express");
const { monitor } = require("@colyseus/monitor");
const cors = require("cors");

const app = express();

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Add root route to show server is running
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Colyseus Server</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f0f0f0;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #4CAF50; }
          a {
            display: inline-block;
            margin-top: 20px;
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 5px;
          }
          a:hover { background: #45a049; }
          .status { color: #4CAF50; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎮 Colyseus Multiplayer Server</h1>
          <p class="status">✅ Server is running!</p>
          <p><strong>WebSocket URL:</strong> wss://serverofcolyseus-production-c543.up.railway.app</p>
          <p><strong>Available Rooms:</strong> my_room</p>
          <a href="/colyseus">View Monitor Dashboard →</a>
        </div>
      </body>
    </html>
  `);
});

const gameServer = new Server({
  server: createServer(app),
});

// Monitor panel
app.use("/colyseus", monitor());

// Import your room
const { MyRoom } = require("./MyRoom");

// Define your room
gameServer.define("my_room", MyRoom);

// Use environment PORT for Railway
const PORT = process.env.PORT || 2567;

gameServer.listen(PORT);
console.log(`Server started on port ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`Monitor available at /colyseus`);
