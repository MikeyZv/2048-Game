const gameBoard = document.querySelector("#gameBoard");
const ctx = gameBoard.getContext("2d");
const highScore = document.querySelector("#highScore");
const playerScore = document.querySelector("#playerScore");
const gameWidth =  gameBoard.width;
const gameHeight = gameBoard.height;

class Tile {
    value;
    color;
    x;
    y;
    height = 125;
    width = 125;

    constructor(value, color, x, y) {
        this.value = value;
        this.color = color;
        this.x = x;
        this.y = y;
    }

    drawTile() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    
    clearTile() {
        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

};

window.addEventListener("keydown", moveBox);
let tiles = [];
let grid = [[{x:0, y:0, taken: 0}, {x:125, y:0, taken: 0}, {x:250, y:0, taken: 0}, {x:375, y:0, taken: 0}],
            [{x:0, y:125, taken: 0}, {x:125, y:125, taken: 0}, {x:250, y:125, taken: 0}, {x:375, y:125, taken: 0}],
            [{x:0, y:250, taken: 0}, {x:125, y:250, taken: 0}, {x:250, y:250, taken: 0}, {x:375, y:250, taken: 0}],
            [{x:0, y:375, taken: 0}, {x:125, y:375, taken: 0}, {x:250, y:375, taken: 0}, {x:375, y:375, taken: 0}]];

randomStart();

//randomly places two tiles on the board at the beginning of the game but they can't overlap
function randomStart() {
    randomIndex1A = Math.floor(Math.random() * 4);
    randomIndex1B = Math.floor(Math.random() * 4);

    randomIndex2A = Math.floor(Math.random() * 4);
    randomIndex2B = Math.floor(Math.random() * 4);
    
    while ((grid[randomIndex1A][randomIndex1B].x == grid[randomIndex2A][randomIndex2B].x) && (grid[randomIndex1A][randomIndex1B].y == grid[randomIndex2A][randomIndex2B].y)) {
        randomIndex1A = Math.floor(Math.random() * 4);
        randomIndex1B = Math.floor(Math.random() * 4);
    }

    const firstTile = new Tile(2, "red", grid[randomIndex1A][randomIndex1B].x, grid[randomIndex1A][randomIndex1B].y);
    const secondTile = new Tile(2, "red", grid[randomIndex2A][randomIndex2B].x, grid[randomIndex2A][randomIndex2B].y);

    tiles.push(firstTile);
    tiles.push(secondTile);

    tiles[0].drawTile();
    tiles[1].drawTile();
};

//checks to see which spaces on the grid are taken
function checkTaken () {
    for (let i = 0; i < tiles.length; i++) {
        for (let j = 0; j < 4; j++) {
            for (let k = 0; k < 4; k++) {
                if ((tiles[i].x == grid[j][k].x) && (tiles[i].y == grid[j][k].y)) {
                    grid[j][k].taken = 1;
                }
            }
        }
    }
};

//spawns in a random tile on an available space
function randomNewTile() {
    randomIndexA = Math.floor(Math.random() * 4);
    randomIndexB = Math.floor(Math.random() * 4);

    while (grid[randomIndexA][randomIndexB].taken == 1) {
        randomIndexA = Math.floor(Math.random() * 4);
        randomIndexB = Math.floor(Math.random() * 4);
    }

    let color;
    let rand = Math.floor(Math.random() * 16);

    switch(true) {
        case(rand == 0):
            color = "aqua";
            break;
        case(rand == 1):
            color = "green";
            break;
        case(rand == 2):
            color = "blue";
            break;
        case(rand == 3):
            color = "purple";
            break;
        case(rand == 4):
            color = "black";
            break;
        case(rand == 5):
            color = "orange";
            break;
        case(rand == 6):
            color = "yellow";
            break;
        case(rand == 7):
            color = "coral";
            break;
        case(rand == 8):
            color = "crimson";
            break;
        case(rand == 9):
            color = "cyan";
            break;
        case(rand == 10):
            color = "DarkRed";
            break;
        case(rand == 11):
            color = "Gold";
            break;
        case(rand == 12):
            color = "Indigo";
            break;
        case(rand == 13):
            color = "LightGreen";
            break;
        case(rand == 14):
            color = "Lime";
            break;
        case(rand == 15):
            color = "Maroon";
            break;
    }
    
    if (tiles.length < 16) {
        const newTile = new Tile(2, color, grid[randomIndexA][randomIndexB].x, grid[randomIndexA][randomIndexB].y);
        tiles.push(newTile);
    }
};

//draws all tiles on the board
function drawTiles() {
    for (let i = 0; i < tiles.length; i++) {
        tiles[i].drawTile();
    }
};

function moveDown() {
    for (let i = 0; i < 4; i++) {
        for (let j = 3; j >= 0; j--) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[j][i].x == tiles[k].x) && (grid[j][i].y == tiles[k].y)) {
                    if (j == 2) {
                        if (grid[j+1][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j+1][i].x;
                            tiles[k].y = grid[j+1][i].y;
                            grid[j][i].taken = 0;
                            grid[j+1][i].taken = 1;
                            tiles[k].drawTile();
                        }
                    } else if (j == 1) {
                        if (grid[j+2][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j+2][i].x;
                            tiles[k].y = grid[j+2][i].y;
                            grid[j][i].taken = 0;
                            grid[j+2][i].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[j+1][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j+1][i].x;
                            tiles[k].y = grid[j+1][i].y;
                            grid[j][i].taken = 0;
                            grid[j+1][i].taken = 1;
                            tiles[k].drawTile();
                        } 
                    } else if (j == 0) {
                        if (grid[j+3][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j+3][i].x;
                            tiles[k].y = grid[j+3][i].y;
                            grid[j][i].taken = 0;
                            grid[j+3][i].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[j+2][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j+2][i].x;
                            tiles[k].y = grid[j+2][i].y;
                            grid[j][i].taken = 0;
                            grid[j+2][i].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[j+1][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j+1][i].x;
                            tiles[k].y = grid[j+1][i].y;
                            grid[j][i].taken = 0;
                            grid[j+1][i].taken = 1;
                            tiles[k].drawTile();
                        } 
                    }
                }
            }
        }
    }
};

