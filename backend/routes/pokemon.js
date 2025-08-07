const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = express.Router();

router.get('/:name', async (req, res) => {
    const name = req.params.name.toLowerCase();

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);

        if (!response.ok) {
            return res.status(404).json({ error: 'Pokémon not found' });
        }

        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Error fetching Pokémon:', err);
        res.status(500).json({ error: 'Failed to fetch Pokémon' });
    }
});

module.exports = router;
