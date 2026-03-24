// initialScoreSave.js

import { createClient } from "@libsql/client";  

const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
    try {
    const { todaysScore } = req.body;

    const {
        playerId,
        datePlayed,
        week,
        year,
        score,
        clue0Revealed
    } = todaysScore;

    await turso.execute(
        `
        INSERT INTO Scores (playerId, datePlayed, week, year, score, clue0Revealed)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [playerId, datePlayed, week, year, score, clue0Revealed]
    );

    res.status(200).json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
}