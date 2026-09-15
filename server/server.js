const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;

const server = http.createServer();

const wss = new WebSocketServer({
    server
});

wss.on("connection", (socket) => {

    console.log("Player connected!");

    socket.send(JSON.stringify({
        type: "welcome",
        message: "Connected to FoxBet server 🦊"
    }));

    socket.on("message", (data) => {

        console.log("Received:", data.toString());

    });

    socket.on("close", () => {

        console.log("Player disconnected.");

    });

});

server.listen(PORT, "0.0.0.0", () => {

    console.log(`FoxBet server running on port ${PORT}`);

});
