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
        "types": [null, null],
        "generation": [null]
    });

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
        const gen = parseInt(generationId);
        if (gen <= 0) return;

        const ids = Array.from({ length: gen }, (_, i) => i + 1);

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
            setPokemonByGeneration(merged)
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
        console.log(index);
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
            const newTypes = filters.types;
            newTypes[type] = data.map(p => p.pokemon);
            const newFilters = {...filters, types: newTypes}

            //set filters and filter with the new ones
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

    const handleGenerationChange = (e) => {
        // setQuery("");
        // setSelectedPokemon(null);
        // setError(null);
    };

    function union(lists = []) {
        if(!lists.length) return null;
        let active = [];
        for(let i = 0; i < lists.length; i++){
            if(lists[i]) active.push(lists[i]);
        }
        console.log("ACTIVE", active);
        // let result = [active[0].map(p => [p.pokemon.name, p.pokemon])];
        let result = pokemonByGeneration;
        console.log("RESULT[0]", result)
        for (let i = 0; i < active.length; i++) {
            console.log("ACTIVE[i]", active[i])
            let row = active[i]
            console.log("ROW", row);
            const keys = new Set(row.map(o => o.name));
            console.log("KEYS", keys);
            result = result.filter(p => keys.has(p.name));
        }
        
        console.log("RESULT", result);
        return result;
    }

    function filterPokemon(newFilters){
        function getDexNumber(url){
            const m = String(url).trim().match(/\/(?:pokemon|pokemon-species)\/(\d+)\/?$/);
            console.log(m);
            return m ? Number(m[1]) : null;
        }
        console.log("Fetching pokemon with the following filters", newFilters);
        console.log("FILTERED POKEMON",filteredPokemon);
        let lists = Object.values(newFilters);
        console.log("LISTS", lists);

        // const types = [...filters.types[0], ...filters.types[1]];
        // console.log("TYPES", types);
        // const entries = types.map(p => [p.pokemon.name, p.pokemon]);
        // console.log("ENTRIES", entries);
        // const merged = [...new Map(entries).values()];
        // console.log("MERGED", merged);

        const type1 = filters.types[0] ?? null;
        const type2 = filters.types[1] ?? null;
        let unioned = union([type1, type2]);
        console.log("UNIONED", unioned);

        let activeFilters = [unioned];
        for(let i = 1; i < lists.length; i++){
            if(!lists[i]?.length){
                activeFilters.push(lists[i]);
                console.log("PUSH", lists[i], lists[i].length);}
        }

        console.log("ACTIVE FILTERS", activeFilters);
        const newFiltered = union(activeFilters).map(p => ({name: p.name, url: p.url, pokedexNumber: getDexNumber(p.url)}));
        console.log("NEWFILTERED", newFiltered);
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
                            {/* <select 
                                className="Generation-Select"
                                value={selectedGeneration}
                                onChange={handleGenerationChange}
                            >
                                {generations.map((gen, index) => (
                                    <option key={gen.name} value={index + 1}>
                                        {gen.name.replace('generation-', 'Generation ').toUpperCase()}
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