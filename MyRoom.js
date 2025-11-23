// myroom.js
// Colyseus room implementation for player state and skin synchronization.
//
// Key fixes:
// - Use authoritative Schema state (this.state.players) for skinId.
// - Broadcast skinChanged AFTER the state patch is sent to clients ({ afterNextPatch: true })
//   so clients always receive the state (and can spawn the player) before processing the event.

const { Room } = require("colyseus");
const { Schema, MapSchema, type } = require("@colyseus/schema");

// Player Schema
class Player extends Schema {
    constructor() {
        super();
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.name = "Player";
        this.skinId = 0;
    }
}

type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "z");
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

                // Broadcast a friendly event AFTER the state patch is applied to clients,
                // so clients will already have the player entry in their local state when
                // they receive this event.
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