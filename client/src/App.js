import { useEffect, useState, useCallback } from "react";

import './App.css';

const Popup = ({onSignIn, onSkip}) => {
    return (
    <div className="Modal-Overlay">
      <div className="Modal">
        <h2>Get Started</h2>
        <br/>
        <br/>
        <button className="Modal-Button" onClick={onSignIn}>Sign In</button>
        <button className="Modal-Button" onClick={onSkip}>Continue Without</button>
      </div>
    </div>
  );
};

const Team = ({selectedTeam, setTeam, selectedMember, setMember,setSearch}) => {
    const team = selectedTeam ? selectedTeam.pokemon_data : [];

    const Info = ({ pokemon }) => {
        const [pokemonInfo, setPokemonInfo] = useState(pokemon);
        const [selectedMove, setSelectedMove] = useState(-1);
        const [apiData, setData] = useState({});
        const [error, setError] = useState(null);
        //get the pokemon from pokeapi again
        
        //get all possible 
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

        function AbilityMenu({}) {
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
                <div className="dropdown">
                <select
                    value={ability ?? ""}
                    onChange={(e) => setAbility(e.target.value)}
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
                <div className="moves-menu">
                    <div>
                        {pokemonInfo.moves?.map((item, index) => (
                        <button key={index} onClick={() => setSelectedMove(index)}>Move {index}: {item.move?.name}</button>
                    ))}
                    <button onClick={() => setMove(0)}>SET MOVE TO 0</button>
                    </div>
                    
                    
                    <div className="moves-container">
                        {apiData.moves?.map((item, index) => (
                            <button key={index} onClick={() => setMove(index)}>{item.move.name}</button>
                        ))}
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
            <div className="Info">
                <h1>{pokemonInfo.name} ({pokemonInfo.id})</h1>
                <p>{pokemonInfo.types.join(" | ")}</p>
                <p>ABILITY: {pokemonInfo?.ability.ability?.name}</p>
                <AbilityMenu/>
                <p>GENDER: {pokemonInfo.gender}</p>
                <div>
                    <button onClick={() => setGender("male")}>M</button>
                    <button onClick={() => setGender("female")}>F</button>
                </div>
                <p>SPRITE: {pokemonInfo.sprite}</p>
                <p>SHINY: {pokemonInfo.shiny ? "y" : "n"}</p>
                <button onClick={() => setShiny(true)}>SHINY</button>
                <MovesMenu/>
                <button onClick={() => deleteMember()}>DELETE</button>
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

/*
    Sample POKE API
    abilities: {
    0: {ability1},
    1: {ability2}, ...}
*/

/*
    Sample Team Member JSON
    id: 0
    name: ""
    types: [{type1}, {type2}]
    ability: {ability}
    stats: [{hp}, {att}, ... {spe}]
    sprite: ""
    held_item: {held_item}
    moves: [{move1}, {move2}...]
    gender: ""
    shiny: 0
*/

function addMember(index, data, setTeam, setSearch) {
    setTeam(prev => {
    const nextData = [...(prev.pokemon_data ?? [])];
    nextData[index] = {
        "id": data.id,
        "name": data.name,
        "types": data.types,
        "stats": data.stats,
        "sprite": data.sprites.front_default,
        "held_item": {},
        "ability": {},
        "moves": [{}, {}, {}, {}],
        "gender": "male",
        "shiny": false
    }
    setSearch(false);
    return { ...prev, pokemon_data: nextData };
  });
}

const TeamList = ({teams, setTeam}) => {
    return(<div className="Team-List">
                <h2>TEAMS</h2>
                {teams.map((team, index) => (
                    <button
                        key={index}
                        onClick={() => {
                            setTeam(team);
                        }}
                    >TEAM {index}: {team.name}</button>
                ))}
            </div>);
}

const Search = ({setTeam, selectedIndex, setSearch}) => {
    const [query, setQuery] = useState("");
    const [selectedGeneration, setSelectedGeneration] = useState(1);
    const [generations, setGenerations] = useState([]);
    const [pokemonList, setPokemonList] = useState([]);
    const [filteredPokemon, setFilteredPokemon] = useState([]);
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchGenerations();
    }, []);

    useEffect(() => {
        if (selectedGeneration) {
            fetchPokemonByGeneration(selectedGeneration);
        }
    }, [selectedGeneration]);

    useEffect(() => {
        if (query.trim() === '') {
            setFilteredPokemon(pokemonList);
        } else {
            const filtered = pokemonList.filter(pokemon => 
                pokemon.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredPokemon(filtered);
        }
    }, [query, pokemonList]);

    const fetchGenerations = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/pokemon/generations', {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setGenerations(data);
            }
        } catch (e) {
            console.error('Failed to fetch generations:', e);
        }
    };

    const fetchPokemonByGeneration = async (generationId) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/pokemon/generation/${generationId}`, {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setPokemonList(data.pokemon);
                setFilteredPokemon(data.pokemon);
            }
        } catch (e) {
            console.error('Failed to fetch generation Pokémon:', e);
            setError('Failed to fetch Pokémon');
        } finally {
            setLoading(false);
        }
    };

    const fetchPokemonDetails = async (pokemonName) => {
        setLoading(true);
        setError(null);
        
        try {
            const res = await fetch(`http://localhost:3001/api/pokemon/${pokemonName}`, {
                credentials: "include",
            });

            if (res.status === 404) {
                setError("Pokémon not found");
                return;
            }
            if (!res.ok) {
                setError(`HTTP ${res.status}`);
                return;
            }
            
            const data = await res.json();
            setSelectedPokemon(data);
        } catch (e) {
            setError(e.message || "Request failed");
        } finally {
            setLoading(false);
        }
    };

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        setSelectedPokemon(null);
        setError(null);
    };

    const handleGenerationChange = (e) => {
        setSelectedGeneration(parseInt(e.target.value));
        setQuery("");
        setSelectedPokemon(null);
        setError(null);
    };

    const handlePokemonClick = (pokemonName) => {
        fetchPokemonDetails(pokemonName);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };
    console.log(selectedIndex);

    return (
        <div className="Modal-Overlay">
            <div className="Search-Popup">
                <div className="Search-Header">
                    <h1>Pokemon Search</h1>
                    <button className="Close-Button" onClick={() => setSearch(false)}>X</button>
                </div>
                
                <div className="Search-Body">
                    <div className="Search-Left">
                        <div className="Search-Input-Section">
                            <h3>Generation</h3>
                            <select 
                                className="Generation-Select"
                                value={selectedGeneration}
                                onChange={handleGenerationChange}
                            >
                                {generations.map((gen, index) => (
                                    <option key={gen.name} value={index + 1}>
                                        {gen.name.replace('generation-', 'Generation ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                            
                            <h3>Search Pokémon</h3>
                            <input
                                className="Search-Input"
                                value={query}
                                onChange={handleQueryChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Type to filter Pokémon..."
                                autoFocus
                            />
                            
                            {error && (
                                <div className="Error-Message">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="Pokemon-Grid-Section">
                            <h3>Pokémon ({filteredPokemon.length})</h3>
                            {loading ? (
                                <div className="Loading-Message">Loading...</div>
                            ) : (
                                <div className="Pokemon-Grid">
                                    {filteredPokemon.map((pokemon, index) => (
                                        <button
                                            key={index}
                                            className="Pokemon-Grid-Item"
                                            onClick={() => handlePokemonClick(pokemon.name)}
                                            title={`${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)} (#${pokemon.pokedexNumber})`}
                                        >
                                            <img 
                                                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokedexNumber}.png`}
                                                alt={pokemon.name}
                                                className="Pokemon-Grid-Sprite"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="Search-Right">
                        {selectedPokemon ? (
                            <div className="Pokemon-Details">
                                <div className="Pokemon-Header">
                                    <img 
                                        src={selectedPokemon.sprites.front_default} 
                                        alt={selectedPokemon.name}
                                        className="Pokemon-Sprite"
                                    />
                                    <div className="Pokemon-Info">
                                        <h2>{selectedPokemon.name.charAt(0).toUpperCase() + selectedPokemon.name.slice(1)}</h2>
                                        <div className="Pokemon-Types">
                                            {selectedPokemon.types.map((type, index) => (
                                                <span key={index} className={`Type-Badge Type-${type.toLowerCase()}`}>
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="Pokemon-Stats">
                                    <h3>Base Stats</h3>
                                    <div className="Stats-Grid">
                                        {selectedPokemon.stats.map((stat, index) => (
                                            <div key={index} className="Stat-Item">
                                                <span className="Stat-Name">{stat.name.toUpperCase()}</span>
                                                <span className="Stat-Value">{stat.base_stat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="Pokemon-Actions">
                                    <p className="Team-Note">
                                        <button onClick={() => addMember(selectedIndex, selectedPokemon, setTeam, setSearch)}>ADD</button>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="Search-Placeholder">
                                <div className="Placeholder-Icon">Search</div>
                                <h3>Select a Pokemon</h3>
                                <p>Choose a generation and click on a Pokemon sprite to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

function App() {

    const [user, setUser] = useState(null);
    const [message, setMessage] = useState(() => {
        return sessionStorage.getItem("message") !== "false";
    });
    const [teams, setTeams] = useState([]);
    const [team, setTeam] = useState({
        name: 'Untitled',
        pokemon_data: Array(6).fill(null)
    });
    const [selectedMember, setMember] = useState(0);
    const [search, setSearch] = useState(false);

    const closePopup = useCallback(() => {
        setMessage(false);
        sessionStorage.setItem("message", "false");
    }, []);

    const openPopup = useCallback(() => {
        setMessage(true);
        sessionStorage.setItem("message", "true");
    }, []);

    const signIn = () => {
        setMessage(false);
        sessionStorage.setItem("message", "false");
        window.location.href = 'http://localhost:3001/auth/google'; // full redirect
    };

    const signOut = async () => {
    setUser(null);
    window.location.href = 'http://localhost:3001/auth/logout'; // full redirect
    };

    const fetchStatus = useCallback(async ({signal} = {}) => {
        try {
        const res = await fetch(`http://localhost:3001/auth/status`, {
            credentials: "include",
            signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setUser(data.authenticated ? data.user : null);
        } catch (e) {
        if (e.name !== "AbortError") console.error(e);
            setUser(null);
        }
    }, []);

    const fetchTeams = useCallback(async ({signal} = {}) => {
        try {
        const res = await fetch(`http://localhost:3001/api/teams/my-teams`, {
            credentials: "include",
            signal,
        });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setTeams(data)
        } catch (e) {
            if (e.name !== "AbortError") console.error(e);
            setTeams([]);
        }
    }, []);

    const saveTeam = useCallback(async (team) => {
        try{
            const res = await fetch('http://localhost:3001/api/teams/save', {
                method: "POST",
                credentials: "include",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    "name": team.name,
                    "pokemon_data": JSON.stringify(team.pokemon_data)
                })});
        } catch (e) {
            if (e.name !== "AbortError") console.error(e);
        }
    }, []);

    useEffect(() => {
        const ctrl = new AbortController();
        fetchStatus({ signal: ctrl.signal }).catch(e => {
            if (e.name !== "AbortError") console.error(e);
            setUser(null);
        });
        return () => ctrl.abort();
        }, [fetchStatus]);

    useEffect(() => {
        const ctrl = new AbortController();
        fetchTeams({ signal: ctrl.signal }).catch(e => {
            if(e.name !== "AbortError") console.error(e);
            setTeams([]);
        });
        return () => ctrl.abort();
        }, [fetchTeams]);    
    return (
      <div className="App">
        <div className="navbar">Welcome {user ? user.name : "Guest"}</div>
        {message && <Popup onSignIn={signIn} onSkip={closePopup}/>}
        <div style={{"display": "flex", "gap": "20px"}}>
            <Team selectedTeam={team} setTeam={setTeam} selectedMember={selectedMember} setMember={setMember} setSearch={setSearch}/>
            <TeamList teams={teams} setTeam={setTeam}></TeamList>
            {search && (<Search setTeam={setTeam} selectedIndex={selectedMember} setSearch={setSearch}></Search>)}
        </div>
        <div className="Debug-Bar">
            <button onClick={() => fetchStatus()}>Get User Info</button>
            <button onClick={() => fetchTeams()}>Get User Teams</button>
            <button onClick={signIn}>Sign in</button>
            <button onClick={signOut}>Sign out</button>
            <button onClick={openPopup}>Open Popup</button>
            <button onClick={() => saveTeam(team)}>Save Team</button>
            <button onClick={() => setSearch(true)}>Search</button>
        </div>
      </div>
  );
}

export default App;
