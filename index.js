const { Server } = require("colyseus");
const { createServer } = require("http");
const express = require("express");
const { monitor } = require("@colyseus/monitor");
const cors = require("cors");

const app = express();

// Enable CORS for all origins (you can restrict this later)
app.use(cors());
app.use(express.json());

const gameServer = new Server({
  server: createServer(app),
});

// Monitor panel
app.use("/colyseus", monitor());

// Import your room
const { MyRoom } = require("./MyRoom");

// Define your room
gameServer.define("my_room", MyRoom);

// Use environment PORT for Render, fallback to 2567 for local
const PORT = process.env.PORT || 2567;

gameServer.listen(PORT);
console.log(`Server started on port ${PORT}`);
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log(`Monitor available at /colyseus`);
