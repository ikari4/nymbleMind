// getStandings.js

import { createClient } from "@libsql/client";  

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
  try {
    const { currentWeek } = req.body;

    const result = await turso.execute(
        `
        SELECT 
            s.playerId,
            s.datePlayed,
            s.week,
            s.year,
            s.finalScore,
            p.username
        FROM Scores s
        JOIN Players p ON s.playerId = p.playerId
        WHERE s.week = ?
        `,
        [currentWeek]
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
}