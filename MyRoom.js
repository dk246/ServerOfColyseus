const { Room } = require("colyseus");
const { Schema, MapSchema, type } = require("@colyseus/schema");

// Player Schema
class Player extends Schema {
  constructor() {
    super();
  }
}

type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "z");
type("string")(Player.prototype, "name");

// Room State
class MyRoomState extends Schema {
  constructor() {
    super();
    this.players = new MapSchema();
  }
}

type({ map: Player })(MyRoomState.prototype, "players");

// Room Logic
class MyRoom extends Room {
  // ✅ STORE ROOM NAME
  roomName = "";

  onCreate(options) {
    this.setState(new MyRoomState());

    // ✅ SAVE CUSTOM ROOM NAME
    this.roomName = options.roomName || "default_room";
    this.roomId = this.roomName; // Use room name as ID

    console.log(`Room created with name: ${this.roomName}`);

    // Set max clients (optional)
    this.maxClients = 10;

    // Handle player movement
    this.onMessage("updatePosition", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = message.x;
        player.y = message.y;
        player.z = message.z;
      }
    });
  }

  onJoin(client, options) {
    console.log(`${client.sessionId} joined room: ${this.roomName}`);

    // Create new player with name
    const player = new Player();
    player.x = 0;
    player.y = 0;
    player.z = 0;
    player.name = options.name || "Player";

    this.state.players.set(client.sessionId, player);

    console.log(`Player name: ${player.name}`);
  }

  onLeave(client, consented) {
    console.log(`${client.sessionId} left room: ${this.roomName}`);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log(`Room disposed: ${this.roomName}`);
  }

  // ✅ FILTER: Only allow clients with matching room name
  onAuth(client, options) {
    // This is called before onJoin
    return true; // Allow all for now, we'll filter in server/index.js
  }
}

exports.MyRoom = MyRoom;
