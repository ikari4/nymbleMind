// logChat.js

import { createClient } from "@libsql/client";  

const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
    try {
        const { playerId, week, year, text } = req.body;

        await turso.execute(
            `
            INSERT INTO Chats (playerId, week, year, text)
            VALUES (?, ?, ?, ?)
            `,
            [playerId, week, year, text]
        );

        res.status(200).json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
}