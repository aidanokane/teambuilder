import { useState, useEffect } from "react";

const Team = ({ selectedTeam, setTeam, selectedMember, setMember, setSearch }) => {
    const team = selectedTeam ? selectedTeam.pokemon_data : [];

    const Info = ({ pokemon }) => {
        const [pokemonInfo, setPokemonInfo] = useState(pokemon);
        const [selectedMove, setSelectedMove] = useState(-1);
        const [apiData, setData] = useState({});
        const [error, setError] = useState(null);
        
        useEffect(() => {
            if (!pokemon?.name) {
                setData({});
                setError(null);
                return;
            }
            console.log(pokemon.name)
            const ctrl = new AbortController();
            const run = async () => {
                try {
                setError(null);
                const name = pokemon.name.trim().toLowerCase();
                const res = await fetch(`http://localhost:3001/api/pokemon/${name}`, {
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
                const ability = apiData.abilities.find(
                    (item) => (item.ability.name === index)
                );
                console.log(ability);
                setPokemonInfo(prev => {
                    const nextData = ability;
                    return { ...prev, ability: nextData };
                });
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

                const moves = pokemonInfo.moves;
                moves[selectedMove] = apiData.moves[index];
                const newData = {...pokemonInfo, moves}
                saveChanges(newData);
            }
            return (
                <div className="moves-editor">
                    <h3>Moves</h3>
                    <div className="moves-layout">
                        <div className="current-moves">
                            <h4>Current Moves</h4>
                            {pokemonInfo.moves?.map((item, index) => (
                                <button 
                                    key={index} 
                                    onClick={() => setSelectedMove(index)}
                                    className={`move-slot ${selectedMove === index ? 'selected' : ''}`}
                                >
                                    {item.move?.name ? item.move.name : `Move ${index + 1}`}
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
                                        {item.move.name}
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
                        ? (apiData?.sprites?.front_female_shiny || apiData?.sprites?.front_default_shiny)
                        : apiData?.sprites?.front_shiny)
                        : (gender === "female"
                        ? (apiData?.sprites?.front_female || apiData?.sprites?.front_default)
                        : apiData?.sprites?.front_default);
            return(sprite);
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
                const next_data = [...prev.pokemon_data];
                next_data[selectedMember] = nextPokemon;
                console.log("TEAM");
                console.log(next_data);
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
                            {pokemonInfo.types.map((type, index) => (
                                <span key={index} className={`Type-Badge Type-${type.toLowerCase()}`}>
                                    {type}
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
            const nextData = [...(prev.pokemon_data ?? [])];
                delete nextData[selectedMember];
                return { ...prev, pokemon_data: nextData };
            });
    }

    return (
        <div className="Team">
            <div className="Team-Bar">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                <button
                    key={index}
                    className="Member-Button"
                    onClick={() => handleSlotClick(index)}
                >
                <div className="Team-Member">
                    {selectedMember === index && (
                        <img src="/pokeball.png" className="Pokeball"></img>
                    )}
                    {team[index] && (
                        <img src={team[index].sprite} alt={team[index].name} />
                    )}
                </div>
                </button>
                ))}
            </div>
            {team[selectedMember] && (
                <Info pokemon={team[selectedMember]}/>
            )}
        </div>
    )
}

export default Team;
