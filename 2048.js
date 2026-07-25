/* 2048 — game state and rendering.
 *
 * The board is the only source of truth: a 4x4 array holding a tile object or
 * null per cell. A move is one pure state transition over that array, and the
 * renderer draws whatever the board currently says. Animation never owns state
 * — it only interpolates between the cell a tile came from and the one it
 * landed on — so a dropped frame or a fast key repeat cannot leave the drawing
 * and the game out of sync.
 */

"use strict";

const canvas = document.querySelector("#gameBoard");
const ctx = canvas.getContext("2d");
const scoreLabel = document.querySelector("#playerScore");
const highScoreLabel = document.querySelector("#highScore");
const restartBtn = document.querySelector("#restartBtn");
const usernameInput = document.querySelector("#username");
const formPopup = document.querySelector("#myForm");
const usernameForm = document.querySelector("#myForm form");

const SIZE = 4;
const CELL = 150;
const BOARD_PX = SIZE * CELL; // canvas drawing buffer is 600x600

// A move plays as a slide followed by a short pop on whatever was created.
const SLIDE_MS = 100;
const POP_MS = 80;
const MOVE_MS = SLIDE_MS + POP_MS;

const HIGH_SCORE_KEY = "2048-high-score";

// Game over screen, in board units. FORM_HEIGHT is the one number shared with
// 2048.css: field + gap + button, which .form-container sizes as
// 7.5cqw + 2.5cqw + 6.5cqw of the same 600-unit board.
const TITLE_SIZE = 80;
const NOTE_SIZE = 25;
const TITLE_TO_NOTE = 10;
const NOTE_TO_FORM = 26;
const FORM_HEIGHT = 99;

const TILE_COLORS = {
    2: "#2ecc71",
    4: "#27ae60",
    8: "#f1c40f",
    16: "#f39c12",
    32: "#e67e22",
    64: "#d35400",
    128: "#e74c3c",
    256: "#c0392b",
    512: "#3498db",
    1024: "#1abc9c",
    2048: "#8e44ad",
    4096: "#9b59b6",
    8192: "#6c3483",
};
const BEYOND_COLOR = "#5b2c6f"; // anything past the table still renders

const DIRECTIONS = {
    up: { row: -1, col: 0 },
    down: { row: 1, col: 0 },
    left: { row: 0, col: -1 },
    right: { row: 0, col: 1 },
};

const KEY_DIRECTIONS = {
    arrowup: "up", w: "up",
    arrowdown: "down", s: "down",
    arrowleft: "left", a: "left",
    arrowright: "right", d: "right",
};

// Keys that would otherwise scroll the page out from under the board.
const SCROLL_KEYS = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", " "]);

// Swipes are judged on the dominant axis.
const SWIPE_MIN_PX = 30;
const SWIPE_MAX_MS = 1000;

let board = emptyBoard();
let score = 0;
let highScore = loadHighScore();
let playerName = "";
let gameOver = false;
let scoreSubmitted = false;
let gameOverNote = ""; // subtitle under [GAME OVER]
let frameId = 0; // 0 means idle; non-zero means a move is animating
let animationStart = 0;

/* ---------- board helpers ---------- */

function emptyBoard() {
    return Array.from({ length: SIZE }, () => new Array(SIZE).fill(null));
}

function inBounds(row, col) {
    return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function forEachTile(callback) {
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const tile = board[row][col];
            if (tile) callback(tile, row, col);
        }
    }
}

function createTile(value, row, col, isNew) {
    return {
        value,
        row,
        col,
        fromRow: row,
        fromCol: col,
        isNew: Boolean(isNew),
        mergedFrom: null, // the two tiles this one was made from, for animation
    };
}

function emptyCells() {
    const cells = [];
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            if (!board[row][col]) cells.push({ row, col });
        }
    }
    return cells;
}

// Picks uniformly from the free cells
function spawnTile() {
    const cells = emptyCells();
    if (cells.length === 0) return;
    const { row, col } = cells[Math.floor(Math.random() * cells.length)];
    board[row][col] = createTile(Math.random() < 0.1 ? 4 : 2, row, col, true);
}

