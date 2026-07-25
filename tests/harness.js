"use strict";

/* Loads 2048.js into a fresh V8 context with just enough DOM to run headless.
 *
 * Two things make the game testable without a browser: the canvas context
 * records draw calls instead of painting, and requestAnimationFrame is driven
 * by hand, so animation timing is deterministic rather than wall-clock.
 *
 * The game file is loaded as-is — nothing is stubbed inside it — so these tests
 * exercise the same code the page runs.
 */

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const GAME_SOURCE = path.join(__dirname, "..", "2048.js");
const source = fs.readFileSync(GAME_SOURCE, "utf8");

const EMPTY = 0;
const BOARD_PX = 600; // the canvas drawing buffer, and the unit tests measure in

function loadGame() {
    const draws = [];
    const submissions = [];
    const storage = new Map();
    const frameQueue = [];
    let now = 0;

    const canvasCtx = {
        fillStyle: "",
        font: "",
        textAlign: "",
        textBaseline: "",
        clearRect(...args) {
            draws.push({ op: "clear", args });
        },
        fillRect(...args) {
            draws.push({ op: "rect", args, color: this.fillStyle });
        },
        fillText(...args) {
            draws.push({ op: "text", args, font: this.font });
        },
    };

    // Enough of CSSStyleDeclaration for the custom property the game writes to
    // tell the stylesheet where it left room for the form.
    const styleStub = () => {
        const properties = new Map();
        return {
            setProperty: (name, value) => properties.set(name, value),
            getPropertyValue: (name) => properties.get(name) ?? "",
        };
    };

    const element = (overrides = {}) => ({
        addEventListener() {},
        focus() {},
        style: styleStub(),
        textContent: "",
        value: "",
        hidden: false,
        getContext: () => canvasCtx,
        ...overrides,
    });

    const canvas = element();
    const usernameInput = element({ value: "tester" });
    const formPopup = element({ hidden: true });

    const document = {
        querySelector(selector) {
            if (selector === "#gameBoard") return canvas;
            if (selector === "#username") return usernameInput;
            if (selector === "#myForm") return formPopup;
            return element();
        },
        getElementById: () => element(),
        activeElement: null,
        fonts: null, // skips the webfont redraw hook
    };

    // Whether a finished score is good enough for the leaderboard.
    let qualifies = false;

    const window = {
        addEventListener() {},
        document,
        localStorage: {
            getItem: (key) => (storage.has(key) ? storage.get(key) : null),
            setItem: (key, value) => storage.set(key, String(value)),
        },
        leaderboardQualifies: () => qualifies,
        submitScore: (name, score) => submissions.push({ name, score }),
    };

    const consoleErrors = [];

    const sandbox = {
        console: { ...console, error: (...args) => consoleErrors.push(args.join(" ")) },
        document,
        window,
        performance: { now: () => now },
        requestAnimationFrame: (fn) => frameQueue.push(fn),
        cancelAnimationFrame: () => frameQueue.length = 0,
    };
    sandbox.globalThis = sandbox;

    const context = vm.createContext(sandbox);
    vm.runInContext(source, context);

    const run = (expression) => vm.runInContext(expression, context);
    const contextMath = run("Math");
    const builtinRandom = contextMath.random;

    // Objects created inside the context carry that realm's prototypes, which
    // assert's strict comparisons reject. Round-tripping through JSON hands the
    // test plain values from its own realm.
    const runJSON = (expression) => JSON.parse(run(`JSON.stringify(${expression})`));

    // Moves the animation clock forward, running whatever frames were queued.
    function advance(ms) {
        now += ms;
        frameQueue.splice(0, frameQueue.length).forEach((fn) => fn(now));
    }

    // Runs the animation to completion. The loop bound stops a runaway frame
    // chain from hanging the test run.
    function settle() {
        for (let i = 0; i < 20 && frameQueue.length > 0; i++) advance(50);
    }

    // Everything drawn since the last canvas clear, i.e. the most recent frame.
    function lastFrame() {
        const start = draws.map((d) => d.op).lastIndexOf("clear");
        return start === -1 ? [] : draws.slice(start);
    }

    // The game over screen alone: everything painted after the last board-sized
    // rectangle, which is the dim it lays over the finished board.
    function overlayDraws() {
        const frame = lastFrame();
        const dim = frame.findLastIndex(
            (d) => d.op === "rect" && d.args[2] === BOARD_PX && d.args[3] === BOARD_PX
        );
        return dim === -1 ? [] : frame.slice(dim);
    }

    return {
        run,
        runJSON,
        draws,
        submissions,
        storage,
        consoleErrors,
        advance,
        settle,
        lastFrame,
        clearDraws: () => draws.splice(0, draws.length),
        tilesDrawn: () => lastFrame().filter((d) => d.op === "rect"),
        labelsDrawn: () => lastFrame().filter((d) => d.op === "text").map((d) => d.args[0]),

        // Text belonging to the game over screen — everything drawn after the
        // full board dim, so the tile values underneath are not counted. The
        // font size is parsed back out of the shorthand, which is enough to say
        // where a line starts and ends and so whether two of them overlap.
        overlayTexts: () => overlayDraws()
            .filter((d) => d.op === "text")
            .map((d) => ({
                text: d.args[0],
                x: d.args[1],
                y: d.args[2],
                size: Number(/([\d.]+)px/.exec(d.font)[1]),
            })),

        // The top edge the game reserved for the form, in board units.
        formTop: () => {
            const value = formPopup.style.getPropertyValue("--form-top");
            return value === "" ? null : (parseFloat(value) / 100) * BOARD_PX;
        },

        formOpen: () => formPopup.hidden === false,
        setUsername: (value) => { usernameInput.value = value; },
        setQualifies: (value) => { qualifies = value; },

        // Board values as a plain 4x4 matrix, 0 for an empty cell.
        board: () => runJSON("board.map(row => row.map(tile => tile ? tile.value : 0))"),
        tileCount: () => run("board.flat().filter(Boolean).length"),
        score: () => run("score"),

        setBoard(rows) {
            run("board = emptyBoard();");
            rows.forEach((row, rowIndex) => {
                row.forEach((value, colIndex) => {
                    if (value !== EMPTY) {
                        run(`board[${rowIndex}][${colIndex}] = createTile(${value}, ${rowIndex}, ${colIndex}, false);`);
                    }
                });
            });
        },

        // Drops the board dealt on load and puts the game in a settled state
        // that accepts input, ready for a hand-built position.
        ready() {
            run("cancelAnimation(); closeForm();");
            run("gameOver = false; scoreSubmitted = false; gameOverNote = ''; score = 0;");
        },

        setRandom: (fn) => { contextMath.random = fn; },
        restoreRandom: () => { contextMath.random = builtinRandom; },
    };
}

module.exports = { loadGame, EMPTY, BOARD_PX };
