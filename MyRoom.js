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
  // ✅ STORE CUSTOM ROOM NAME
  customRoomName = "";

  onCreate(options) {
    this.setState(new MyRoomState());

    // ✅ SAVE THE CUSTOM ROOM NAME
    this.customRoomName = options.customRoomName || "default";

    // ✅ SET AS METADATA SO WE CAN QUERY IT
    this.setMetadata({ customRoomName: this.customRoomName });

    console.log(`✓ Room created with custom name: "${this.customRoomName}"`);
    console.log(`  Colyseus Room ID: ${this.roomId}`);

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
    console.log(
      `✓ ${options.name || client.sessionId} joined room: "${
        this.customRoomName
      }"`
    );

    // Create new player
    const player = new Player();
    player.x = 0;
    player.y = 0;
    player.z = 0;
    player.name = options.name || "Player";

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client, consented) {
    console.log(`✗ ${client.sessionId} left room: "${this.customRoomName}"`);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log(`Room disposed: "${this.customRoomName}"`);
  }
}

exports.MyRoom = MyRoom;
