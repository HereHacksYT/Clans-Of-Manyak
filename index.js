const express = require('express');
const path = require('path');
const Datastore = require('nedb-promises');

const app = express();
const port = process.env.PORT || 8080;

const db = Datastore.create({ filename: path.join(__dirname, 'koyler.db'), autoload: true });

let globalMessages = [];

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Şifreli Giriş ve Kayıt (Köyün binalarını ve askerlerini de tutuyoruz)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.json({ error: "Eksik bilgi!" });

    try {
        let player = await db.findOne({ username: username });
        if (!player) {
            player = { 
                username, 
                password, 
                gold: 5000, 
                elixir: 5000, 
                town_hall: 1,
                buildings: [], // [{type: 'kanon', x: -3, z: 2}] şeklinde grid konumları
                troops: { barbar: 0, okcu: 0 }
            };
            await db.insert(player);
            return res.json({ success: true, player });
        }

        if (player.password !== password) return res.json({ error: "Hatalı şifre!" });

        res.json({ success: true, player });
    } catch (err) {
        res.json({ error: "Sunucu hatası!" });
    }
});

// Köy Durumunu (Binalar, Askerler, Kaynaklar) Kalıcı Kaydetme API'si
app.post('/save-village', async (req, res) => {
    const { username, gold, elixir, buildings, troops } = req.body;
    try {
        await db.update({ username: username }, { $set: { gold, elixir, buildings, troops } });
        res.json({ success: true });
    } catch(e) {
        res.json({ error: "Kaydedilemedi" });
    }
});

// Global Chat
app.get('/chat', (req, res) => res.json(globalMessages));
app.post('/chat', (req, res) => {
    const { username, message } = req.body;
    if(!username || !message) return res.json({ error: "Boş bırakılamaz" });
    globalMessages.push({ username, message, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) });
    if(globalMessages.length > 30) globalMessages.shift();
    res.json({ success: true });
});

app.listen(port, () => console.log(`Sunucu ${port} portunda aktif.`));