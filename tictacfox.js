// =========================
// SERVER
// =========================

const ws =
    new WebSocket("wss://foxbet.onrender.com");

let foxCoins = 0;


// =========================
// ELEMENTS
// =========================

const balanceElement =
    document.getElementById("balance");

const cells =
    document.querySelectorAll(".cell");

const betButtons =
    document.querySelectorAll(".bets button");

const selectedBetElement =
    document.querySelector(".selected-bet span");

const buyTicketButton =
    document.getElementById("buy-ticket");

const resultElement =
    document.querySelector(".result");

const playAgainButton =
    document.querySelector(".play-again");

const winOverlay =
    document.querySelector(".win-overlay");

const winAmountElement =
    document.querySelector(".win-amount");


// =========================
// GAME STATE
// =========================

let selectedBet = 0;
let gameActive = false;


// =========================
// SERVER CONNECTION
// =========================

ws.onopen = () => {

    resultElement.textContent =
        "Connected to FoxBet.";

    updateBuyButton();

};


ws.onmessage = (event) => {

    const data =
        JSON.parse(event.data);


    // =====================
    // BALANCE
    // =====================

    if (data.type === "balance") {

        foxCoins =
            data.balance;

        balanceElement.textContent =
            foxCoins;

        updateBuyButton();

        return;
    }


    // =====================
    // TICKET STARTED
    // =====================

    if (data.type === "ticket_started") {

        foxCoins =
            data.balance;

        balanceElement.textContent =
            foxCoins;

        startGame();

        return;
    }


    // =====================
    // TILE REVEAL
    // =====================

    if (data.type === "reveal") {

        revealTile(
            data.index,
            data.symbol
        );

        return;
    }


    // =====================
    // TICKET FINISHED
    // =====================

    if (data.type === "ticket_finished") {

        finishTicket(data);

        return;
    }


    // =====================
    // SERVER ERROR
    // =====================

    if (data.type === "error") {

        resultElement.textContent =
            data.message;

        gameActive = false;

        updateBuyButton();

    }

};


ws.onerror = () => {

    resultElement.textContent =
        "Connection error.";

};


ws.onclose = () => {

    gameActive = false;

    resultElement.textContent =
        "Disconnected from FoxBet.";

    updateBuyButton();

};


// =========================
// BET SELECTION
// =========================

betButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            if (gameActive) {
                return;
            }

            const amount =
                Number(button.dataset.bet);

            if (!amount) {
                return;
            }

            selectedBet =
                amount;

            selectedBetElement.textContent =
                `${selectedBet} FC`;

            // Highlight selected button

            betButtons.forEach(
                otherButton => {

                    otherButton.style.borderColor =
                        "";

                }
            );

            button.style.borderColor =
                "#ff7a00";

            resultElement.textContent =
                `${selectedBet} FC bet selected.`;

            updateBuyButton();

        }
    );

});


// =========================
// BUY TICKET
// =========================

buyTicketButton.addEventListener(
    "click",
    () => {

        if (selectedBet <= 0) {

            resultElement.textContent =
                "Choose a bet first.";

            return;
        }

        if (
            ws.readyState !==
            WebSocket.OPEN
        ) {

            resultElement.textContent =
                "Not connected to server.";

            return;
        }

        if (selectedBet > foxCoins) {

            resultElement.textContent =
                "Not enough FoxCoins.";

            return;
        }

        resultElement.textContent =
            "Buying ticket...";

        buyTicketButton.disabled =
            true;


        ws.send(
            JSON.stringify({
                type: "buy_ticket",
                bet: selectedBet
            })
        );

    }
);


// =========================
// BUY BUTTON
// =========================

function updateBuyButton() {

    buyTicketButton.disabled =
        selectedBet <= 0 ||
        selectedBet > foxCoins ||
        gameActive ||
        ws.readyState !== WebSocket.OPEN;

}


// =========================
// START TICKET
// =========================

function startGame() {

    gameActive = true;


    cells.forEach(cell => {

        cell.textContent = "";

        cell.classList.remove(
            "revealed",
            "winning"
        );

        cell.disabled = false;

    });


    resultElement.textContent =
        "Reveal every tile.";

    buyTicketButton.disabled =
        true;

    playAgainButton.style.display =
        "none";

    winOverlay.classList.remove(
        "show"
    );

}


