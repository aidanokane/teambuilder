import { useState, useEffect } from "react";
import { addMember } from "../utils/teamUtils";

const Search = ({ setTeam, selectedIndex, setSearch, selectedGeneration }) => {
    const [query, setQuery] = useState("");
    const [generations, setGenerations] = useState([]);
    const [pokemonList, setPokemonList] = useState([]);
    const [pokemonByGeneration, setPokemonByGeneration] = useState([])
    const [filteredPokemon, setFilteredPokemon] = useState([]);
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        "type1": [],
        "type2": [],
        "generation": []
    });

    useEffect(() => {
        if (selectedGeneration) {
            fetchPokemonByGeneration(selectedGeneration);
        }
    }, [selectedGeneration]);

    useEffect(() => {
        if (query.trim() === '') {
            setFilteredPokemon(pokemonByGeneration);
        } else {
            const filtered = filteredPokemon.filter(pokemon => 
                pokemon.name.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredPokemon(filtered);
        }
    }, [query, pokemonList]);

    const fetchPokemonByGeneration = async (generationId) => {
        const gen = parseInt(generationId);
        if (gen <= 0) return;

        const ids = Array.from({ length: gen }, (_, i) => i + 1);
        setGenerations(ids);

        setLoading(true);
        try {
            const responses = await Promise.all(
                ids.map(id => fetch(`http://localhost:3001/api/pokemon/generation/${id}`, {
                    credentials: "include",
            })));

            const payloads = await Promise.all(
                responses.map(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return res.json();
            }));

            const merged = payloads.flatMap(p => p.pokemon);
            setPokemonByGeneration(merged);
            console.log("POKEMON UP TO GENERATION 2", merged);
            setFilteredPokemon(merged);
            
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

    const fetchPokemonByType = async (type, index) => {
        setLoading(true);
        setError(null);
        try{
            const res = await fetch(`http://localhost:3001/api/pokemon/type/${index}`, {
                credentials: "include"
            });
            
            if (res.status === 404) {
                setError("Pokémon not found");
                return;
            }
            if (!res.ok) {
                setError(`HTTP ${res.status}`);
                return;
            }
            //convert output
            const data = await res.json();
            const newTypes = data.map(p => p.pokemon);
            const newFilters = (type) ? {...filters, type1: newTypes} : {...filters, type2: newTypes}
            console.log("NEW FILTERS", (type), newFilters);
            //set filters and filter with the new ones
            setFilters(newFilters);
            filterPokemon(newFilters);
        } catch (e) {
            setError(e.message || "Request failed");
        } finally {
            setLoading(false);
        }
    }

    const fetchGenerationFilters = async(id) => {
        setLoading(true);
        setError(null);
        let newGenerationFilter = [];
        
        try {
            const res = await fetch(`http://localhost:3001/api/pokemon/generation/${id}`, {
                credentials: "include",
            });

            if (res.status === 404) {
                // setError("Pokémon not found");
                console.log("Showing pokemon from all generations")
            } else {
                if (!res.ok) {
                    setError(`HTTP ${res.status}`);
                    return;
                }

                const data = await res.json();
                // console.log("DATA", data);
                newGenerationFilter = data.pokemon.map(p => p);
            }
            // console.log("NEW GENERATION FILTER", newGenerationFilter);
            const newFilters = {...filters, generation: newGenerationFilter};
            // console.log("NEW FILTERS",newFilters);
            setFilters(newFilters);
            filterPokemon(newFilters);
        } catch (e) {
            setError(e.message || "Request failed");
        } finally {
            setLoading(false);
        }
    }

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        setSelectedPokemon(null);
        setError(null);
    };

    function union(lists = []) {
        let active = [];
        for(let i = 0; i < lists.length; i++){
            if(lists[i]) active.push(lists[i]);
        }

        let result = pokemonByGeneration;
        for (let i = 0; i < active.length; i++) {
            let row = active[i]
            
            const keys = new Set(row.map(o => o.name));
            result = result.filter(p => keys.has(p.name));
        }
        
        return result;
    }

    function filterPokemon(newFilters){
        function getDexNumber(url){
            const m = String(url).trim().match(/\/(?:pokemon|pokemon-species)\/(\d+)\/?$/);
            return m ? Number(m[1]) : null;
        }
        let lists = Object.values(newFilters);
        console.log("Lists", lists);
        let activeFilters = [];
        for(let i = 0; i < lists.length; i++){
            if(lists[i]?.length) activeFilters.push(lists[i]);
        }

        const newFiltered = union(activeFilters).map(p => ({name: p.name, url: p.url, pokedexNumber: getDexNumber(p.url)}));
        setFilteredPokemon(newFiltered);
    }

    const handlePokemonClick = (pokemonName) => {
        fetchPokemonDetails(pokemonName);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    };

    const handleAddPokemon = () => {
        if (selectedPokemon) {
            addMember(selectedIndex, selectedPokemon, setTeam, setSearch);
        }
    };

    console.log(selectedIndex);

    return (
        <div className="Modal-Overlay">
            <div className="Search-Popup">
                <div className="Search-Header">
                    <h1>Pokemon Search</h1>
                    <button className="Close-Button" onClick={() => setSearch(false)}>✕</button>
                </div>

                <div className="Search-Body">
                    <div className="Search-Left">
                        <div className="Search-Input-Section">
                            <h3>Generation</h3>
                            <select 
                                className="Generation-Select"
                                defaultValue={0}
                                onChange={(e) => fetchGenerationFilters(e.target.value)}
                            >
                                <option key={0} value={0}>All</option>
                                {generations.map(index => (
                                    <option key={index} value={index}>
                                        Generation {index}
                                    </option>
                                ))}
                            </select> */}

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
                                    <button onClick={handleAddPokemon}>
                                        ADD TO TEAM
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="Search-Placeholder">
                                <div className="Placeholder-Icon">🔍</div>
                                <h3>Select a Pokemon</h3>
                                <p>Choose a generation and click on a Pokemon sprite to view details and add it to your team</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Search;