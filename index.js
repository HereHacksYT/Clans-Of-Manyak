const express = require('express');
const path = require('path');
const Datastore = require('nedb-promises');

const app = express();
const port = process.env.PORT || 8080;

const db = Datastore.create({ filename: path.join(__dirname, 'koyler.db'), autoload: true });

// Mesajları ve anlık binaları sunucu çalıştığı sürece hafızada tutalım
let globalMessages = [];
let kurulmusBinalar = {}; // Her oyuncunun ekstra binalarını tutacak

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Giriş ve Kayıt
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.json({ error: "Eksik bilgi!" });

    try {
        let player = await db.findOne({ username: username });
        if (!player) {
            player = { username, password, gold: 2000, elixir: 2000, town_hall: 1 }; // Başlangıç parasını arttırdık bina kurulsun diye
            await db.insert(player);
            return res.json({ success: true, player });
        }

        if (player.password !== password) return res.json({ error: "Hatalı şifre!" });

        res.json({ success: true, player });
    } catch (err) {
        res.json({ error: "Sunucu hatası!" });
    }
});

// Altın/İksir Güncelleme ve Bina Satın Alma Verisi Kaydetme
app.post('/update-resources', async (req, res) => {
    const { username, gold, elixir } = req.body;
    await db.update({ username: username }, { $set: { gold, elixir } });
    res.json({ success: true });
});

// GLOBAL CHAT API'LERİ
app.get('/chat', (req, res) => {
    res.json(globalMessages);
});

app.post('/chat', (req, res) => {
    const { username, message } = req.body;
    if(!username || !message) return res.json({ error: "Boş mesaj gönderilemez!" });
    
    globalMessages.push({ username, message, time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) });
    if(globalMessages.length > 30) globalMessages.shift(); // Son 30 mesajı tut
    res.json({ success: true });
});

app.listen(port, () => {
    console.log(`Sunucu ${port} portunda canavar gibi aktif!`);
});