const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;

const server = http.createServer();

const wss = new WebSocketServer({
    server
});

// Temporary server-side balances
const players = new Map();

wss.on("connection", (socket) => {

    console.log("Player connected!");

    // Give this connection a temporary player ID
    const playerId = Math.random().toString(36).slice(2);

    players.set(playerId, {
        balance: 200
    });

    socket.send(JSON.stringify({
        type: "welcome",
        message: "Connected to FoxBet server 🦊"
    }));

    // Send balance to client
    socket.send(JSON.stringify({
        type: "balance",
        balance: players.get(playerId).balance
    }));

    socket.on("message", (data) => {

        console.log("Received:", data.toString());

    });

    socket.on("close", () => {

        players.delete(playerId);

        console.log("Player disconnected.");

    });

});

server.listen(PORT, "0.0.0.0", () => {

    console.log(`FoxBet server running on port ${PORT}`);

});
