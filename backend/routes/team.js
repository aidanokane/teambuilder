const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Unauthorized' });
}

// Helper function to sanitize Pokemon data for JSON storage
function sanitizePokemonData(pokemonData) {
    console.log('Sanitizing pokemon data:', pokemonData);

    if (!Array.isArray(pokemonData)) {
        console.log('Pokemon data is not an array, returning default array');
        return Array(6).fill(null);
    }

    const sanitized = pokemonData.map((pokemon, index) => {
        if (!pokemon || typeof pokemon !== 'object') {
            console.log(`Pokemon at index ${index} is null or invalid:`, pokemon);
            return null;
        }

        // Create a clean pokemon object with only the necessary fields
        const clean = {
            id: pokemon.id || null,
            name: pokemon.name || null,
            types: Array.isArray(pokemon.types) ? pokemon.types : [],
            stats: Array.isArray(pokemon.stats) ? pokemon.stats : [],
            sprite: pokemon.sprite || null,
            held_item: (pokemon.held_item && typeof pokemon.held_item === 'object') ? pokemon.held_item : null,
            ability: (pokemon.ability && typeof pokemon.ability === 'object') ? pokemon.ability : null,
            moves: Array.isArray(pokemon.moves) ? pokemon.moves.map(move =>
                (move && typeof move === 'object') ? move : null
            ) : [null, null, null, null],
            gender: pokemon.gender || "male",
            shiny: Boolean(pokemon.shiny)
        };

        console.log(`Sanitized pokemon ${index}:`, clean);
        return clean;
    });

    console.log('Final sanitized array:', sanitized);
    return sanitized;
}

// Helper function to safely parse JSONB data
function parseTeamData(team) {
    try {
        // JSONB fields are already parsed by PostgreSQL, but check just in case
        if (typeof team.pokemon_data === 'string') {
            team.pokemon_data = JSON.parse(team.pokemon_data);
        }

        // Ensure pokemon_data is always an array
        if (!Array.isArray(team.pokemon_data)) {
            team.pokemon_data = Array(6).fill(null);
        }

        return team;
    } catch (parseError) {
        console.error('Error parsing team data for team', team.id, ':', parseError);
        return {
            ...team,
            pokemon_data: Array(6).fill(null)
        };
    }
}

