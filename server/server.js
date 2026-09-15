const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;

const server = http.createServer();

const wss = new WebSocketServer({
    server
});


// =========================
// SYMBOLS
// =========================

const symbols = [
    {
        symbol: "♥️",
        chance: 50,
        multiplier: 0.5
    },
    {
        symbol: "🔥",
        chance: 25,
        multiplier: 1
    },
    {
        symbol: "⭐",
        chance: 15,
        multiplier: 2
    },
    {
        symbol: "🌙",
        chance: 9,
        multiplier: 2.5
    },
    {
        symbol: "🦊",
        chance: 1,
        multiplier: 5
    }
];


// =========================
// WINNING LINES
// =========================

const winningLines = [

    // Horizontal
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    // Vertical
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    // Diagonal
    [0, 4, 8],
    [2, 4, 6]

];


// =========================
// RANDOM SYMBOL
// =========================

function generateSymbol() {

    const roll =
        Math.random() * 100;

    let total = 0;

    for (const item of symbols) {

        total += item.chance;

        if (roll < total) {
            return item.symbol;
        }

    }

    return "♥️";
}


// =========================
// GET SYMBOL DATA
// =========================

function getSymbolData(symbol) {

    return symbols.find(
        item => item.symbol === symbol
    );

}


// =========================
// CONNECTION
// =========================

wss.on("connection", (socket) => {

    console.log("Player connected!");


    // =====================
    // PLAYER
    // =====================

    const player = {

        balance: 200,

        ticket: null

    };


    // =====================
    // WELCOME
    // =====================

    socket.send(JSON.stringify({

        type: "welcome",

        message:
            "Connected to FoxBet server 🦊"

    }));


    // =====================
    // BALANCE
    // =====================

    sendBalance();


    // =========================
    // SEND BALANCE
    // =========================

    function sendBalance() {

        socket.send(JSON.stringify({

            type: "balance",

            balance: player.balance

        }));

    }


    // =========================
    // MESSAGE
    // =========================

    socket.on("message", (rawData) => {

        let data;

        try {

            data =
                JSON.parse(
                    rawData.toString()
                );

        } catch {

            sendError(
                "Invalid message."
            );

            return;
        }


        // =====================
        // BUY TICKET
        // =====================

        if (data.type === "buy_ticket") {

            buyTicket(
                data.bet
            );

            return;
        }


        // =====================
        // REVEAL
        // =====================

        if (data.type === "reveal") {

            revealTile(
                data.index
            );

            return;
        }


        sendError(
            "Unknown request."
        );

    });


    // =========================
    // BUY TICKET
    // =========================

    function buyTicket(bet) {

        bet =
            Number(bet);


        // Valid bet?

        const validBets = [
            2,
            10,
            50,
            100
        ];


        if (!validBets.includes(bet)) {

            sendError(
                "Invalid bet."
            );

            return;
        }


        // Already playing?

        if (player.ticket !== null) {

            sendError(
                "You already have an active ticket."
            );

            return;
        }


        // Enough money?

        if (bet > player.balance) {

            sendError(
                "Not enough FoxCoins."
            );

            return;
        }


        // Take bet

        player.balance -= bet;


        // Create ticket

        player.ticket = {

            bet: bet,

            board: [
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
            ],

            revealed: 0

        };


        console.log(
            `Ticket purchased: ${bet} FC`
        );


        socket.send(JSON.stringify({

            type: "ticket_started",

            balance: player.balance

        }));

    }


    // =========================
    // REVEAL TILE
    // =========================

    function revealTile(index) {

        index =
            Number(index);


        // No ticket

        if (player.ticket === null) {

            sendError(
                "You don't have an active ticket."
            );

            return;
        }


        // Invalid index

        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index > 8
        ) {

            sendError(
                "Invalid tile."
            );

            return;
        }


        // Already revealed

        if (
            player.ticket.board[index] !== null
        ) {

            sendError(
                "That tile is already revealed."
            );

            return;
        }


        // Generate symbol SERVER-SIDE

        const symbol =
            generateSymbol();


        player.ticket.board[index] =
            symbol;

        player.ticket.revealed++;


        // Send only this tile

        socket.send(JSON.stringify({

            type: "reveal",

            index: index,

            symbol: symbol,

            revealed:
                player.ticket.revealed

        }));


        // Finished?

        if (
            player.ticket.revealed === 9
        ) {

            finishTicket();

        }

    }


    // =========================
    // FINISH TICKET
    // =========================

    function finishTicket() {

        const ticket =
            player.ticket;


        const wins = [];


        // =====================
        // CHECK EVERY LINE
        // =====================

        for (
            const line of winningLines
        ) {

            const [a, b, c] =
                line;


            const symbol =
                ticket.board[a];


            if (
                symbol !== null &&
                symbol === ticket.board[b] &&
                symbol === ticket.board[c]
            ) {

                const data =
                    getSymbolData(symbol);


                const amount =
                    ticket.bet *
                    data.multiplier;


                wins.push({

                    line: line,

                    symbol: symbol,

                    amount: amount

                });

            }

        }


        // =====================
        // TOTAL
        // =====================

        let totalWin = 0;


        for (const win of wins) {

            totalWin +=
                win.amount;

        }


        // =====================
        // PAY
        // =====================

        player.balance +=
            totalWin;


        console.log(
            `Ticket finished: ${totalWin} FC won`
        );


        // =====================
        // SEND RESULT
        // =====================

        socket.send(JSON.stringify({

            type: "ticket_finished",

            wins: wins,

            totalWin: totalWin,

            balance: player.balance

        }));


        // Remove ticket

        player.ticket = null;

    }


    // =========================
    // ERROR
    // =========================

    function sendError(message) {

        socket.send(JSON.stringify({

            type: "error",

            message: message

        }));

    }


    // =========================
    // CLOSE
    // =========================

    socket.on("close", () => {

        console.log(
            "Player disconnected."
        );

    });

});


server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `FoxBet server running on port ${PORT}`
        );

    }
);
