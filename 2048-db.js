import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase-config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LEADERBOARD_LIMIT = 10;

const leaderboardContainer = document.querySelector(".leaderboard-container");

let topScores = null;

function appendCell(parent, className, text) {
    const cell = document.createElement("div");
    cell.className = className;
    cell.textContent = text;
    parent.appendChild(cell);
}

function renderMessage(container, text) {
    const notice = document.createElement("div");
    notice.className = "leaderboard-message";
    notice.textContent = text;
    container.replaceChildren(notice);
}

async function loadLeaderboard() {
    const { data, error } = await supabase
        .from("scores")
        .select("username, score")
        .order("score", { ascending: false })
        .order("created_at", { ascending: true })
        .limit(LEADERBOARD_LIMIT);

    if (error) {
        console.error("Could not load leaderboard:", error.message);
        if (leaderboardContainer) renderMessage(leaderboardContainer, "Leaderboard unavailable");
        return;
    }

    topScores = data.map((row) => row.score);
    if (!leaderboardContainer) return;

    if (data.length === 0) {
        renderMessage(leaderboardContainer, "No scores yet -- be the first!");
        return;
    }

    const rows = document.createDocumentFragment();
    data.forEach((row, index) => {
        // Each entry is one row element so the stylesheet can give it a
        // divider and a hover state. Rank is position in the sorted list.
        const entry = document.createElement("div");
        entry.className = "leaderboard-row";
        appendCell(entry, "playerIDsLeaderboard", index + 1);
        appendCell(entry, "playerNamesLeaderboard", row.username);
        appendCell(entry, "playerScoresLeaderboard", row.score);
        rows.appendChild(entry);
    });
    leaderboardContainer.replaceChildren(rows);
}

// Called by 2048.js when a game ends, to decide whether to ask for a name.
window.leaderboardQualifies = function leaderboardQualifies(score) {
    const value = Math.trunc(Number(score));
    if (!Number.isFinite(value) || value <= 0) return false;
    if (topScores === null) return false;

    if (topScores.length < LEADERBOARD_LIMIT) return true;
    return value > topScores[topScores.length - 1];
};

// Called by sendData() in 2048.js once a name has been entered.
window.submitScore = async function submitScore(username, score) {
    const name = String(username ?? "").trim().slice(0, 20);
    if (name.length === 0) return;

    const { error } = await supabase
        .from("scores")
        .insert({ username: name, score: Math.max(0, Math.trunc(score)) });

    if (error) {
        console.error("Could not submit score:", error.message);
        return;
    }

    // Realtime will also fire, but refreshing here means the player still sees
    // their score appear even if the websocket never connected.
    await loadLeaderboard();
};

loadLeaderboard();

// Live updates: any tab with the page open redraws when someone finishes a game.
supabase
    .channel("public:scores")
    .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "scores" },
        loadLeaderboard
    )
    .subscribe();
