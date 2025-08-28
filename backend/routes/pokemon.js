const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = express.Router();

router.get('/generations', async (req, res) => {
    try {
        const response = await fetch('https://pokeapi.co/api/v2/generation/');
        const data = await response.json();
        res.json(data.results);
    } catch (err) {
        console.error('Error fetching generations:', err);
        res.status(500).json({ error: 'Failed to fetch generations' });
    }
});

router.get('/generation/:id', async (req, res) => {
    const generationId = req.params.id;
    
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/generation/${generationId}`);
        if (!response.ok) {
            return res.status(404).json({ error: 'Generation not found' });
        }
        
        const data = await response.json();

        const pokemonList = data.pokemon_species
            .map(pokemon => ({
                name: pokemon.name,
                url: pokemon.url,
                pokedexNumber: parseInt(pokemon.url.split('/').slice(-2, -1)[0])
            }))
            .sort((a, b) => a.pokedexNumber - b.pokedexNumber);
        
        res.json({
            generation: data.names.find(n => n.language.name === 'en')?.name || data.name,
            pokemon: pokemonList
        });
    } catch (err) {
        console.error('Error fetching generation:', err);
        res.status(500).json({ error: 'Failed to fetch generation' });
    }
});

router.get('/search/:query', async (req, res) => {
    const query = req.params.query.toLowerCase();
    
    try {
        const allPokemon = [];
        
        for (let gen = 1; gen <= 8; gen++) {
            try {
                const response = await fetch(`https://pokeapi.co/api/v2/generation/${gen}`);
                if (response.ok) {
                    const data = await response.json();
                    const pokemonInGen = data.pokemon_species
                        .filter(pokemon => pokemon.name.includes(query))
                        .map(pokemon => ({
                            name: pokemon.name,
                            generation: gen,
                            pokedexNumber: parseInt(pokemon.url.split('/').slice(-2, -1)[0])
                        }));
                    allPokemon.push(...pokemonInGen);
                }
            } catch (err) {
                console.error(`Failed to fetch generation ${gen}:`, err.message);
            }
        }
        const results = allPokemon
            .sort((a, b) => a.pokedexNumber - b.pokedexNumber)
            .slice(0, 50);
        
        res.json({ results });
    } catch (err) {
        console.error('Error searching Pokémon:', err);
        res.status(500).json({ error: 'Failed to search Pokémon' });
    }
});
router.get('/:name', async (req, res) => {
    const name = req.params.name.toLowerCase();

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);

        if (!response.ok) {
            return res.status(404).json({ error: 'Pokémon not found' });
        }

        const data = await response.json();

        const formattedPokemon = {
            id: data.id,
            name: data.name,
            types: data.types.map(t => t.type.name),
            stats: data.stats.map(s => ({
                name: s.stat.name,
                base_stat: s.base_stat
            })),
            sprites: {
                front_default: data.sprites.front_default,
                front_female: data.sprites.front_female,
                front_shiny: data.sprites.front_shiny,
                front_female_shiny: data.sprites.front_shiny_female,
                back_default: data.sprites.back_default,
                back_shiny: data.sprites.back_shiny
            },
            height: data.height,
            weight: data.weight,
            abilities: data.abilities,
            moves: data.moves
        };
        
        res.json(formattedPokemon);
    } catch (err) {
        console.error('Error fetching Pokémon:', err);
        res.status(500).json({ error: 'Failed to fetch Pokémon' });
    }
});

router.get('/list', async (req, res) => {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/type/`);

        const data = await response.json();
        console.log(data);
        const types = data.results
        res.json(types);
    } catch (err) {
        console.error('Error fetching Types List:', err);
        res.status(500).json({ error: 'Failed to fetch Types List' });
    }
})

router.get('/type/:index', async (req, res) => {
    const index = req.params.index;    
    console.log("GETTING TYPE");
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${index}`);

        if (!response.ok) {
            return res.status(404).json({ error: 'Pokémon not found' });
        }

        const data = await response.json();
        const pokemon = data.pokemon
        res.json(pokemon);
    } catch (err) {
        console.error('Error fetching Pokémon:', err);
        res.status(500).json({ error: 'Failed to fetch Pokémon' });
    }
})

module.exports = router;
