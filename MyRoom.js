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

        // Handle position updates
        this.onMessage("updatePosition", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = message.x;
                player.y = message.y;
                player.z = message.z;
            }
        });

        // Handle skin change requests
        this.onMessage("changeSkin", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player && typeof message.skinId === "number") {
                // ✅ IMPORTANT: Assign the new skinId
                player.skinId = message.skinId;
                console.log(`✅ ${client.sessionId} changed skin to: ${message.skinId}`);

                // ✅ FORCE STATE SYNC (sometimes needed)
                this.broadcast("skinChanged", {
                    playerId: client.sessionId,
                    skinId: message.skinId
                });
            } else {
                console.log(`❌ Invalid skin change request from ${client.sessionId}`);
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

        // If client provided a skinId use it; otherwise pick a random one (0..4)
        const provided = typeof options.skinId === "number";
        player.skinId = provided ? options.skinId : Math.floor(Math.random() * 5);

        console.log(`Assigned skin ${player.skinId} to ${client.sessionId}`);

        this.state.players.set(client.sessionId, player);
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