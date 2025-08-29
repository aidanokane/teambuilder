import { useState, useEffect } from "react";
import { addMember } from "../utils/teamUtils";

const Search = ({ setTeam, selectedIndex, setSearch, selectedGeneration, typesList }) => {
    const [query, setQuery] = useState("");
    const [abilityQuery, setAbilityQuery] = useState("");
    const [abilityList, setAbilityList] = useState([]);
    const [filteredAbilities, setFilteredAbilities] = useState([]);
    const [generations, setGenerations] = useState([]);
    const [pokemonQuery, setPokemonQuery] = useState([]);
    const [pokemonByGeneration, setPokemonByGeneration] = useState([])
    const [filteredPokemon, setFilteredPokemon] = useState([]);
    const [selectedPokemon, setSelectedPokemon] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        "type1": [],
        "type2": [],
        "ability": [],
        "generation": []
    });

    useEffect(() => {
        if (selectedGeneration) {
            fetchPokemonByGeneration(selectedGeneration);
        }
    }, [selectedGeneration]);

    useEffect(() => {
        if (query.trim() === '') {
            setPokemonQuery(filteredPokemon);
        } else {
            const filtered = filteredPokemon.filter(pokemon => 
                pokemon.name.toLowerCase().includes(query.toLowerCase())
            );
            setPokemonQuery(filtered);
        }
    }, [query, filteredPokemon]);

    useEffect(() => {
        fetchAbilities();
    }, []);

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
            setFilteredPokemon(merged);
            setPokemonQuery(merged);
            
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
            const res = await fetch(`http://localhost:3001/api/pokemon/pokemon/${pokemonName}`, {
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

    const fetchPokemonByType = async (index, type) => {
        let newTypes = [];
        setLoading(true);
        setError(null);
        try{
            if(type > 0){
                const res = await fetch(`http://localhost:3001/api/pokemon/type/${type}`, {
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
                console.log("INDEX", index);
                //convert output
                const data = await res.json();
                newTypes = data.map(p => p.pokemon);
            }
            const newFilters = index.index ? {...filters, type1: newTypes} : {...filters, type2: newTypes}
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
            if(id > 0){
                const res = await fetch(`http://localhost:3001/api/pokemon/generation/${id}`, {
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

    const fetchPokemonByAbility = async(ability) => {
        setError(null);
        setLoading(true);

        try{
            const res = await fetch(`http://localhost:3001/api/pokemon/ability/${ability}`, {
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
            const data = await res.json();
            const newAbilityFilter = data.pokemon.map(p => p.pokemon);
            const newFilters = {...filters, ability: newAbilityFilter}
            setFilters(newFilters);
            filterPokemon(newFilters);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    const fetchAbilities = async () => {
        setLoading(true);
        setError(null);
        console.log("FETCHING ABILITIES");
        try {
            const res = await fetch('http://localhost:3001/api/pokemon/abilities', {
                credentials: "include",
            });

            if (res.status === 404) {
                setError("Abilities not found");
                return;
            }

            if (!res.ok) {
                setError(`HTTP ${res.status}`);
                return;
            }

            const data = await res.json();
            setAbilityList(data.map(ability => ability.name));
        } catch (e) {
            console.error("Error getting abilities:", e);
            setError(e);
        } finally {
            setLoading(false);
        }
    }

    const handleQueryChange = (e) => {
        setQuery(e.target.value);
        setSelectedPokemon(null);
        setError(null);
    };

    const handleAbilityQueryChange = (value) => {
        setAbilityQuery(value);
        console.log(abilityList);
        const abilities = abilityList.filter(ability => ability.includes(value));
        setFilteredAbilities(abilities);
    }

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
                            <h3>Search Pokémon</h3>
                            <input
                                className="Search-Input"
                                value={query}
                                onChange={handleQueryChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Type to filter Pokémon..."
                                autoFocus
                            />
                            <h3>Types</h3>
                            <div className="Types-Input">
                                {["Type 1", "Type 2"].map((value, index) => (
                                <div key={index}>
                                    <p>{value}</p>
                                    <select
                                        className="TypeSelect"
                                        name={value}
                                        id={index}
                                        defaultValue={0}
                                        onChange={(e) => fetchPokemonByType({index}, e.target.value)} 
                                    >
                                        <option key={0} value={0}>All</option>
                                        {typesList.map((value, index) => (
                                            <option key={index+1} value={index+1}>
                                                {value}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                            </div>
                            <h3>Ability</h3>
                            <input
                                className="Ability-Input"
                                value={abilityQuery}
                                onChange={(e) => handleAbilityQueryChange(e.target.value)}
                            />
                            <div className="Ability-List">
                                {filteredAbilities.map((ability, index) => (
                                <button
                                    key={index}
                                    value={ability}
                                    onClick={(e) => fetchPokemonByAbility(e.target.value)}
                                >{ability}</button>
                                ))}
                            </div>
                            <h3>Generation</h3>
                            <select className="Generation-Select"
                                defaultValue={0}
                                onChange={(e) => fetchGenerationFilters(e.target.value)}
                            >
                                <option key={0} value={0}>All</option>
                                {generations.map(index => (
                                    <option key={index} value={index}>
                                        Generation {index}
                                    </option>
                                ))}
                            </select>
                            

                            {error && (
                                <div className="Error-Message">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="Search-Middle">
                        <div className="Pokemon-Grid-Section">
                            <h3>Pokémon ({pokemonQuery.length})</h3>
                            {loading ? (
                                <div className="Loading-Message">Loading...</div>
                            ) : (
                                <div className="Pokemon-Grid">
                                    {pokemonQuery.map((pokemon, index) => (
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