function moveUp() {
    for (let i = 0; i < 4; i++) {
        for (let j = 1; j <= 3; j++) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[j][i].x == tiles[k].x) && (grid[j][i].y == tiles[k].y)) {
                    if (j == 1) {
                        if (grid[j-1][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j-1][i].x;
                            tiles[k].y = grid[j-1][i].y;
                            grid[j][i].taken = 0;
                            grid[j-1][i].taken = 1;
                            tiles[k].drawTile();
                        }
                    } else if (j == 2) {
                        if (grid[j-2][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j-2][i].x;
                            tiles[k].y = grid[j-2][i].y;
                            grid[j][i].taken = 0;
                            grid[j-2][i].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[j-1][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j-1][i].x;
                            tiles[k].y = grid[j-1][i].y;
                            grid[j][i].taken = 0;
                            grid[j-1][i].taken = 1;
                            tiles[k].drawTile();
                        } 
                    } else if (j == 3) {
                        if (grid[j-3][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j-3][i].x;
                            tiles[k].y = grid[j-3][i].y;
                            grid[j][i].taken = 0;
                            grid[j-3][i].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[j-2][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j-2][i].x;
                            tiles[k].y = grid[j-2][i].y;
                            grid[j][i].taken = 0;
                            grid[j-2][i].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[j-1][i].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[j-1][i].x;
                            tiles[k].y = grid[j-1][i].y;
                            grid[j][i].taken = 0;
                            grid[j-1][i].taken = 1;
                            tiles[k].drawTile();
                        } 
                    }
                }
            }
        }
    }
};

