// =========================
// FOXCOINS
// =========================

const BALANCE_KEY = "foxcoins";

let foxCoins =
    Number(localStorage.getItem(BALANCE_KEY));

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

updateBalance();


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
// GAME STATE
// =========================

let selectedBet = 0;

let board = [
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

let gameActive = false;
let playerTurn = true;


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
// BUY BUTTON STATE
// =========================

function updateBuyButton() {

    buyTicketButton.disabled =
        selectedBet <= 0 ||
        selectedBet > foxCoins;

}


// =========================
// START GAME
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
    playerTurn = true;

    cells.forEach(cell => {

        cell.textContent = "";

        cell.classList.remove("revealed");
        cell.classList.remove("winning");

        cell.disabled = false;

    });

    resultElement.textContent =
        "Your turn.";

    buyTicketButton.disabled = true;

    playAgainButton.style.display =
        "none";

    winOverlay.classList.remove("show");

}


// =========================
// PLAYER MOVE
// =========================

cells.forEach((cell, index) => {

    cell.addEventListener("click", () => {

        if (!gameActive) {
            return;
        }

        if (!playerTurn) {
            return;
        }

        if (board[index] !== "") {
            return;
        }

        board[index] = "X";

        cell.textContent = "X";

        cell.classList.add("revealed");

        playerTurn = false;

        const playerWin =
            checkWinner("X");

        if (playerWin) {

            endGame(
                "win",
                playerWin
            );

            return;
        }

        if (
            board.every(
                value => value !== ""
            )
        ) {

            endGame("draw");

            return;
        }

        resultElement.textContent =
            "Fox's turn...";

        setTimeout(
            foxMove,
            350
        );

    });

});


// =========================
// FOX MOVE
// =========================

function foxMove() {

    if (!gameActive) {
        return;
    }

    const emptyCells = [];

    board.forEach((value, index) => {

        if (value === "") {
            emptyCells.push(index);
        }

    });

    if (emptyCells.length === 0) {

        endGame("draw");

        return;
    }

    const randomIndex =
        emptyCells[
            Math.floor(
                Math.random() *
                emptyCells.length
            )
        ];

    board[randomIndex] = "O";

    cells[randomIndex].textContent = "O";

    cells[randomIndex]
        .classList
        .add("revealed");

    const foxWin =
        checkWinner("O");

    if (foxWin) {

        endGame(
            "lose",
            foxWin
        );

        return;
    }

    if (
        board.every(
            value => value !== ""
        )
    ) {

        endGame("draw");

        return;
    }

    playerTurn = true;

    resultElement.textContent =
        "Your turn.";

}


// =========================
// WINNING PATTERNS
// =========================

const winningPatterns = [

    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],

    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],

    [0, 4, 8],
    [2, 4, 6]

];


// =========================
// CHECK WINNER
// =========================

function checkWinner(player) {

    for (const pattern of winningPatterns) {

        const [a, b, c] =
            pattern;

        if (
            board[a] === player &&
            board[b] === player &&
            board[c] === player
        ) {

            return pattern;

        }

    }

    return null;

}


// =========================
// END GAME
// =========================

function endGame(
    result,
    winningCells = null
) {

    gameActive = false;
    playerTurn = false;

    if (winningCells) {

        winningCells.forEach(index => {

            cells[index]
                .classList
                .add("winning");

        });

    }


    // =====================
    // WIN
    // =====================

    if (result === "win") {

        const winnings =
            selectedBet * 2;

        foxCoins += winnings;

        updateBalance();

        resultElement.textContent =
            `You won ${winnings} FC!`;

        showWinOverlay(
            winnings
        );

    }


    // =====================
    // LOSE
    // =====================

    else if (result === "lose") {

        resultElement.textContent =
            `You lost ${selectedBet} FC.`;

    }


    // =====================
    // DRAW
    // =====================

    else if (result === "draw") {

        foxCoins += selectedBet;

        updateBalance();

        resultElement.textContent =
            "Draw! Your bet was refunded.";

    }

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

    winOverlay.classList.add("show");

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

        board = [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
        ];

        gameActive = false;
        playerTurn = true;

        cells.forEach(cell => {

            cell.textContent = "";

            cell.classList.remove(
                "revealed"
            );

            cell.classList.remove(
                "winning"
            );

        });

        resultElement.textContent =
            "Choose your bet.";

        winOverlay.classList.remove(
            "show"
        );

        playAgainButton.style.display =
            "none";

        selectedBet = 0;

        selectedBetElement.textContent =
            "None";

        updateBuyButton();

    }
);


// =========================
// INITIALIZE
// =========================

updateBalance();
updateBuyButton();
