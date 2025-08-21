const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// Create new team
router.post('/save', isAuthenticated, async (req, res) => {
    const { name, pokemon_data } = req.body;
    
    if (!name || !pokemon_data) {
        return res.status(400).json({ error: 'Team name and Pokémon data are required' });
    }
    
    try {
        const result = await pool.query(
            'INSERT INTO teams (user_id, name, pokemon_data) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, name, pokemon_data]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error saving team:', err);
        res.status(500).json({ error: 'Failed to save team' });
    }
});

// Get all teams for authenticated user
router.get('/my-teams', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM teams WHERE user_id = $1 ORDER BY updated_at DESC',
            [req.user.id]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching teams:', err);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Get specific team by ID
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM teams WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching team:', err);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Update existing team
router.put('/:id', isAuthenticated, async (req, res) => {
    const { name, pokemon_data } = req.body;
    const teamId = req.params.id;
    
    if (!name || !pokemon_data) {
        return res.status(400).json({ error: 'Team name and Pokémon data are required' });
    }
    
    try {
        const result = await pool.query(
            'UPDATE teams SET name = $1, pokemon_data = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [name, pokemon_data, teamId, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating team:', err);
        res.status(500).json({ error: 'Failed to update team' });
    }
});

// Delete team
router.delete('/:id', isAuthenticated, async (req, res) => {
    const teamId = req.params.id;
    
    try {
        const result = await pool.query(
            'DELETE FROM teams WHERE id = $1 AND user_id = $2 RETURNING *',
            [teamId, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Team not found' });
        }
        
        res.json({ message: 'Team deleted successfully' });
    } catch (err) {
        console.error('Error deleting team:', err);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

module.exports = router;
