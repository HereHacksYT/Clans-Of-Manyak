const express = require('express');
const path = require('path'); // Bu yeni satırı ekledik
const app = express();
const port = process.env.PORT || 8080;

let players = {};

app.use(express.json());
// HTML dosyasını dışarıya açmak için bu satırı ekledik:
app.use(express.static(path.join(__dirname))); 

// Ana Sayfa artık index.html dosyasını açacak
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/play', (req, res) => {
    const username = req.query.username;
    if (!username) return res.json({ error: "Kullanici adi girilmedi!" });

    if (!players[username]) {
        players[username] = { username, gold: 1000, elixir: 1000, town_hall: 1 };
    } else {
        players[username].gold += 50 * players[username].town_hall;
        players[username].elixir += 50 * players[username].town_hall;
    }
    res.json(players[username]);
});

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda aktif...`);
});