/* ---------- move logic ---------- */

// Tiles furthest along the direction of travel have to move first, otherwise
// they block the ones behind them.
function traversalOrder(vector) {
    const rows = [0, 1, 2, 3];
    const cols = [0, 1, 2, 3];
    if (vector.row > 0) rows.reverse();
    if (vector.col > 0) cols.reverse();
    return { rows, cols };
}

// Walks from a cell until the board edge or an occupied cell: returns the last
// free cell reached and whatever tile stopped the walk.
function scan(row, col, vector) {
    let landingRow = row;
    let landingCol = col;
    let nextRow = row + vector.row;
    let nextCol = col + vector.col;

    while (inBounds(nextRow, nextCol) && !board[nextRow][nextCol]) {
        landingRow = nextRow;
        landingCol = nextCol;
        nextRow += vector.row;
        nextCol += vector.col;
    }

    return {
        landingRow,
        landingCol,
        blocker: inBounds(nextRow, nextCol) ? board[nextRow][nextCol] : null,
    };
}

// Applies one move. Returns true if anything actually changed, which is what
// decides whether the turn counts and a new tile spawns.
function move(directionName) {
    const vector = DIRECTIONS[directionName];
    const { rows, cols } = traversalOrder(vector);
    let moved = false;

    // Reset per-move animation bookkeeping before anything shifts.
    forEachTile((tile, row, col) => {
        tile.fromRow = row;
        tile.fromCol = col;
        tile.isNew = false;
        tile.mergedFrom = null;
    });

    for (const row of rows) {
        for (const col of cols) {
            const tile = board[row][col];
            if (!tile) continue;

            const { landingRow, landingCol, blocker } = scan(row, col, vector);

            // A tile created by a merge this turn still has mergedFrom set, so
            // it cannot merge again — that is the rule that keeps 2,2,4 from
            // collapsing to 8 in a single move.
            if (blocker && blocker.value === tile.value && !blocker.mergedFrom) {
                const merged = createTile(tile.value * 2, blocker.row, blocker.col, false);
                merged.mergedFrom = [blocker, tile];

                tile.row = blocker.row;
                tile.col = blocker.col;

                board[blocker.row][blocker.col] = merged;
                board[row][col] = null;

                score += merged.value;
                moved = true;
            } else if (landingRow !== row || landingCol !== col) {
                board[landingRow][landingCol] = tile;
                board[row][col] = null;
                tile.row = landingRow;
                tile.col = landingCol;
                moved = true;
            }
        }
    }

    return moved;
}

// Game over is exactly: no free cell, and no pair of equal neighbours. Checking
// right and down from every cell covers all adjacencies once.
function movesAvailable() {
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const tile = board[row][col];
            if (!tile) return true;
            const right = col + 1 < SIZE ? board[row][col + 1] : null;
            const below = row + 1 < SIZE ? board[row + 1][col] : null;
            if (right && right.value === tile.value) return true;
            if (below && below.value === tile.value) return true;
        }
    }
    return false;
}

/* ---------- turn handling ---------- */

// A key may land while the previous move is still animating.
function handleMove(directionName) {
    if (gameOver) return;

    if (frameId !== 0) {
        cancelAnimation();
        render(MOVE_MS); // land the move on screen before starting the next
    }

    if (!move(directionName)) return; // nothing shifted: not a turn

    spawnTile();
    updateScoreboard();
    if (!movesAvailable()) gameOver = true;
    startAnimation();
}

/* ---------- rendering ---------- */

function colorFor(value) {
    return TILE_COLORS[value] || BEYOND_COLOR;
}

function fontSizeFor(value) {
    if (value < 1000) return 50;
    if (value < 10000) return 42;
    return 34;
}

