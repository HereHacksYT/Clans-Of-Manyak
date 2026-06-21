const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Sadece sayfayı sunmak için hafif bir backend bırakıyoruz
app.listen(port, () => {
    console.log(`Sunucu ${port} portunda canavar gibi aktif...`);
});