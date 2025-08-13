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

const Team = ({selectedTeam}) => {
    const [selectedMember, setMember] = useState(0);
    const team = selectedTeam ? selectedTeam.pokemon_data : [];

    const Info = ({ pokemon }) => {
        const name = pokemon.name;
        let types = pokemon.types[0];
        if(pokemon.types[1] != "null"){
            types += " | " + pokemon.types[1];
        }
        return (
            <div className="Info">
                <h1>{name}</h1>
                <p>{types}</p>
                <button onClick={() => deleteMember(selectedMember, selectedTeam, setTeam)}>DELETE</button>
            </div>
        )
    }

    console.log("TEAM:");
    console.log(team);
    return (
        <div className="Team">
            <div className="Team-Bar">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                <button
                    key={index}
                    className="Member-Button"
                    onClick={() => setMember(index)}
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

function deleteMember(index, team, setTeam) {
    setTeam(prev => {
    const nextData = [...(prev.pokemon_data ?? [])]; // copy array
    delete nextData[index];                           // leaves a hole
    return { ...prev, pokemon_data: nextData };      // new object ref
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

const Search = ({team, index, setSearch}) => {
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
                                        Add button will be implemented here
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

    const default_team = {
        "name": "default",
        "pokemon_data": [
            {
                "name": "Typhlosion",
                "types": ["Fire", "null"],
                "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/157.png"
            },
            {
                "name": "Noctowl",
                "types": ["Normal", "Flying"],
                "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/164.png"
            },
            {
                "name": "Ampharos",
                "types": ["Electric", "null"],
                "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/181.png"
            },
            {
                "name": "Politoed",
                "types": ["Water", "null"],
                "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/186.png"
            },
            {
                "name": "Espeon",
                "types": ["Psychic", "null"],
                "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/196.png"
            },
            {
                "name": "Scizor",
                "types": ["Bug", "Steel"],
                "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/212.png"
            }
        ]
    }

    const [user, setUser] = useState(null);
    const [message, setMessage] = useState(() => {
        return sessionStorage.getItem("message") !== "false";
    });
    const [teams, setTeams] = useState([]);
    
    const [team, setTeam] = useState({
        name: 'Untitled',
        pokemon_data: Array(6).fill(null)
    });

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
            <Team selectedTeam={team} setTeam={setTeam}/>
            <TeamList teams={teams} setTeam={setTeam}></TeamList>
            {search && (<Search team={team.pokemon_data} index={0} setSearch={setSearch}></Search>)}
        </div>
        <div className="Debug-Bar">
            <button onClick={() => fetchStatus()}>Get User Info</button>
            <button onClick={() => fetchTeams()}>Get User Teams</button>
            <button onClick={signIn}>Sign in</button>
            <button onClick={signOut}>Sign out</button>
            <button onClick={openPopup}>Open Popup</button>
            <button onClick={() => saveTeam(default_team)}>Save Default</button>
            <button onClick={() => saveTeam(team)}>Save Team</button>
            <button onClick={() => setSearch(true)}>Search</button>
        </div>
      </div>
  );
}

export default App;