function moveLeft() {
    for (let i = 0; i < 4; i++) {
        for (let j = 1; j <= 3; j++) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[i][j].x == tiles[k].x) && (grid[i][j].y == tiles[k].y)) {
                    if (j == 1) {
                        if (grid[i][j-1].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j-1].x;
                            tiles[k].y = grid[i][j-1].y;
                            grid[i][j].taken = 0;
                            grid[i][j-1].taken = 1;
                            tiles[k].drawTile();
                        }
                    } else if (j == 2) {
                        if (grid[i][j-2].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j-2].x;
                            tiles[k].y = grid[i][j-2].y;
                            grid[i][j].taken = 0;
                            grid[i][j-2].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[i][j-1].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j-1].x;
                            tiles[k].y = grid[i][j-1].y;
                            grid[i][j].taken = 0;
                            grid[i][j-1].taken = 1;
                            tiles[k].drawTile();
                        }
                    } else if (j == 3) {
                        if (grid[i][j-3].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j-3].x;
                            tiles[k].y = grid[i][j-3].y;
                            grid[i][j].taken = 0;
                            grid[i][j-3].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[i][j-2].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j-2].x;
                            tiles[k].y = grid[i][j-2].y;
                            grid[i][j].taken = 0;
                            grid[i][j-2].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[i][j-1].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j-1].x;
                            tiles[k].y = grid[i][j-1].y;
                            grid[i][j].taken = 0;
                            grid[i][j-1].taken = 1;
                            tiles[k].drawTile();
                        }
                    }
                }
            }
        }
    }
};

function moveRight() {
    for (let i = 0; i < 4; i++) {
        for (let j = 3; j >= 0; j--) {
            for (let k = 0; k < tiles.length; k++) {
                if ((grid[i][j].x == tiles[k].x) && (grid[i][j].y == tiles[k].y)) {
                    if (j == 2) {
                        if (grid[i][j+1].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j+1].x;
                            tiles[k].y = grid[i][j+1].y;
                            grid[i][j].taken = 0;
                            grid[i][j+1].taken = 1;
                            tiles[k].drawTile();
                        }
                    } else if (j == 1) {
                        if (grid[i][j+2].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j+2].x;
                            tiles[k].y = grid[i][j+2].y;
                            grid[i][j].taken = 0;
                            grid[i][j+2].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[i][j+1].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j+1].x;
                            tiles[k].y = grid[i][j+1].y;
                            grid[i][j].taken = 0;
                            grid[i][j+1].taken = 1;
                            tiles[k].drawTile();
                        }
                    } else if (j == 0) {
                        if (grid[i][j+3].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j+3].x;
                            tiles[k].y = grid[i][j+3].y;
                            grid[i][j].taken = 0;
                            grid[i][j+3].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[i][j+2].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j+2].x;
                            tiles[k].y = grid[i][j+2].y;
                            grid[i][j].taken = 0;
                            grid[i][j+2].taken = 1;
                            tiles[k].drawTile();
                        } else if (grid[i][j+1].taken == 0) {
                            tiles[k].clearTile();
                            tiles[k].x = grid[i][j+1].x;
                            tiles[k].y = grid[i][j+1].y;
                            grid[i][j].taken = 0;
                            grid[i][j+1].taken = 1;
                            tiles[k].drawTile();
                        }
                    }
                }
            }
        }
    }
};

function moveBox(event) {
    const keyPressed = event.keyCode;
    const upArrow = 38;
    const downArrow = 40;
    const rightArrow = 39;
    const leftArrow = 37;
    const upW = 87;
    const downS = 83;
    const rightD = 68;
    const leftA = 65;

    switch(true) {
        case(keyPressed == downArrow || keyPressed == downS):
            checkTaken();
            moveDown();
            randomNewTile();
            drawTiles();
            break;
        case(keyPressed == upArrow || keyPressed == upW):
            checkTaken();
            moveUp();
            randomNewTile();
            drawTiles();
            break;
        case(keyPressed == rightArrow || keyPressed == rightD):
            checkTaken();
            moveRight();
            randomNewTile();
            drawTiles();
            break;
        case(keyPressed == leftArrow || keyPressed == leftA):
            checkTaken();
            moveLeft();
            randomNewTile();
            drawTiles();
            break;
        }

};