// =========================
// REVEAL TILE
// =========================

cells.forEach((cell, index) => {

    cell.addEventListener(
        "click",
        () => {

            if (!gameActive) {
                return;
            }

            if (
                cell.classList.contains(
                    "revealed"
                )
            ) {
                return;
            }

            if (
                ws.readyState !==
                WebSocket.OPEN
            ) {
                return;
            }


            // Prevent double clicking

            cell.disabled =
                true;


            ws.send(
                JSON.stringify({
                    type: "reveal",
                    index: index
                })
            );

        }
    );

});


// =========================
// SHOW REVEALED TILE
// =========================

function revealTile(index, symbol) {

    const cell =
        cells[index];

    if (!cell) {
        return;
    }

    cell.textContent =
        symbol;

    cell.classList.add(
        "revealed"
    );

    cell.disabled =
        true;


    const revealed =
        document.querySelectorAll(
            ".cell.revealed"
        ).length;


    const remaining =
        9 - revealed;


    if (remaining > 0) {

        resultElement.textContent =
            `${remaining} tiles remaining.`;

    } else {

        resultElement.textContent =
            "Checking ticket...";

    }

}


// =========================
// FINISH TICKET
// =========================

function finishTicket(data) {

    gameActive = false;


    // =====================
    // UPDATE BALANCE
    // =====================

    if (
        typeof data.balance ===
        "number"
    ) {

        foxCoins =
            data.balance;

        balanceElement.textContent =
            foxCoins;

    }


    // =====================
    // HIGHLIGHT WINNING LINES
    // =====================

    if (
        Array.isArray(data.wins)
    ) {

        data.wins.forEach(win => {

            if (
                Array.isArray(
                    win.line
                )
            ) {

                win.line.forEach(index => {

                    if (cells[index]) {

                        cells[index]
                            .classList
                            .add("winning");

                    }

                });

            }

        });

    }


    // =====================
    // NO WIN
    // =====================

    if (
        !data.totalWin ||
        data.totalWin <= 0
    ) {

        resultElement.textContent =
            "No line. You lost the ticket.";

        playAgainButton.style.display =
            "block";

        updateBuyButton();

        return;
    }


    // =====================
    // SHOW EACH WIN
    // =====================

    let message = "";


    if (
        Array.isArray(data.wins)
    ) {

        data.wins.forEach(
            (win, index) => {

                message +=
                    `Line ${index + 1}: ` +
                    `${win.symbol} ` +
                    `+${win.amount} FC`;

                if (
                    index <
                    data.wins.length - 1
                ) {

                    message +=
                        " | ";

                }

            }
        );

    }


    message +=
        ` Total win: +${data.totalWin} FC`;


    resultElement.textContent =
        message;


    // =====================
    // WIN OVERLAY
    // =====================

    showWinOverlay(
        data.totalWin
    );


    playAgainButton.style.display =
        "block";

    updateBuyButton();

}


// =========================
// WIN OVERLAY
// =========================

function showWinOverlay(amount) {

    winAmountElement.textContent =
        `+${amount} FC`;

    winOverlay.classList.add(
        "show"
    );


    setTimeout(() => {

        winOverlay.classList.remove(
            "show"
        );

    }, 1800);

}


// =========================
// NEW TICKET
// =========================

playAgainButton.addEventListener(
    "click",
    () => {

        gameActive = false;


        cells.forEach(cell => {

            cell.textContent = "";

            cell.classList.remove(
                "revealed",
                "winning"
            );

            cell.disabled = false;

        });


        selectedBet = 0;

        selectedBetElement.textContent =
            "None";


        betButtons.forEach(
            button => {

                button.style.borderColor =
                    "";

            }
        );


        resultElement.textContent =
            "Choose a bet.";


        playAgainButton.style.display =
            "none";


        winOverlay.classList.remove(
            "show"
        );


        updateBuyButton();

    }
);


// =========================
// INITIALIZE
// =========================

updateBuyButton();
