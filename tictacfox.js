// =========================
// FOXCOINS
// =========================

const BALANCE_KEY = "foxcoins";

let foxCoins =
    Number(localStorage.getItem(BALANCE_KEY)) || 0;

const balanceElement =
    document.getElementById("balance");

function updateBalance() {

    localStorage.setItem(
        BALANCE_KEY,
        foxCoins
    );

    balanceElement.textContent =
        foxCoins;
}


// =========================
// ELEMENTS
// =========================

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
// GAME STATE
// =========================

let selectedBet = 0;
let board = [];
let gameActive = false;


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
// BET SELECTION
// =========================

betButtons.forEach(button => {

    button.addEventListener("click", () => {

        const amount =
            Number(button.dataset.bet);

        if (!amount) {
            return;
        }

        selectedBet = amount;

        selectedBetElement.textContent =
            `${selectedBet} FC`;

        updateBuyButton();

    });

});


// =========================
// BUY TICKET
// =========================

buyTicketButton.addEventListener("click", () => {

    if (selectedBet <= 0) {

        resultElement.textContent =
            "Choose a bet first.";

        return;
    }

    if (selectedBet > foxCoins) {

        resultElement.textContent =
            "Not enough FoxCoins.";

        return;
    }

    foxCoins -= selectedBet;

    updateBalance();

    startGame();

});


// =========================
// BUY BUTTON
// =========================

function updateBuyButton() {

    buyTicketButton.disabled =
        selectedBet <= 0 ||
        selectedBet > foxCoins ||
        gameActive;

}


// =========================
// START TICKET
// =========================

function startGame() {

    board = [
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        ""
    ];

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

    buyTicketButton.disabled = true;

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

    cell.addEventListener("click", () => {

        if (!gameActive) {
            return;
        }

        if (board[index] !== "") {
            return;
        }

        const symbol =
            generateSymbol();

        board[index] = symbol;

        cell.textContent =
            symbol;

        cell.classList.add(
            "revealed"
        );

        cell.disabled = true;


        // =====================
        // CHECK FULL BOARD
        // =====================

        if (
            board.every(
                value => value !== ""
            )
        ) {

            finishTicket();

        } else {

            const remaining =
                board.filter(
                    value => value === ""
                ).length;

            resultElement.textContent =
                `${remaining} tiles remaining.`;

        }

    });

});


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
// CHECK LINES
// =========================

function getWinningLines() {

    const wins = [];

    for (const line of winningLines) {

        const [a, b, c] = line;

        if (
            board[a] !== "" &&
            board[a] === board[b] &&
            board[b] === board[c]
        ) {

            wins.push(line);

        }

    }

    return wins;

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
// FINISH TICKET
// =========================

function finishTicket() {

    gameActive = false;

    const winningLinesFound =
        getWinningLines();


    // =====================
    // NO WIN
    // =====================

    if (winningLinesFound.length === 0) {

        resultElement.textContent =
            `No line. You lost ${selectedBet} FC.`;

        playAgainButton.style.display =
            "block";

        updateBuyButton();

        return;
    }


    // =====================
    // HIGHLIGHT LINES
    // =====================

    winningLinesFound.forEach(line => {

        line.forEach(index => {

            cells[index]
                .classList
                .add("winning");

        });

    });


    // =====================
    // CALCULATE EACH LINE
    // =====================

    let totalWinnings = 0;

    const lineResults = [];


    winningLinesFound.forEach(
        (line, index) => {

            const symbol =
                board[line[0]];

            const data =
                getSymbolData(symbol);

            const winnings =
                selectedBet *
                data.multiplier;

            totalWinnings += winnings;

            lineResults.push({
                number: index + 1,
                symbol: symbol,
                winnings: winnings
            });

        }
    );


    // =====================
    // ADD TOTAL WIN
    // =====================

    foxCoins += totalWinnings;

    updateBalance();


    // =====================
    // SHOW EACH LINE
    // =====================

    let message = "";

    lineResults.forEach(line => {

        message +=
            `Line ${line.number}: ` +
            `${line.symbol} +${line.winnings} FC | `;

    });


    message +=
        `Total win: +${totalWinnings} FC`;


    resultElement.textContent =
        message;


    // =====================
    // WIN OVERLAY
    // =====================

    showWinOverlay(
        totalWinnings
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

        board = [];

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

updateBalance();
updateBuyButton();
