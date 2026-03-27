import { createClient } from "@libsql/client";  

const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req, res) {
    try {
        const { todaysScore, playerId, datePlayed, day, week, year, score } = req.body;

        // Convert todaysScore into column/value pairs (NO transformation)
        const updates = Object.entries(todaysScore).map(([column, value]) => ({
            column,
            value
        }));

        // Base required columns
        const baseColumns = [
            { column: "playerId", value: playerId },
            { column: "datePlayed", value: datePlayed },
            { column: "day", value: day},
            { column: "week", value: week },
            { column: "year", value: year },
            { column: "score", value: score }
        ];

        const allColumns = [...baseColumns, ...updates];

        const columnNames = allColumns.map(c => c.column).join(", ");
        const placeholders = allColumns.map(() => "?").join(", ");
        const values = allColumns.map(c => c.value);

        const updateClause = allColumns
            .filter(c => c.column !== "playerId" && c.column !== "datePlayed")
            .map(c => `${c.column} = excluded.${c.column}`)
            .join(", ");

        const query = `
            INSERT INTO Scores (${columnNames})
            VALUES (${placeholders})
            ON CONFLICT(playerId, datePlayed)
            DO UPDATE SET ${updateClause}
        `;

        await turso.execute({
            sql: query,
            args: values
        });

        res.status(200).json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
}