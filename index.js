const express = require('express');
const path = require('path');
const Datastore = require('nedb-promises');

const app = express();
const port = process.env.PORT || 8080;

// Kalıcı veritabanı dosyasını oluşturuyoruz (Geçmiş silinse de burası silinmez!)
const db = Datastore.create({ filename: path.join(__dirname, 'koyler.db'), autoload: true });

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Şifreli Giriş ve Kalıcı Kayıt Sistemi
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ error: "Kullanıcı adı veya şifre eksik!" });
    }

    try {
        // Veritabanında bu isimde oyuncu var mı bak
        let player = await db.findOne({ username: username });

        if (!player) {
            // Yoksa YENİ KAYIT oluştur (Şifresiyle birlikte)
            player = {
                username: username,
                password: password,
                gold: 1000,
                elixir: 1000,
                town_hall: 1
            };
            await db.insert(player);
            return res.json({ success: true, player: player });
        }

        // Varsa ŞİFREYİ KONTROL ET
        if (player.password !== password) {
            return res.json({ error: "Hatalı şifre! Bu köye giriş izniniz yok." });
        }

        // Şifre doğruysa pasif gelir ekle ve veritabanını güncelle
        player.gold += 100 * player.town_hall;
        player.elixir += 100 * player.town_hall;
        
        await db.update({ username: username }, { $set: { gold: player.gold, elixir: player.elixir } });

        res.json({ success: true, player: player });
    } catch (err) {
        res.json({ error: "Veritabanı hatası oluştu!" });
    }
});

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda tamamen kalıcı ve aktif!`);
});