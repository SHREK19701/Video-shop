// Načtení environmentálních proměnných
require("dotenv").config();

// Import potřebných knihoven
const express = require("express");  // Načte Express
const { Pool } = require("pg");      // Načte PostgreSQL knihovnu
const paypal = require("paypal-rest-sdk");
const path = require("path");

// Inicializace aplikace Express
const app = express();  // To je místo, kde definujeme 'app'

// Nastavení portu
const port = 3000;

// Konfigurace PayPalu
paypal.configure({
    mode: "live", // nebo "sandbox" pro testování
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET,
});

// Připojení k databázi PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Endpoint pro kontrolu připojení k databázi
app.get("/db-check", async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query("SELECT NOW();"); // Zkušební dotaz
        res.status(200).json({
            status: "success",
            message: "Připojení k databázi je úspěšné.",
            time: result.rows[0].now,
        });
    } catch (err) {
        console.error("Chyba při připojení k databázi:", err.message);
        res.status(500).json({
            status: "error",
            message: "Nelze se připojit k databázi.",
            error: err.message,
        });
    } finally {
        if (client) client.release();
    }
});

// Statické soubory
app.use(express.static(path.join(__dirname, "public")));

// Hlavní endpoint
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Spuštění serveru
app.listen(port, () => {
    console.log(`Server běží na http://localhost:${port}`);
});

// Debugging: Výpis environmentálních proměnných
console.log("Client ID:", process.env.CLIENT_ID);
console.log("Client Secret:", process.env.CLIENT_SECRET);

