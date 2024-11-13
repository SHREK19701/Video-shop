const express = require("express");
const { Pool } = require("pg");
const app = express();
const port = 3000;

// Připojení k databázi PostgreSQL
const pool = new Pool({
    user: "postgres",        // nahrad svým uživatelským jménem
    host: "localhost",
    database: "db_url",
    password: "Charalamba11@",         // nahrad svým heslem
    port: 5432,
});

// Ověření připojení k databázi
pool.connect()
    .then(client => {
        console.log('Připojeno k databázi');
        client.release(); // Uvolníme klienta zpět do poolu
    })
    .catch(err => {
        console.error('Chyba při připojování k databázi:', err.stack);
    });

// Middleware pro práci se statickými soubory (HTML, CSS, JS, atd.)
app.use(express.static(__dirname + '/public'));

// Middleware pro práci s JSON
app.use(express.json());

// Definuj cestu k hlavní stránce
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html'); // Cesta k souboru
});

// Endpoint pro aktualizaci zhlédnutí a výdělku
app.post("/update-stats", async (req, res) => {
    const { viewCount, earnings } = req.body;
    try {
        await pool.query(
            "UPDATE video_stats SET view_count = $1, earnings = $2 WHERE id = 1",
            [viewCount, earnings]
        );
        res.status(200).send("Data byla úspěšně aktualizována");
    } catch (err) {
        console.error(err);
        res.status(500).send("Chyba serveru");
    }
});

app.listen(port, () => {
    console.log(`Server běží na http://localhost:${port}`);
});
// Endpoint pro zvyšení počtu zhlédnutí
app.post('/update-stats', async (req, res) => {
    const { videoId } = req.body;
    console.log('Přijato video ID:', videoId);

    try {
        // Získání aktuálního počtu zhlédnutí
        const result = await pool.query('SELECT view_count FROM video_stats WHERE video_id = $1', [videoId]);
        const currentCount = result.rows[0]?.view_count || 0;
        console.log('Aktuální počet zhlédnutí:', currentCount);

        // Výpočet nového počtu zhlédnutí
        const newCount = currentCount + 1;
        console.log('Nový počet zhlédnutí:', newCount);

        // Aktualizace počtu zhlédnutí v databázi
        await pool.query('UPDATE video_stats SET view_count = $1 WHERE video_id = $2', [newCount, videoId]);
        res.status(200).json({ message: 'Počet zhlédnutí byl úspěšně aktualizován.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Chyba při aktualizaci počtu zhlédnutí.' });
    }
});

