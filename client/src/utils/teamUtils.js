export function addMember(index, data, setTeam, setSearch) {
    console.log('Adding Pokemon to team at index:', index);
    console.log('Pokemon data from API:', data);

    setTeam(prev => {
        // Ensure prev is a valid team object
        if (!prev || typeof prev !== 'object') {
            prev = {
                name: 'Untitled',
                pokemon_data: Array(6).fill(null)
            };
        }

        // Ensure pokemon_data is an array
        const pokemonData = Array.isArray(prev.pokemon_data) ? prev.pokemon_data : Array(6).fill(null);

        // Create a new array with the updated pokemon
        const nextData = [...pokemonData];

        // Create a clean Pokemon object with consistent structure
        const newPokemon = {
            id: data.id || null,
            name: data.name || null,
            types: Array.isArray(data.types)
                ? data.types.map(type => {
                    // Handle both string types and object types from API
                    if (typeof type === 'string') {
                        return type;
                    } else if (type && type.type && type.type.name) {
                        return type.type.name;
                    } else if (type && type.name) {
                        return type.name;
                    }
                    return 'unknown';
                })
                : [],
            stats: Array.isArray(data.stats) ? data.stats : [],
            sprite: data.sprites?.front_default || null,
            held_item: null,
            ability: null,
            moves: [null, null, null, null], // Initialize with null moves that the UI can handle
            gender: "male",
            shiny: false
        };

        nextData[index] = newPokemon;

        console.log('Created Pokemon object:', newPokemon);
        console.log('Updated team data:', nextData);

        setSearch(false);
        return { ...prev, pokemon_data: nextData };
    });
}

// Helper function to create a clean Pokemon object from API data
export function createCleanPokemon(apiData) {
    const pokemon = {
        id: apiData.id || null,
        name: apiData.name || null,
        types: Array.isArray(apiData.types)
            ? apiData.types.map(type => {
                if (typeof type === 'string') {
                    return type;
                } else if (type && type.type && type.type.name) {
                    return type.type.name;
                } else if (type && type.name) {
                    return type.name;
                }
                return 'unknown';
            })
            : [],
        stats: Array.isArray(apiData.stats) ? apiData.stats : [],
        sprite: apiData.sprites?.front_default || null,
        held_item: null,
        ability: null,
        moves: [null, null, null, null],
        gender: "male",
        shiny: false
    };

    console.log('Created clean Pokemon:', pokemon);
    return pokemon;
}

// Helper function to validate team data before saving
export function validateTeamData(team) {
    console.log('Validating team data:', team);

    if (!team || typeof team !== 'object') {
        console.log('Invalid team object, returning default');
        return {
            name: 'Untitled',
            pokemon_data: Array(6).fill(null)
        };
    }

    const validatedTeam = {
        id: team.id, // Preserve ID if it exists
        name: team.name || 'Untitled',
        pokemon_data: Array.isArray(team.pokemon_data)
            ? team.pokemon_data.map((pokemon, index) => {
                if (!pokemon || typeof pokemon !== 'object') {
                    console.log(`Pokemon at index ${index} is null/invalid`);
                    return null;
                }

                const validatedPokemon = {
                    id: pokemon.id || null,
                    name: pokemon.name || null,
                    types: Array.isArray(pokemon.types) ? pokemon.types : [],
                    stats: Array.isArray(pokemon.stats) ? pokemon.stats : [],
                    sprite: pokemon.sprite || null,
                    held_item: pokemon.held_item || null,
                    ability: pokemon.ability || null,
                    moves: Array.isArray(pokemon.moves)
                        ? pokemon.moves.map(move => move || null)
                        : [null, null, null, null],
                    gender: pokemon.gender || "male",
                    shiny: Boolean(pokemon.shiny)
                };

                console.log(`Validated pokemon ${index}:`, validatedPokemon);
                return validatedPokemon;
            })
            : Array(6).fill(null)
    };

    console.log('Final validated team:', validatedTeam);
    return validatedTeam;
}

// Helper function to check if a team is "new" (not saved to database yet)
export function isNewTeam(team) {
    return !team || !team.id || typeof team.id !== 'number' || team.id <= 0;
}

// Helper function to get a summary of team data for debugging
export function getTeamSummary(team) {
    if (!team) return 'No team';

    const pokemonCount = Array.isArray(team.pokemon_data)
        ? team.pokemon_data.filter(p => p !== null).length
        : 0;

    return {
        id: team.id,
        name: team.name,
        pokemonCount,
        isNew: isNewTeam(team)
    };
}