function drawTile(value, row, col, scale) {
    const size = CELL * scale;
    const x = col * CELL;
    const y = row * CELL;
    const inset = (CELL - size) / 2;

    ctx.fillStyle = colorFor(value);
    ctx.fillRect(x + inset, y + inset, size, size);

    ctx.fillStyle = "white";
    ctx.font = `550 ${Math.round(fontSizeFor(value) * scale)}px 'Genos', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, x + CELL / 2, y + CELL / 2);
}

function lerp(from, to, t) {
    return from + (to - from) * t;
}

function easeOut(t) {
    return t * (2 - t);
}

// One full redraw per frame. Passing MOVE_MS renders the settled board.
function render(elapsed) {
    ctx.clearRect(0, 0, BOARD_PX, BOARD_PX);

    const slide = easeOut(Math.min(elapsed / SLIDE_MS, 1));
    const pop = Math.min(Math.max((elapsed - SLIDE_MS) / POP_MS, 0), 1);

    forEachTile((tile) => {
        if (tile.mergedFrom) {
            if (slide < 1) {
                // Show the two originals travelling into the same cell.
                for (const source of tile.mergedFrom) {
                    drawTile(
                        source.value,
                        lerp(source.fromRow, source.row, slide),
                        lerp(source.fromCol, source.col, slide),
                        1
                    );
                }
            } else {
                drawTile(tile.value, tile.row, tile.col, 1 + 0.15 * Math.sin(Math.PI * pop));
            }
        } else if (tile.isNew) {
            if (slide >= 1) drawTile(tile.value, tile.row, tile.col, 0.4 + 0.6 * pop);
        } else {
            drawTile(
                tile.value,
                lerp(tile.fromRow, tile.row, slide),
                lerp(tile.fromCol, tile.col, slide),
                1
            );
        }
    });
}

function drawGameOver() {
    render(MOVE_MS);

    const promptOpen = formPopup.hidden === false;

    const heights = [TITLE_SIZE];
    if (gameOverNote) heights.push(TITLE_TO_NOTE, NOTE_SIZE);
    if (promptOpen) heights.push(NOTE_TO_FORM, FORM_HEIGHT);
    const stack = heights.reduce((total, height) => total + height, 0);

    let y = (BOARD_PX - stack) / 2;

    ctx.fillStyle = "rgba(18, 18, 18, 0.78)";
    ctx.fillRect(0, 0, BOARD_PX, BOARD_PX);

    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = `550 ${TITLE_SIZE}px 'Genos', sans-serif`;
    ctx.fillText("[GAME OVER]", BOARD_PX / 2, y + TITLE_SIZE / 2);
    y += TITLE_SIZE;

    if (gameOverNote) {
        y += TITLE_TO_NOTE;
        ctx.font = `550 ${NOTE_SIZE}px 'Genos', sans-serif`;
        ctx.fillText(gameOverNote, BOARD_PX / 2, y + NOTE_SIZE / 2);
        y += NOTE_SIZE;
    }

    if (promptOpen) {
        y += NOTE_TO_FORM;
        formPopup.style.setProperty("--form-top", `${(y / BOARD_PX) * 100}%`);
    }
}

function startAnimation() {
    animationStart = performance.now();
    if (frameId === 0) frameId = requestAnimationFrame(step);
}

// Animation step: called once per frame by requestAnimationFrame.
function step(now) {
    const elapsed = Math.max(now - animationStart, 0);
    render(Math.min(elapsed, MOVE_MS));

    if (elapsed < MOVE_MS) {
        frameId = requestAnimationFrame(step);
        return;
    }

    frameId = 0;
    if (gameOver) finishGame();
}

function cancelAnimation() {
    if (frameId !== 0) cancelAnimationFrame(frameId);
    frameId = 0;
}

/* ---------- score ---------- */

function loadHighScore() {
    try {
        return Number(window.localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch (error) {
        return 0; // private mode or blocked storage: just keep it in memory
    }
}

function saveHighScore(value) {
    try {
        window.localStorage.setItem(HIGH_SCORE_KEY, String(value));
    } catch (error) {
        /* not worth interrupting the game over */
    }
}

function updateScoreboard() {
    if (score > highScore) {
        highScore = score;
        saveHighScore(highScore);
    }
    scoreLabel.textContent = score;
    highScoreLabel.textContent = highScore;
}

// Hands the finished game to the Supabase layer in 2048-db.js. Guarded so a
// board that is already over can never submit twice.
function sendData() {
    if (scoreSubmitted) return;
    scoreSubmitted = true;

    if (typeof window.submitScore !== "function") {
        console.error("Score submission unavailable: 2048-db.js did not load.");
        return;
    }
    window.submitScore(playerName, score);
}

// Checks whether the current score qualifies for the leaderboard.
function scoreQualifies() {
    if (typeof window.leaderboardQualifies !== "function") return false;
    try {
        return window.leaderboardQualifies(score) === true;
    } catch (error) {
        console.error("Could not check the leaderboard:", error);
        return false;
    }
}

function finishGame() {
    if (scoreQualifies()) {
        gameOverNote = "YOU MADE THE LEADERBOARD";
        openForm(); // opened first: drawGameOver lays out around it
    } else {
        gameOverNote = "RESTART TO PLAY AGAIN";
    }
    drawGameOver();
}

// Handles the submission of the player's name after qualifying for the leaderboard.
function submitName() {
    const name = usernameInput.value.trim();
    if (name.length === 0) {
        usernameInput.focus();
        return;
    }

    playerName = name;
    closeForm();
    sendData();

    gameOverNote = "SCORE SUBMITTED";
    drawGameOver();
}

/* ---------- lifecycle ---------- */

function newGame() {
    cancelAnimation();
    closeForm(); // restarting mid-prompt abandons that score rather than sending it
    board = emptyBoard();
    score = 0;
    gameOver = false;
    scoreSubmitted = false;
    gameOverNote = "";

    spawnTile();
    spawnTile();
    updateScoreboard();
    startAnimation();
}

function openForm() {
    formPopup.hidden = false;
    usernameInput.focus();
}

function closeForm() {
    formPopup.hidden = true;
}

/* ---------- input ---------- */

// Listeners are attached once and read the current state, so restarting can
// never stack duplicate handlers
window.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (document.activeElement === usernameInput) return;

    const key = event.key.toLowerCase();
    if (SCROLL_KEYS.has(key)) event.preventDefault();

    const direction = KEY_DIRECTIONS[key];
    if (direction) handleMove(direction);
}, { passive: false });

let touchStart = null;

canvas.addEventListener("touchstart", (event) => {
    // touches counts every finger on the screen; changedTouches would only
    // hold the newest one, and so could not tell a pinch from a swipe.
    if (event.touches.length !== 1) {
        touchStart = null; // multi-touch (pinch/zoom) is not a swipe
        return;
    }
    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY, time: performance.now() };
    event.preventDefault();
}, { passive: false });

canvas.addEventListener("touchmove", (event) => {
    event.preventDefault();
}, { passive: false });

canvas.addEventListener("touchend", (event) => {
    event.preventDefault();

    const origin = touchStart;
    touchStart = null; // cleared every time, so a tap can't replay the last swipe
    if (!origin) return;
    if (performance.now() - origin.time > SWIPE_MAX_MS) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;

    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_MIN_PX) return;

    if (Math.abs(dx) > Math.abs(dy)) {
        handleMove(dx < 0 ? "left" : "right");
    } else {
        handleMove(dy < 0 ? "up" : "down");
    }
}, { passive: false });

canvas.addEventListener("touchcancel", () => {
    touchStart = null;
});

restartBtn.addEventListener("click", newGame);

if (usernameForm) {
    usernameForm.addEventListener("submit", (event) => {
        event.preventDefault(); // keep the page from reloading
        submitName();
    });
}

// Wait for fonts to be ready before the first render to avoid layout shifts.
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
        if (frameId !== 0) return; // a running animation repaints anyway
        if (gameOver) drawGameOver();
        else render(MOVE_MS);
    });
}

newGame();
