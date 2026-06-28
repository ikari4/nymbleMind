// getChats.js

import { createClient } from "@libsql/client";  

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
  try {
    const { currentWeek, currentYear } = req.body;

    const result = await turso.execute(
        `
        SELECT 
            c.playerId,
            c.text,
            c.createdAt,
            p.username
        FROM Chats c
        JOIN Players p ON c.playerId = p.playerId
        WHERE c.week = ? and c.year = ?
        `,
        [currentWeek, currentYear]
    );

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
}