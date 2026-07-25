"use strict";

/* The move rules: sliding, merging, and what counts as a turn. */

const test = require("node:test");
const assert = require("node:assert/strict");
const { loadGame, EMPTY: _ } = require("./harness");

// Each case sets up a board, applies one move, and states the whole outcome:
// resulting board, points gained, and whether the move counted as a turn.
const MOVES = [
    {
        name: "slides left and closes gaps",
        before: [[_, 2, _, 4], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "left",
        after: [[2, 4, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
    },
    {
        name: "slides right",
        before: [[2, _, 4, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "right",
        after: [[_, _, 2, 4], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
    },
    {
        name: "slides down the full height of a column",
        before: [[2, _, _, _], [_, _, _, _], [4, _, _, _], [_, _, _, _]],
        direction: "down",
        after: [[_, _, _, _], [_, _, _, _], [2, _, _, _], [4, _, _, _]],
    },
    {
        name: "slides up",
        before: [[_, _, _, _], [_, _, _, 2], [_, _, _, _], [_, _, _, 4]],
        direction: "up",
        after: [[_, _, _, 2], [_, _, _, 4], [_, _, _, _], [_, _, _, _]],
    },
    {
        name: "merges an equal pair and scores the result",
        before: [[2, 2, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "left",
        after: [[4, _, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        gain: 4,
    },
    {
        name: "2,2,2,2 becomes 4,4 rather than 8",
        before: [[2, 2, 2, 2], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "left",
        after: [[4, 4, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        gain: 8,
    },
    {
        name: "a tile created by a merge cannot merge again the same turn",
        before: [[2, 2, 4, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "left",
        after: [[4, 4, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        gain: 4,
    },
    {
        name: "a tile already in place absorbs the pair behind it",
        before: [[4, 2, 2, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "left",
        after: [[4, 4, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        gain: 4,
    },
    {
        name: "2,2,2 left merges the leading pair",
        before: [[2, 2, 2, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "left",
        after: [[4, 2, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        gain: 4,
    },
    {
        name: "2,2,2 right merges the trailing pair",
        before: [[2, 2, 2, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "right",
        after: [[_, _, 2, 4], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        gain: 4,
    },
    {
        name: "two independent merges in one column",
        before: [[4, _, _, _], [4, _, _, _], [8, _, _, _], [8, _, _, _]],
        direction: "down",
        after: [[_, _, _, _], [_, _, _, _], [8, _, _, _], [16, _, _, _]],
        gain: 24,
    },
    {
        name: "unequal neighbours never merge",
        before: [[2, 4, 8, 16], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "left",
        after: [[2, 4, 8, 16], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        moved: false,
    },
    {
        name: "a board already packed against the wall is not a turn",
        before: [[2, 4, _, _], [8, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "left",
        after: [[2, 4, _, _], [8, _, _, _], [_, _, _, _], [_, _, _, _]],
        moved: false,
    },
    {
        name: "an empty board is not a turn",
        before: [[_, _, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        direction: "up",
        after: [[_, _, _, _], [_, _, _, _], [_, _, _, _], [_, _, _, _]],
        moved: false,
    },
];

for (const { name, before, direction, after, gain = 0, moved = true } of MOVES) {
    test(`move ${direction}: ${name}`, () => {
        const game = loadGame();
        game.setBoard(before);
        game.run("score = 0;");

        const changed = game.run(`move(${JSON.stringify(direction)})`);

        assert.deepEqual(game.board(), after, "resulting board");
        assert.equal(game.score(), gain, "points gained");
        assert.equal(changed, moved, "counted as a turn");
    });
}

test("game over only when the board is full and no neighbours match", () => {
    const game = loadGame();

    game.setBoard([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]);
    assert.equal(game.run("movesAvailable()"), false, "locked checkerboard");

    game.setBoard([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 4]]);
    assert.equal(game.run("movesAvailable()"), true, "full board with one matching pair");

    game.setBoard([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, _]]);
    assert.equal(game.run("movesAvailable()"), true, "board with a free cell");
});

test("a merge records both source tiles for the animation", () => {
    const game = loadGame();
    game.setBoard([[2, _, _, 2], [_, _, _, _], [_, _, _, _], [_, _, _, _]]);
    game.run('move("left")');

    const merged = game.runJSON("board[0][0]");
    assert.equal(merged.value, 4);
    assert.equal(merged.mergedFrom.length, 2, "both originals kept");
    assert.deepEqual(
        merged.mergedFrom.map((tile) => [tile.fromCol, tile.col]),
        [[0, 0], [3, 0]],
        "sources travel from their old columns into the merge cell"
    );
});

test("spawned tiles are always 2 or 4 and land on a free cell", () => {
    const game = loadGame();
    game.setBoard([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, _]]);
    game.run("spawnTile()");

    assert.equal(game.tileCount(), 16, "filled the only free cell");
    assert.ok([2, 4].includes(game.board()[3][3]), "spawn value is 2 or 4");
});

test("spawning on a full board is a no-op", () => {
    const game = loadGame();
    game.setBoard([[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]]);
    const before = game.board();

    game.run("spawnTile()");

    assert.deepEqual(game.board(), before);
});

test("invariants hold over 3000 random moves", () => {
    const game = loadGame();
    const directions = ["up", "down", "left", "right"];

    game.run("board = emptyBoard(); score = 0; spawnTile(); spawnTile();");

    for (let i = 0; i < 3000; i++) {
        const direction = directions[Math.floor(Math.random() * directions.length)];
        if (game.run(`move(${JSON.stringify(direction)})`)) game.run("spawnTile()");

        const values = game.board().flat().filter(Boolean);
        for (const value of values) {
            assert.ok(value >= 2 && (value & (value - 1)) === 0, `${value} is a power of two`);
        }
        assert.ok(values.length <= 16, "never more than 16 tiles");
        assert.equal(
            game.run("board.every((row, r) => row.every((tile, c) => !tile || (tile.row === r && tile.col === c)))"),
            true,
            "every tile agrees with the cell holding it"
        );

        if (!game.run("movesAvailable()")) {
            game.run("board = emptyBoard(); spawnTile(); spawnTile();");
        }
    }
});
