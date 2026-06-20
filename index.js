const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // Yeni kütüphane
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Şimdilik test için geçici/ücretsiz genel bir test veritabanı bağlıyoruz.
// (İleride istersen kendi MongoDB hesabını açıp burayı tamamen sana özel yapabiliriz.)
const mongoURI = "mongodb+srv://testuser:manyak123@cluster0.vpkb6.mongodb.net/clashmanyak?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB Veritabanına Başarıyla Bağlanıldı!"))
    .catch(err => console.error("Veritabanı bağlantı hatası:", err));

// Veritabanı Tablo Yapısı (Şema)
const PlayerSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    gold: { type: Number, default: 1000 },
    elixir: { type: Number, default: 1000 },
    town_hall: { type: Number, default: 1 }
});

const Player = mongoose.model('Player', PlayerSchema);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Kalıcı Şifreli Giriş ve Kayıt Sistemi
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ error: "Kullanıcı adı veya şifre eksik!" });
    }

    try {
        // Veritabanında oyuncuyu ara
        let player = await Player.findOne({ username: username });

        if (!player) {
            // Oyuncu yoksa yeni KAYIT oluştur
            player = new Player({
                username: username,
                password: password,
                gold: 1000,
                elixir: 1000,
                town_hall: 1
            });
            await player.save();
            return res.json({ success: true, player: player });
        }

        // Oyuncu varsa ŞİFRE kontrol et
        if (player.password !== password) {
            return res.json({ error: "Hatalı şifre! Bu köye giriş izniniz yok." });
        }

        // Şifre doğruysa kaynakları arttır ve veritabanını GÜNCELLE
        player.gold += 50 * player.town_hall;
        player.elixir += 50 * player.town_hall;
        await player.save(); // Değişiklikleri kalıcı olarak kaydet

        res.json({ success: true, player: player });
    } catch (err) {
        res.json({ error: "Sunucu hatası oluştu!" });
    }
});

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda kalıcı ve güvenli...`);
});