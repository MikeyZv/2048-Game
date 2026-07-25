"use strict";

/* The turn lifecycle: rendering, input gating, game over, restart, score. */

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGame, EMPTY: _, BOARD_PX } = require("./harness");

const CELL = 150;

// Where a line of centred text starts and ends vertically. fillText is called
// with textBaseline "middle", so the y it is given is the middle of the line.
const topOf = (line) => line.y - line.size / 2;
const bottomOf = (line) => line.y + line.size / 2;

test("loading the page deals two tiles and animates them in", () => {
    const game = loadGame();

    assert.equal(game.tileCount(), 2);
    assert.equal(game.formOpen(), false, "no username is asked for up front");
    assert.equal(game.run("frameId !== 0"), true, "animation running");

    game.advance(10); // mid-slide
    assert.deepEqual(game.draws[0], { op: "clear", args: [0, 0, BOARD_PX, BOARD_PX] },
        "every frame clears the whole canvas");
    assert.equal(game.tilesDrawn().length, 0, "new tiles pop in after the slide, not during");

    game.settle();
    assert.equal(game.run("frameId === 0"), true, "loop stops when the move ends");

    const tiles = game.tilesDrawn();
    assert.equal(tiles.length, 2, "settled board draws both tiles");
    assert.ok(
        tiles.every(({ args: [x, y, w, h] }) => w === CELL && h === CELL && x % CELL === 0 && y % CELL === 0),
        "settled tiles are full size and aligned to the grid"
    );
});

test("the game is playable immediately, without a username", () => {
    const game = loadGame();
    game.settle();

    game.setBoard([[2, _, _, 2], [_, _, _, _], [_, _, _, _], [_, _, _, _]]);
    game.run('handleMove("left")');

    assert.equal(game.score(), 4, "the move counted");
    assert.equal(game.run("playerName"), "", "still nameless");
});

test("submitting a blank username keeps the prompt open", () => {
    const game = loadGame();
    game.run("openForm()");
    game.setUsername("   ");

    game.run("submitName()");

    assert.equal(game.submissions.length, 0, "nothing submitted");
    assert.equal(game.formOpen(), true, "the prompt is still waiting");
});

test("a turn merges, spawns, and animates both source tiles", () => {
    const game = loadGame();
    game.ready();
    game.setBoard([[2, _, _, 2], [_, _, _, _], [_, _, _, _], [_, _, _, _]]);

    game.run('handleMove("left")');

    assert.equal(game.score(), 4, "merge scored");
    assert.equal(game.tileCount(), 2, "merged to one tile, then one spawned");

    game.clearDraws();
    game.advance(40); // mid-slide

    const tiles = game.tilesDrawn();
    assert.equal(tiles.length, 2, "both originals are drawn travelling");
    assert.deepEqual(game.labelsDrawn(), [2, 2], "they still read as 2 until they land");
    assert.ok(tiles.every(({ args: [x] }) => x >= 0 && x <= 3 * CELL), "drawn inside the board");

    game.settle();
    assert.ok(game.labelsDrawn().includes(4), "the merged tile shows its new value");
});

test("a move that changes nothing is not a turn", () => {
    const game = loadGame();
    game.ready();
    game.setBoard([[2, 4, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]]);

    game.run('handleMove("left")');

    assert.equal(game.tileCount(), 2, "no tile spawned");
    assert.equal(game.run("frameId === 0"), true, "no animation started");
});

test("a key mid-animation lands the move and plays the next one", () => {
    const game = loadGame();
    game.ready();
    game.setRandom(() => 0.5); // spawns are always a 2, so no surprise merges
    game.setBoard([[2, _, _, 2], [_, _, _, _], [_, _, _, _], [_, _, _, _]]);

    game.run('handleMove("left")');
    game.advance(40); // mid-slide
    assert.equal(game.run("frameId !== 0"), true, "first move still animating");

    game.run('handleMove("right")');
    assert.equal(game.score(), 4, "the interrupted move's merge kept its points");
    assert.equal(game.tileCount(), 3, "the second move counted and spawned");
    assert.equal(game.run("frameId !== 0"), true, "the second move is animating");

    game.settle();
    assert.equal(game.run("frameId === 0"), true, "the loop still winds down");
    assert.equal(
        game.run("board.every((row, r) => row.every((tile, c) => !tile || (tile.row === r && tile.col === c)))"),
        true,
        "the board stays internally consistent across the interruption"
    );
});

