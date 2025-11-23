// myroom.js
// Colyseus room implementation ensuring schema property order matches client C# schema.
// Important: client and server schema must have the same fields in the same order.

const { Room } = require("colyseus");
const { Schema, MapSchema, type } = require("@colyseus/schema");

// Player Schema - fields declared in the same order as the C# client schema:
// x, y, z, rotY, rotX, rotZ, name, skinId
class Player extends Schema {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
        this.z = 0;

        // rotation placeholders (keep them so the schema index alignment matches client)
        this.rotY = 0;
        this.rotX = 0;
        this.rotZ = 0;

        this.name = "Player";
        this.skinId = 0;
    }
}

// Make sure to declare the types in the same logical order as the fields above.
type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "z");

type("number")(Player.prototype, "rotY");
type("number")(Player.prototype, "rotX");
type("number")(Player.prototype, "rotZ");

type("string")(Player.prototype, "name");
type("number")(Player.prototype, "skinId");

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
    onCreate(options) {
        this.setState(new MyRoomState());
        console.log("Room created!");

        // Handle position updates from clients
        this.onMessage("updatePosition", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = message.x;
                player.y = message.y;
                player.z = message.z;
            }
        });

        // Handle skin change requests from clients
        this.onMessage("changeSkin", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player && typeof message.skinId === "number") {
                console.log(`📥 Received changeSkin from ${client.sessionId}: ${message.skinId}`);

                // Update authoritative state
                player.skinId = message.skinId;
                console.log(`✅ ${client.sessionId} changed skin to: ${message.skinId}`);

                // Broadcast AFTER the state patch is applied so clients see the state first
                this.broadcast("skinChanged", {
                    playerId: client.sessionId,
                    skinId: message.skinId
                }, { afterNextPatch: true });

                console.log(`📡 Broadcasted skin change to all clients (afterNextPatch)`);
            } else {
                console.log(`❌ Invalid skin change request from ${client.sessionId}:`, message);
            }
        });
    }

    onJoin(client, options) {
        console.log(client.sessionId, "joined! options:", options);

        const player = new Player();
        player.x = 0;
        player.y = 0;
        player.z = 0;

        // rotation defaults (keep in schema to preserve index mapping)
        player.rotY = 0;
        player.rotX = 0;
        player.rotZ = 0;

        player.name = options.name || "Player";

        const provided = typeof options.skinId === "number";
        player.skinId = provided ? options.skinId : Math.floor(Math.random() * 5);

        console.log(`Assigned skin ${player.skinId} to ${client.sessionId}`);

        // Add to authoritative state
        this.state.players.set(client.sessionId, player);

        // Broadcast initial skin AFTER the state patch so clients receive the player in state first.
        this.broadcast("skinChanged", {
            playerId: client.sessionId,
            skinId: player.skinId
        }, { afterNextPatch: true });

        console.log(`📡 Broadcasted initial skin ${player.skinId} for ${client.sessionId} (afterNextPatch)`);
    }

    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        console.log("Room disposed!");
    }
}

exports.MyRoom = MyRoom;