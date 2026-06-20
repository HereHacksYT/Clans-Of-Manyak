const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

let players = {};

// Gelen JSON verilerini okuyabilmek için bu şart
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Şifreli Giriş ve Kayıt Sistemi
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ error: "Kullanici adi veya sifre eksik!" });
    }

    // Eğer oyuncu yoksa, yeni kayıt oluştur ve şifreyi kaydet
    if (!players[username]) {
        players[username] = {
            username: username,
            password: password, // Şifreyi hafızaya alıyoruz
            gold: 1000,
            elixir: 1000,
            town_hall: 1
        };
        return res.json({ success: true, player: players[username] });
    }

    // Eğer oyuncu varsa, şifreyi kontrol et
    if (players[username].password !== password) {
        return res.json({ error: "Hatalı şifre! Bu köye giriş izniniz yok." });
    }

    // Şifre doğruysa madenleri arttır ve giriş yaptır
    players[username].gold += 50 * players[username].town_hall;
    players[username].elixir += 50 * players[username].town_hall;

    res.json({ success: true, player: players[username] });
});

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda güvenli şekilde aktif...`);
});