// The worst case the fast-forward path allows: turn after turn arriving with
// few or no frames in between. The animation must never wedge (frameId stuck)
// and the grid must never disagree with the tiles in it.
test("mashed keys faster than the animation stay consistent", () => {
    const game = loadGame();
    game.ready();
    game.setRandom(() => 0.5);
    game.run("spawnTile(); spawnTile();");
    const directions = ["left", "down", "right", "up"];

    for (let i = 0; i < 200 && !game.run("gameOver"); i++) {
        game.run(`handleMove(${JSON.stringify(directions[i % 4])})`);
        if (i % 3 === 0) game.advance(20); // an occasional frame slips in
    }

    game.settle();
    assert.equal(game.run("frameId === 0"), true, "animation wound down");
    assert.ok(game.tileCount() <= 16, "never more than 16 tiles");
    assert.equal(
        game.run("board.every((row, r) => row.every((tile, c) => !tile || (tile.row === r && tile.col === c)))"),
        true,
        "every tile agrees with the cell holding it"
    );
});

test("input is refused after game over", () => {
    const game = loadGame();
    game.ready();
    game.setBoard([[2, _, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]]);
    game.run("gameOver = true;");

    game.run('handleMove("left")');

    assert.equal(game.tileCount(), 1, "the move was ignored: nothing spawned");
    assert.equal(game.run("frameId === 0"), true, "no animation started");
});

// Fills the last free cell of an alternating board, which locks it. Sliding the
// bottom row left is a legal move; the spawn then leaves no pair anywhere.
function playUntilGameOver(game) {
    game.ready();
    game.setRandom(() => 0.5); // spawns a 2, deterministically
    game.setBoard([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [_, 4, 2, 4]]);
    game.run('handleMove("left")');
    game.settle();
}

test("a leaderboard score is asked for a name, then submitted once", () => {
    const game = loadGame();
    game.setQualifies(true);

    playUntilGameOver(game);

    assert.equal(game.run("gameOver"), true, "game over detected");
    assert.ok(game.labelsDrawn().includes("[GAME OVER]"), "overlay drawn");
    assert.ok(
        game.labelsDrawn().includes("YOU MADE THE LEADERBOARD"),
        "the prompt's heading is painted as part of the game over screen"
    );
    assert.equal(game.formOpen(), true, "the leaderboard prompt opened");
    assert.equal(game.submissions.length, 0, "nothing submitted before a name is given");

    game.setUsername("tester");
    game.run("submitName()");

    assert.deepEqual(game.submissions, [{ name: "tester", score: game.score() }]);
    assert.equal(game.formOpen(), false, "the prompt closes once submitted");
    assert.ok(game.labelsDrawn().includes("SCORE SUBMITTED"), "the overlay says so");

    game.run("submitName()");
    assert.equal(game.submissions.length, 1, "a repeat submission is blocked");
});

test("the game over screen and the prompt are centred together, clear of each other", () => {
    const game = loadGame();
    game.setQualifies(true);

    playUntilGameOver(game);

    const [title, note, ...rest] = game.overlayTexts();
    assert.equal(rest.length, 0, "the screen is a headline and a note, nothing else");
    assert.equal(title.text, "[GAME OVER]");

    const formTop = game.formTop();
    const formBottom = formTop + game.run("FORM_HEIGHT");

    assert.ok(title.x === BOARD_PX / 2 && note.x === BOARD_PX / 2, "both lines centred across");
    assert.ok(bottomOf(title) < topOf(note), "the note clears the headline");
    assert.ok(bottomOf(note) < formTop, "the form clears the note");
    assert.ok(formBottom < BOARD_PX, "the form fits on the board");

    // Centred as one stack: as much empty board above the headline as below the
    // form. Anything else would read as the whole screen sitting off centre.
    assert.ok(
        Math.abs(topOf(title) - (BOARD_PX - formBottom)) < 1,
        `stack is centred (${topOf(title)} above, ${BOARD_PX - formBottom} below)`
    );
});