// Create new team
router.post('/save', isAuthenticated, async (req, res) => {
    console.log('=== POST /save - Creating new team ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user.id);

    const { name, pokemon_data } = req.body;

    if (!name) {
        console.log('Missing team name');
        return res.status(400).json({ error: 'Team name is required' });
    }

    try {
        // Check for duplicate team name for this user
        const existingTeam = await pool.query(
            'SELECT id FROM teams WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
            [req.user.id, name]
        );

        if (existingTeam.rows.length > 0) {
            console.log('Duplicate team name found:', name);
            return res.status(409).json({ error: 'Team name already exists. Please choose a different name.' });
        }

        // Sanitize the pokemon data
        const sanitizedData = sanitizePokemonData(pokemon_data);

        console.log('Inserting team with data:', {
            user_id: req.user.id,
            name: name,
            pokemon_count: sanitizedData.filter(p => p !== null).length
        });

        const result = await pool.query(
            'INSERT INTO teams (user_id, name, pokemon_data) VALUES ($1, $2, $3) RETURNING *',
            [req.user.id, name, JSON.stringify(sanitizedData)]
        );

        const savedTeam = result.rows[0];
        // Parse the team data safely - JSONB is already parsed by PostgreSQL
        const parsedTeam = parseTeamData(savedTeam);

        console.log('Team created successfully with ID:', parsedTeam.id);
        res.status(201).json(parsedTeam);
    } catch (err) {
        console.error('Error creating team:', err);
        res.status(500).json({ error: 'Failed to create team', details: err.message });
    }
});

// Get all teams for authenticated user
router.get('/my-teams', isAuthenticated, async (req, res) => {
    console.log('=== GET /my-teams ===');
    console.log('User:', req.user.id);

    try {
        const result = await pool.query(
            'SELECT * FROM teams WHERE user_id = $1 ORDER BY updated_at DESC',
            [req.user.id]
        );

        // Parse the JSON data for each team
        const teams = result.rows.map(team => parseTeamData(team));

        console.log(`Found ${teams.length} teams for user ${req.user.id}`);
        res.json(teams);
    } catch (err) {
        console.error('Error fetching teams:', err);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Get specific team by ID
router.get('/:id', isAuthenticated, async (req, res) => {
    console.log('=== GET /:id ===');
    console.log('Team ID:', req.params.id, 'User:', req.user.id);

    try {
        const result = await pool.query(
            'SELECT * FROM teams WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            console.log('Team not found');
            return res.status(404).json({ error: 'Team not found' });
        }

        const team = result.rows[0];
        const parsedTeam = parseTeamData(team);

        console.log('Team found:', parsedTeam.name);
        res.json(parsedTeam);
    } catch (err) {
        console.error('Error fetching team:', err);
        res.status(500).json({ error: 'Failed to fetch team' });
    }
});

// Update existing team
router.put('/:id', isAuthenticated, async (req, res) => {
    console.log('=== PUT /:id - Updating team ===');
    console.log('Team ID:', req.params.id, 'User:', req.user.id);
    console.log('Request body:', req.body);

    const { name, pokemon_data } = req.body;
    const teamId = req.params.id;

    if (!name) {
        console.log('Missing team name');
        return res.status(400).json({ error: 'Team name is required' });
    }

    try {
        // Check for duplicate team name for this user (excluding current team)
        const existingTeam = await pool.query(
            'SELECT id FROM teams WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3',
            [req.user.id, name, teamId]
        );

        if (existingTeam.rows.length > 0) {
            console.log('Duplicate team name found:', name);
            return res.status(409).json({ error: 'Team name already exists. Please choose a different name.' });
        }

        // Sanitize the pokemon data
        const sanitizedData = sanitizePokemonData(pokemon_data);

        console.log('Updating team with data:', {
            team_id: teamId,
            name: name,
            pokemon_count: sanitizedData.filter(p => p !== null).length
        });

        const result = await pool.query(
            'UPDATE teams SET name = $1, pokemon_data = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
            [name, JSON.stringify(sanitizedData), teamId, req.user.id]
        );

        if (result.rows.length === 0) {
            console.log('Team not found for update');
            return res.status(404).json({ error: 'Team not found or you are not authorized to update this team' });
        }

        const updatedTeam = result.rows[0];
        // Parse the team data safely - JSONB is already parsed by PostgreSQL
        const parsedTeam = parseTeamData(updatedTeam);

        console.log('Team updated successfully:', parsedTeam.name);
        res.json(parsedTeam);
    } catch (err) {
        console.error('Error updating team:', err);
        res.status(500).json({ error: 'Failed to update team', details: err.message });
    }
});

// Delete team
router.delete('/:id', isAuthenticated, async (req, res) => {
    console.log('=== DELETE /:id ===');
    console.log('Team ID:', req.params.id, 'User:', req.user.id);

    const teamId = req.params.id;

    try {
        const result = await pool.query(
            'DELETE FROM teams WHERE id = $1 AND user_id = $2 RETURNING *',
            [teamId, req.user.id]
        );

        if (result.rows.length === 0) {
            console.log('Team not found for deletion');
            return res.status(404).json({ error: 'Team not found' });
        }

        console.log('Team deleted successfully:', result.rows[0].name);
        res.json({ message: 'Team deleted successfully', deletedTeam: result.rows[0] });
    } catch (err) {
        console.error('Error deleting team:', err);
        res.status(500).json({ error: 'Failed to delete team' });
    }
});

module.exports = router;