const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

router.post('/save', isAuthenticated, async (req, res) => {
    const { name, pokemon_data } = req.body;
    
    try {
        const result = await pool.query(
            'INSERT INTO teams (user_id, name, pokemon_data) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, name, JSON.stringify(pokemon_data)]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error saving team:', err);
        res.status(500).json({ error: 'Failed to save team' });
    }
});

router.get('/my-teams', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM teams WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );

        const teams = result.rows.map((row) => ({
            ...row,
            pokemon_data: JSON.parse(JSON.parse(row.pokemon_data))
        }));
        
        res.json(teams);
    } catch (err) {
        console.error('Error fetching teams:', err);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

module.exports = router;