test("the game over screen re-centres once the prompt is gone", () => {
    const game = loadGame();
    game.setQualifies(true);
    playUntilGameOver(game);
    game.setUsername("tester");

    game.run("submitName()");

    const [title, note] = game.overlayTexts();
    assert.equal(note.text, "SCORE SUBMITTED");
    assert.equal(game.formOpen(), false);

    // Redrawn from the board up: exactly one dim, and none of the old wording
    // ghosting through from the first game over screen.
    const dims = game.lastFrame().filter(
        (d) => d.op === "rect" && d.args[2] === BOARD_PX && d.args[3] === BOARD_PX
    );
    assert.equal(dims.length, 1, "the overlay is not stacked on the previous one");
    assert.ok(!game.labelsDrawn().includes("YOU MADE THE LEADERBOARD"), "old headline cleared");
    assert.ok(bottomOf(title) < topOf(note), "still clear of each other");
    assert.ok(
        Math.abs(topOf(title) - (BOARD_PX - bottomOf(note))) < 1,
        "the two lines alone are centred on the board"
    );
});

test("a score that misses the leaderboard is never asked for a name", () => {
    const game = loadGame();
    game.setQualifies(false);

    playUntilGameOver(game);

    assert.equal(game.run("gameOver"), true, "game still ends");
    assert.equal(game.formOpen(), false, "no prompt");
    assert.equal(game.submissions.length, 0, "nothing submitted");
    assert.ok(game.labelsDrawn().includes("[GAME OVER]"), "overlay still drawn");
});

test("a missing database layer ends the game quietly", () => {
    const game = loadGame();
    game.run("delete window.leaderboardQualifies;");

    playUntilGameOver(game);

    assert.equal(game.formOpen(), false, "no point asking for a name with nowhere to send it");

    game.run("delete window.submitScore; playerName = 'tester'; scoreSubmitted = false;");
    assert.doesNotThrow(() => game.run("sendData();"));
    assert.match(game.consoleErrors.join("\n"), /2048-db\.js did not load/);
});

test("restarting while the prompt is open abandons that score", () => {
    const game = loadGame();
    game.setQualifies(true);
    playUntilGameOver(game);
    assert.equal(game.formOpen(), true);

    game.run("newGame()");

    assert.equal(game.formOpen(), false, "prompt dismissed");
    assert.equal(game.submissions.length, 0, "nothing was sent");
    game.settle();
});

test("restart resets the game and re-arms submission", () => {
    const game = loadGame();
    game.settle();
    game.run("score = 900; gameOver = true; scoreSubmitted = true;");

    game.run("newGame()");

    assert.equal(game.score(), 0, "score reset");
    assert.equal(game.run("gameOver"), false, "game over cleared");
    assert.equal(game.run("scoreSubmitted"), false, "submission re-armed");
    assert.equal(game.tileCount(), 2, "two fresh tiles");
    game.settle();
});

test("high score rises with the score and is persisted", () => {
    const game = loadGame();

    game.run("score = 1234; updateScoreboard();");
    assert.equal(game.storage.get("2048-high-score"), "1234");
    assert.equal(game.run("highScore"), 1234);

    game.run("score = 5; updateScoreboard();");
    assert.equal(game.run("highScore"), 1234, "a lower score never lowers the best");
    assert.equal(game.storage.get("2048-high-score"), "1234");
});

test("blocked localStorage does not break scoring", () => {
    const game = loadGame();
    game.run(`window.localStorage = {
        getItem() { throw new Error("denied"); },
        setItem() { throw new Error("denied"); },
    };`);

    assert.doesNotThrow(() => game.run("score = 10; updateScoreboard();"));
    assert.equal(game.run("highScore"), 10, "still tracked in memory");
});

test("every tile value has a colour and a legible font size", () => {
    const game = loadGame();
    let value = 2;

    for (let i = 0; i < 20; i++) {
        const color = game.run(`colorFor(${value})`);
        const fontSize = game.run(`fontSizeFor(${value})`);

        assert.match(color, /^#[0-9a-f]{6}$/i, `colour for ${value}`);
        assert.ok(fontSize > 0 && fontSize <= 50, `font size for ${value}`);
        // Four digits at 50px would overflow a 150px cell.
        if (value >= 1000) assert.ok(fontSize < 50, `${value} uses a smaller font`);

        value *= 2;
    }
});

test("tiles past 2048 render with their own value", () => {
    const game = loadGame();
    game.ready();
    game.setBoard([[4096, _, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]]);

    game.run(`render(${game.run("MOVE_MS")})`);

    assert.deepEqual(game.labelsDrawn(), [4096]);
});
