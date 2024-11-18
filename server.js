const express = require("express");
const { Pool } = require("pg");
const paypal = require("paypal-rest-sdk");

const app = express();
const port = 3000;

// Nastavení připojení k databázi PostgreSQL
const pool = new Pool({
    user: "postgres", 
    host: "localhost", 
    database: "video_shop", 
    password: "Charalamba11@", 
    port: 5432, 
});

const earningsPerView = 50; // Výdělek za jedno zhlédnutí

// Middleware pro práci s JSON
app.use(express.json());

// Middleware pro obsluhu statických souborů (pro videa a další soubory ve složce 'public')
app.use(express.static(__dirname + "/public"));

// Nastavení PayPal SDK
paypal.configure({
    mode: "sandbox", // 'sandbox' nebo 'live' pro produkci
    client_id: "AZGCnL2ay09Sv2OiqNcHJ6i1Kx19IrzXRAhfJxRSN-DIxV4kktBJf7KJYtaa6EJja2X8k19KbL0wryoY",
    client_secret: "ENIIpOjhjFQCSvYK9giJ4OVgL3bsEWs4YvnT0nS1GgwzcOHd3o1w01MiJZFnpHprUeZTiPt3QCfqCb9N",
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// Funkce pro ověření připojení k databázi
const verifyDatabase = async () => {
    try {
        const client = await pool.connect();
        console.log("Připojení k databázi bylo úspěšné!");
        const result = await client.query("SELECT * FROM video_stats LIMIT 5;");
        console.log("Ukázka dat z tabulky 'video_stats':", result.rows);
        client.release();
    } catch (err) {
        console.error("Chyba při připojení k databázi:", err.message);
    }
};

// Zavolání funkce pro ověření připojení
verifyDatabase();

// Funkce pro zpracování videí
async function zpracujVidea() {
    try {
        const data = await pool.query("SELECT * FROM video_stats");
        console.log("Data z tabulky video_stats:", data.rows);

        for (const video of data.rows) {
            console.log(`Zahájeno zpracování videa ID: ${video.video_id}`);

            const newViewCount = video.view_count + 1;
            const newEarnings = parseFloat(video.earnings) + earningsPerView;

            await pool.query(
                "UPDATE video_stats SET view_count = $1, earnings = $2 WHERE video_id = $3",
                [newViewCount, newEarnings.toFixed(2), video.video_id]
            );
            console.log(`Video ID: ${video.video_id} bylo aktualizováno.`);
        }
    } catch (err) {
        console.error("Chyba při zpracování videí:", err);
    }
}


// Endpoint pro aktualizaci statistik zhlédnutí a výdělku
app.post("/update-stats", async (req, res) => {
    const { videoId } = req.body;

    if (!videoId) {
        return res.status(400).json({ message: "Chybí ID videa." });
    }

    try {
        const result = await pool.query(
            "SELECT view_count, earnings FROM video_stats WHERE video_id = $1",
            [videoId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Video nebylo nalezeno." });
        }

        const { view_count, earnings } = result.rows[0];
        const newViewCount = view_count + 1;
        const newEarnings = parseFloat(earnings) + earningsPerView;

        await pool.query(
            "UPDATE video_stats SET view_count = $1, earnings = $2 WHERE video_id = $3",
            [newViewCount, newEarnings.toFixed(2), videoId]
        );

        res.status(200).json({
            message: "Počet zhlédnutí a výdělek byly úspěšně aktualizovány.",
            data: { videoId, newViewCount, newEarnings },
        });
    } catch (err) {
        console.error("Chyba při aktualizaci statistik:", err);
        res.status(500).json({ message: "Chyba serveru při aktualizaci statistik." });
    }
});

// Funkce pro odeslání výplaty přes PayPal
async function sendPayout(email, amount) {
    const payout = {
        sender_batch_header: {
            sender_batch_id: `payout_${Date.now()}`,
            email_subject: "Výplata zhlédnutí videí",
        },
        items: [
            {
                recipient_type: "EMAIL",
                amount: { value: amount, currency: "CZK" },
                receiver: email,
                note: "Děkujeme za sledování videí!",
            },
        ],
    };

    return new Promise((resolve, reject) => {
        paypal.payout.create(payout, (error, payoutResult) => {
            if (error) {
                reject(error);
            } else {
                resolve(payoutResult);
            }
        });
    });
}

// Endpoint pro výplaty
app.post("/payout", async (req, res) => {
    const { email, amount } = req.body;

    if (!email || !amount) {
        return res.status(400).json({ message: "Chybí email nebo částka." });
    }

    try {
        const payoutResult = await sendPayout(email, amount);
        res.status(200).json({ message: "Peníze byly úspěšně poslány.", payoutResult });
    } catch (err) {
        console.error("Chyba při výplatě:", err);
        res.status(500).json({ message: "Chyba při výplatě.", error: err });
    }
});

// Ukončení připojení k databázi při vypnutí serveru
process.on("SIGINT", async () => {
    console.log("Server se ukončuje, uzavírá se připojení k databázi.");
    await pool.end();
    process.exit(0);
});

// Spuštění serveru
app.listen(port, () => {
    console.log(`Server běží na http://localhost:${port}`);
});

