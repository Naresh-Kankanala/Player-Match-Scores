const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error : ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1

app.get("/players/", async (request, response) => {
  const playersQuery = `
            SELECT *
            FROM player_details;`;
  const playersList = await db.all(playersQuery);
  response.send(playersList);
});

//API 2

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
            SELECT *
            FROM player_details
            WHERE player_id = ${playerId};`;
  const responseDB = await db.get(playerQuery);
  response.send(responseDB);
});

//API 3

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
            UPDATE player_details
            SET player_name = '${playerName}'
            WHERE player_id = ${playerId};`;
  const responseDB = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `
            SELECT *
            FROM match_details
            WHERE match_id = ${matchId};`;
  const responseDB = await db.all(matchQuery);
  response.send(responseDB);
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchesQuery = `
            SELECT match_details.match_id,
                    match_details.match,
                    match_details.year
            FROM player_match_score
            NATURAL JOIN match_details
            WHERE player_id = ${playerId};`;
  const responseDB = await db.all(playerMatchesQuery);
  response.send(responseDB);
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playersOfMatchQuery = `
            SELECT player_details.player_id,
                    player_details.player_name,
                    player_match_score.match_id
            FROM player_match_score
            INNER JOIN player_details ON player_details.player_id = player_match_score.player_id
            WHERE player_match_score.match_id = ${matchId};`;
  const responseDB = await db.all(playersOfMatchQuery);
  response.send(responseDB);
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const scoreStatsQuery = `
            SELECT player_details.player_id AS playerId,
                    player_details.player_name AS playerName,
                    SUM(score) AS totalScore,
                    SUM(fours) AS totalFours,
                    SUM(sixes) AS totalSixes
            FROM player_match_score 
            INNER JOIN player_details ON player_match_score.player_id = player_details.player_id
            WHERE player_match_score.player_id = ${playerId};`;
  const responseDB = await db.all(scoreStatsQuery);
  response.send(responseDB);
});

module.exports = app;
