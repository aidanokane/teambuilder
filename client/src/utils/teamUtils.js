export function addMember(index, data, setTeam, setSearch) {
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
        };
        setSearch(false);
        return { ...prev, pokemon_data: nextData };
    });
}
