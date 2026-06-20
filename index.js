const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Oyuncu verilerini hafızada tutuyoruz
let players = {};

app.use(express.json());

// Ana Sayfa
app.get('/', (req, res) => {
    res.send('<h1>Clash Of Manyak Node.js Sunucusu Aktif!</h1>');
});

// Kayıt ve Giriş Sistemi (Tek istekte)
app.get('/play', (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.json({ error: "Kullanici adi girilmedi!" });
    }

    if (!players[username]) {
        // Yeni oyuncu aç
        players[username] = {
            username: username,
            gold: 1000,
            elixir: 1000,
            town_hall: 1,
            last_login: Date.now()
        };
    } else {
        // Geri dönen oyuncuya pasif gelir yaz
        players[username].gold += 50 * players[username].town_hall;
        players[username].elixir += 50 * players[username].town_hall;
    }

    res.json(players[username]);
});

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda canavar gibi calisiyor...`);
});