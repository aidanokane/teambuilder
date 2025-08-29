import { useState, useEffect, useRef } from "react";

const Team = ({ selectedTeam, setTeam, selectedMember, setMember, setSearch, onSaveTeam, onNewTeam, teams, setTeams, selectedGeneration, setSelectedGeneration }) => {
    const team = selectedTeam ? selectedTeam.pokemon_data : [];
    const fileInputRef = useRef(null);

    // CSV Export functionality
    const exportToCSV = () => {
        if (!teams || teams.length === 0) {
            alert('No teams to export!');
            return;
        }

        const csvData = [];

        teams.forEach(team => {
            const teamName = team.name || 'Untitled';
            const pokemonData = Array.isArray(team.pokemon_data) ? team.pokemon_data : [];

            // If team has no Pokemon, still add a row for the team
            if (pokemonData.every(p => !p)) {
                csvData.push({
                    team_name: teamName,
                    team_id: team.id || '',
                    pokemon_name: '',
                    pokemon_id: '',
                    types: '',
                    ability: '',
                    move_1: '',
                    move_2: '',
                    move_3: '',
                    move_4: '',
                    gender: '',
                    shiny: '',
                    slot_position: ''
                });
            } else {
                // Add each Pokemon as a row
                pokemonData.forEach((pokemon, index) => {
                    if (pokemon) {
                        csvData.push({
                            team_name: teamName,
                            team_id: team.id || '',
                            pokemon_name: pokemon.name || '',
                            pokemon_id: pokemon.id || '',
                            types: Array.isArray(pokemon.types) ? pokemon.types.join('|') : '',
                            ability: pokemon.ability?.ability?.name || '',
                            move_1: pokemon.moves?.[0]?.move?.name || '',
                            move_2: pokemon.moves?.[1]?.move?.name || '',
                            move_3: pokemon.moves?.[2]?.move?.name || '',
                            move_4: pokemon.moves?.[3]?.move?.name || '',
                            gender: pokemon.gender || 'male',
                            shiny: pokemon.shiny ? 'true' : 'false',
                            slot_position: index + 1
                        });
                    }
                });
            }
        });

        // Convert to CSV string
        const headers = Object.keys(csvData[0] || {});
        const csvString = [
            headers.join(','),
            ...csvData.map(row =>
                headers.map(header => {
                    const value = row[header]?.toString() || '';
                    // Escape commas and quotes in CSV values
                    return value.includes(',') || value.includes('"') ? `"${value.replace(/"/g, '""')}"` : value;
                }).join(',')
            )
        ].join('\n');

        // Create and trigger download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pokemon_teams_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('Teams exported to CSV successfully');
    };

    // CSV Import functionality
    const importFromCSV = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());

                const importedTeams = {};

                // Parse CSV data
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;

                    const values = [];
                    let currentValue = '';
                    let inQuotes = false;

                    // Simple CSV parser that handles quoted values
                    for (let j = 0; j < lines[i].length; j++) {
                        const char = lines[i][j];
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === ',' && !inQuotes) {
                            values.push(currentValue.trim());
                            currentValue = '';
                        } else {
                            currentValue += char;
                        }
                    }
                    values.push(currentValue.trim());

                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });

                    const teamName = row.team_name || 'Imported Team';

                    if (!importedTeams[teamName]) {
                        importedTeams[teamName] = {
                            name: teamName,
                            pokemon_data: Array(6).fill(null)
                        };
                    }

                    // Add Pokemon to team if data exists
                    if (row.pokemon_name && row.slot_position) {
                        const slotIndex = parseInt(row.slot_position) - 1;
                        if (slotIndex >= 0 && slotIndex < 6) {
                            importedTeams[teamName].pokemon_data[slotIndex] = {
                                name: row.pokemon_name,
                                id: parseInt(row.pokemon_id) || null,
                                types: row.types ? row.types.split('|') : [],
                                ability: row.ability ? { ability: { name: row.ability } } : null,
                                moves: [
                                    row.move_1 ? { move: { name: row.move_1 } } : null,
                                    row.move_2 ? { move: { name: row.move_2 } } : null,
                                    row.move_3 ? { move: { name: row.move_3 } } : null,
                                    row.move_4 ? { move: { name: row.move_4 } } : null
                                ],
                                gender: row.gender || 'male',
                                shiny: row.shiny === 'true',
                                sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${row.pokemon_id || '1'}.png`
                            };
                        }
                    }
                }

                // Add imported teams to existing teams
                const teamsArray = Object.values(importedTeams);
                if (teamsArray.length > 0) {
                    setTeams(prev => [...(Array.isArray(prev) ? prev : []), ...teamsArray]);
                    alert(`Successfully imported ${teamsArray.length} team(s)!`);
                    console.log('Imported teams:', teamsArray);
                } else {
                    alert('No valid team data found in CSV file.');
                }

            } catch (error) {
                console.error('Error importing CSV:', error);
                alert('Error importing CSV file. Please check the file format.');
            }
        };

        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const Info = ({ pokemon }) => {
        const [pokemonInfo, setPokemonInfo] = useState(() => {
            // Initialize with proper structure to avoid null reference errors
            return {
                ...pokemon,
                moves: pokemon?.moves || [null, null, null, null],
                ability: pokemon?.ability || null,
                types: pokemon?.types || [],
                stats: pokemon?.stats || []
            };
        });
        const [selectedMove, setSelectedMove] = useState(-1);
        const [apiData, setData] = useState({});
        const [error, setError] = useState(null);

        // Update pokemonInfo when pokemon prop changes
        useEffect(() => {
            if (pokemon) {
                setPokemonInfo({
                    ...pokemon,
                    moves: pokemon.moves || [null, null, null, null],
                    ability: pokemon.ability || null,
                    types: pokemon.types || [],
                    stats: pokemon.stats || []
                });
            }
        }, [pokemon]);

        useEffect(() => {
            if (!pokemon?.name) {
                setData({});
                setError(null);
                return;
            }

            const ctrl = new AbortController();
            const run = async () => {
                try {
                    setError(null);
                    const name = pokemon.name.trim().toLowerCase();
                    const res = await fetch(`http://localhost:3001/api/pokemon/pokemon/${name}`, {
                        credentials: "include",
                        signal: ctrl.signal,
                    });

                    if (res.status === 404) {
                        setData({});
                        setError("Pokémon not found");
                        return;
                    }
                    if (!res.ok) {
                        setData({});
                        setError(`HTTP ${res.status}`);
                        return;
                    }

                    const json = await res.json();
                    setData(json);
                } catch (e) {
                    if (e.name !== "AbortError") {
                        console.error(e);
                        setData({});
                        setError("Error getting Pokémon info");
                    }
                }
            };

            run();
            return () => ctrl.abort();
        }, [pokemon?.name]);

        function AbilityMenu() {
            function setAbility(index) {
                const ability = apiData.abilities?.find(
                    (item) => (item.ability.name === index)
                );
                if (ability) {
                    setPokemonInfo(prev => {
                        return { ...prev, ability: ability };
                    });
                }
            }

            const ability = pokemonInfo.ability?.ability?.name;
            return (
                <div className="ability-section">
                    <h3>Ability</h3>
                    <select
                        value={ability ?? ""}
                        onChange={(e) => setAbility(e.target.value)}
                        className="ability-select"
                    >
                        <option value="" disabled>
                            Select an ability
                        </option>
                        {apiData.abilities?.map((item, index) => (
                            <option key={index} value={item.ability.name}>
                                {item.ability.name}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        function MovesMenu() {
            function setMove(index){
                if(selectedMove === -1){
                    return;
                }

                const moves = [...(pokemonInfo.moves || [null, null, null, null])];
                moves[selectedMove] = apiData.moves[index];
                const newData = {...pokemonInfo, moves}
                saveChanges(newData);
            }

            // Ensure moves array exists and has proper structure
            const currentMoves = pokemonInfo.moves || [null, null, null, null];

            return (
                <div className="moves-editor">
                    <h3>Moves</h3>
                    <div className="moves-layout">
                        <div className="current-moves">
                            <h4>Current Moves</h4>
                            {currentMoves.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedMove(index)}
                                    className={`move-slot ${selectedMove === index ? 'selected' : ''}`}
                                >
                                    {item?.move?.name || `Move ${index + 1}`}
                                </button>
                            ))}
                        </div>

                        <div className="available-moves">
                            <h4>Available Moves</h4>
                            <div className="moves-grid">
                                {apiData.moves?.slice(0, 50).map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setMove(index)}
                                        className="move-option"
                                        disabled={selectedMove === -1}
                                    >
                                        {item?.move?.name || 'Unknown Move'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        const getSprite = (gender, shiny) => {
            const sprite =
                shiny ? (gender === "female"
                        ? (apiData?.sprites?.front_female_shiny || apiData?.sprites?.front_shiny)
                        : apiData?.sprites?.front_shiny)
                    : (gender === "female"
                        ? (apiData?.sprites?.front_female || apiData?.sprites?.front_default)
                        : apiData?.sprites?.front_default);
            return sprite;
        }

        function setGender(gender) {
            const sprite = getSprite(gender, pokemonInfo.shiny);
            const nextPokemon = { ...pokemonInfo, gender, sprite };
            saveChanges(nextPokemon);
        }

        function setShiny() {
            const shiny = !pokemonInfo.shiny;
            const sprite = getSprite(pokemonInfo.gender, shiny);
            const nextPokemon = { ...pokemonInfo, shiny, sprite };
            saveChanges(nextPokemon);
        }

        function saveChanges(nextPokemon){
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

                const next_data = [...pokemonData];
                next_data[selectedMember] = nextPokemon;

                return { ...prev, pokemon_data: next_data};
            });
            setPokemonInfo(nextPokemon);
        }

        return (
            <div className="pokemon-editor">
                <div className="pokemon-header">
                    <img
                        src={pokemonInfo.sprite}
                        alt={pokemonInfo.name}
                        className="pokemon-editor-sprite"
                    />
                    <div className="pokemon-basic-info">
                        <h1>{pokemonInfo.name} #{pokemonInfo.id}</h1>
                        <div className="pokemon-types">
                            {(pokemonInfo.types || []).map((type, index) => (
                                <span key={index} className={`Type-Badge Type-${typeof type === 'string' ? type.toLowerCase() : (type?.type?.name || type?.name || 'unknown').toLowerCase()}`}>
                                    {typeof type === 'string' ? type : (type?.type?.name || type?.name || 'Unknown')}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="editor-sections">
                    <div className="editor-section">
                        <div className="setting-group">
                            <label>Gender:</label>
                            <div className="gender-buttons">
                                <button
                                    onClick={() => setGender("male")}
                                    className={`gender-btn ${pokemonInfo.gender === "male" ? "active" : ""}`}
                                >
                                    Male
                                </button>
                                <button
                                    onClick={() => setGender("female")}
                                    className={`gender-btn ${pokemonInfo.gender === "female" ? "active" : ""}`}
                                >
                                    Female
                                </button>
                            </div>
                        </div>

                        <div className="setting-group">
                            <label>Shiny:</label>
                            <button
                                onClick={() => setShiny()}
                                className={`shiny-btn ${pokemonInfo.shiny ? "active" : ""}`}
                            >
                                {pokemonInfo.shiny ? "Shiny" : "Normal"}
                            </button>
                        </div>
                    </div>

                    <AbilityMenu />

                    <MovesMenu />

                    <div className="editor-actions">
                        <button
                            onClick={() => deleteMember()}
                            className="delete-btn"
                        >
                            Remove from Team
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const handleSlotClick = (index) => {
        setMember(index);
        if (!team[index]) setSearch(true); // open search if empty
    };

    function deleteMember() {
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

            const nextData = [...pokemonData];
            nextData[selectedMember] = null; // Set to null instead of deleting
            return { ...prev, pokemon_data: nextData };
        });
    }

    const handleSaveTeam = async () => {
        if (!onSaveTeam) {
            console.error('onSaveTeam function not provided');
            alert('Save function not available');
            return;
        }

        console.log('=== TEAM COMPONENT SAVE DEBUG ===');
        console.log('selectedTeam before save:', selectedTeam);

        try {
            const result = await onSaveTeam(selectedTeam);

            console.log('Save result:', result);

            if (result && result.success) {
                alert('Team saved successfully!');
            } else {
                console.error('Save failed with result:', result);
                alert(`Failed to save team: ${result?.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error in handleSaveTeam:', error);
            alert('Error saving team. Please try again.');
        }
    };

    const handleNewTeam = () => {
        if (!onNewTeam) {
            console.error('onNewTeam function not provided');
            alert('New team function not available');
            return;
        }

        // Just create a new local team - don't save yet
        onNewTeam('Untitled');
    };

    return (
        <div className="Team">
            <div className="Team-Header">
                <h2>TEAM BUILDER</h2>
                <div className="Team-Name-Section">
                    <input
                        type="text"
                        defaultValue={selectedTeam?.name || 'Untitled'}
                        value={selectedTeam?.name}
                        onChange={(e) => setTeam(prev => {
                            // Ensure prev is a valid team object
                            if (!prev || typeof prev !== 'object') {
                                prev = {
                                    name: 'Untitled',
                                    pokemon_data: Array(6).fill(null)
                                };
                            }
                            return { ...prev, name: e.target.value };
                        })}
                        className="Team-Name-Input"
                        placeholder="Enter team name..."
                    />
                    <button
                        className="Save-Team-Button"
                        onClick={handleSaveTeam}
                        disabled={!onSaveTeam}
                    >
                        Save Team
                    </button>
                    <button
                        className="New-Team-Button"
                        onClick={handleNewTeam}
                    >
                        + New Team
                    </button>
                    <button
                        className="Export-CSV-Button"
                        onClick={exportToCSV}
                        disabled={!teams || teams.length === 0}
                        title="Export all teams to CSV"
                    >
                        📄 Export CSV
                    </button>
                    <button
                        className="Import-CSV-Button"
                        onClick={handleImportClick}
                        title="Import teams from CSV"
                    >
                        📁 Import CSV
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={importFromCSV}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>
            <select className="Generation-Select"
                    value={selectedGeneration}
                    onChange={(e) => setSelectedGeneration(e.target.value)}>{[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                <option key={index} value={index+1}>Generation {index+1}</option>
            ))}</select>
            
            <div className="Team-Bar">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                    <button
                        key={index}
                        className="Member-Button"
                        onClick={() => handleSlotClick(index)}
                    >
                        <div className="Team-Member">
                            {selectedMember === index && (
                                <img src="/pokeball.png" className="Pokeball" alt="Selected"></img>
                            )}
                            {team[index] && (
                                <img src={team[index].sprite} alt={team[index].name} />
                            )}
                        </div>
                    </button>
                ))}
            </div>
            <div className="pokemon-editor-container">
                {team[selectedMember] && (
                    <Info pokemon={team[selectedMember]}/>
                )}
            </div>
        </div>
    )
}

export default Team;