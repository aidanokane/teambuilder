const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.get('/test', (req, res) => res.send('backend is working'));

app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));

