const express = require('express');
const app = express();
const path = require('path');

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

app.get('/', (req, res) => {
    res.send('<h1>Diagnostic Server Active</h1><p>If you see this, basic routing works.</p>');
});

app.listen(3001, () => {
    console.log('Diagnostic server on port 3001');
});