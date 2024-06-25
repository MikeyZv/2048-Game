<!DOCTYPE html>

<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, inital-scale=1.0">
        <link href="index.css" rel="stylesheet"/>
        <script src="https://kit.fontawesome.com/6d56778525.js" crossorigin="anonymous"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Genos:ital,wght@0,100..900;1,100..900&family=Orbitron:wght@400..900&display=swap" rel="stylesheet">
    </head>
    <body>
        <div class="header">
            <div class="title-container">
                <h1>2048</h1>
                <div id="directions-header">Merge tiles to reach 2048!</div>
            </div>
        </div>
        <div class="main-container">
            <div class="left-container">
                <h2 id="recent-games-header">Most Recent Players</h2>
                <div class="centered-container">
                    <div class="recent-games-container">
                        <?php
                            try {
                                require_once "includes/dbh.inc.php";

                                $query = "SELECT * FROM recent_games ORDER BY preciseTime DESC;";
                                $stmt = $pdo->prepare($query);
                                $stmt->execute();
                                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

                                foreach ($results as $row) {
                                    echo "<div class='playerNamesRecentGames'>" . htmlspecialchars($row['username']) . "</div>";
                                    echo "<div class='playerScoresRecentGames'>" . htmlspecialchars($row['score']) . '|' . "</div>";
                                    echo "<div class='played_atRecentGames'>" . htmlspecialchars($row['preciseTime']) . "</div>";
                                }
                                
                            } catch (PDOException $e) {
                                die("Query failed: " . $e->getMessage());
                            }  
                        ?>
                    </div>
                </div>
            </div>
            <div id="gameContainer">
                <canvas id="gameBoard" width="600" height="600"></canvas>
                <div class="form-popup" id="myForm">
                    <form class="form-container">
                        <input type="text" id="username" placeholder="Enter Username">
                        <button class="submit-btn" onclick="start()">Submit</button>
                    </form>
                </div>
            </div>
            <div class="right-container">
                <h2 id="leaderboard-header">Top Ranking Players</h2>
                <!-- <div class="form-popup" id="myForm">
                    <form class="form-container">
                        <input type="text" id="username" placeholder="Enter Username" required>
                        <button id="submitbtn" class="submit-btn" onclick="sendData()">Submit</button>
                    </form>
                </div> -->
                <div class="leaderboard-container">
                    <?php
                    try {
                        require_once "includes/dbh.inc.php";
                        $query = "SELECT * FROM leaderboard ORDER BY score DESC;";
                        $stmt = $pdo->prepare($query);
                        $stmt->execute();
                        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

                        foreach ($results as $row) {
                            echo "<div class='playerIDsLeaderboard'>" . htmlspecialchars($row['id']) . "</div>";
                            echo "<div class='playerNamesLeaderboard'>" . htmlspecialchars($row['username']) . "</div>";
                            echo "<div class='playerScoresLeaderboard'>" . htmlspecialchars($row['score']) . "</div>";
                        }

                        $pdo = null;
                        $stmt = null;
                    } catch (PDOException $e) {
                        die("Query failed: " . $e->getMessage());
                    }  
                    ?>
                </div>
            </div>
        </div>

        <div id="scoreContainer">
            <div id="highScoreContainer">
                <div id="highScoreText">Best</div>
                <div id="highScore">0</div>
            </div>
            <div id="middle-score-container">
                <div id="restartContainer">
                    <button id="restartBtn">Restart</button>
                </div>
            </div>
            <div id="playerScoreContainer">
                <div id="playerScoreText">Score</div>
                <div id="playerScore">0</div>
            </div>
        </div>
        <script src="index.js"></script>
    </body>
    <footer>
        <a href="https://www.linkedin.com/in/miguelzv/">
            <i class="fa-brands fa-linkedin fa-2xl"></i>
        </a>
        <a href="mailto:zmikey16@gmail.com">
            <i class="fa-regular fa-envelope fa-2xl"></i>
        </a>
        <a href="https://github.com/MikeyZv">
            <i class="fa-brands fa-github fa-2xl"></i>
        </a>
        <p id="signature">website coded by Miguel Zavala</p>
    </footer>
</html>