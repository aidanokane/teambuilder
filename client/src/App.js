import { useEffect, useState, useCallback } from "react";
import Popup from './components/Popup';
import Team from './components/Team';
import Search from './components/Search';
import Teams from './components/Teams';
import './styles/index.css';

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
    const [loadedTeamName, setLoadedTeamName] = useState(null);
    const [isTeamLoaded, setIsTeamLoaded] = useState(false);
    const [selectedGeneration, setSelectedGeneration] = useState(2);

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
        window.location.href = 'http://localhost:3001/auth/google';
    };

    const signOut = async () => {
        setUser(null);
        setTeam({
            name: 'Untitled',
            pokemon_data: Array(6).fill(null)
        });
        setLoadedTeamName(null);
        setIsTeamLoaded(false);
        setMember(0);
        window.location.href = 'http://localhost:3001/auth/logout';
    };

    const typesList = [
        "normal", "fighting", "flying", "poison", "ground", "rock", "bug",
        "ghost", "steel", "fire", "water", "grass", "electric", "psychic",
        "ice", "dragon", "dark", "fairy"
    ];

    const fetchStatus = useCallback(async ({ signal } = {}) => {
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

    const fetchTeams = useCallback(async ({ signal } = {}) => {
        try {
            const res = await fetch(`http://localhost:3001/api/teams/my-teams`, {
                credentials: "include",
                signal,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            console.log('Fetched teams:', data);
            setTeams(data);
        } catch (e) {
            if (e.name !== "AbortError") console.error(e);
            setTeams([]);
        }
    }, []);

    // Helper function to clean team data for saving
    const cleanTeamData = useCallback((teamData) => {
        return {
            id: teamData.id,
            name: (teamData.name || 'Untitled').trim(),
            pokemon_data: Array.isArray(teamData.pokemon_data)
                ? teamData.pokemon_data.map(pokemon => {
                    if (!pokemon || typeof pokemon !== 'object') {
                        return null;
                    }

                    return {
                        id: pokemon.id || null,
                        name: pokemon.name || null,
                        types: Array.isArray(pokemon.types) ? pokemon.types : [],
                        stats: Array.isArray(pokemon.stats) ? pokemon.stats : [],
                        sprite: pokemon.sprite || null,
                        held_item: pokemon.held_item || null,
                        ability: pokemon.ability || null,
                        moves: Array.isArray(pokemon.moves)
                            ? pokemon.moves.map(move => move && typeof move === 'object' ? move : null)
                            : [null, null, null, null],
                        gender: pokemon.gender || "male",
                        shiny: Boolean(pokemon.shiny)
                    };
                })
                : Array(6).fill(null)
        };
    }, []);

    const saveTeam = useCallback(async (teamToSave) => {
        try {
            console.log('=== SAVE TEAM START ===');
            console.log('Raw team to save:', teamToSave);

            const cleanedTeam = cleanTeamData(teamToSave);
            console.log('Cleaned team:', cleanedTeam);

            // Determine if this is an update or create
            // Only treat as update if team has a valid numeric database ID
            const hasValidId = cleanedTeam.id && typeof cleanedTeam.id === 'number' && cleanedTeam.id > 0;
            const isUpdate = hasValidId;

            console.log('Operation type:', isUpdate ? 'UPDATE' : 'CREATE');
            console.log('Team ID:', cleanedTeam.id, 'Type:', typeof cleanedTeam.id, 'Valid:', hasValidId);

            const url = isUpdate
                ? `http://localhost:3001/api/teams/${cleanedTeam.id}`
                : 'http://localhost:3001/api/teams/save';
            const method = isUpdate ? 'PUT' : 'POST';

            console.log('Making request:', method, url);

            const response = await fetch(url, {
                method: method,
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: cleanedTeam.name,
                    pokemon_data: cleanedTeam.pokemon_data
                })
            });

            console.log('Response status:', response.status, response.statusText);

            if (response.ok) {
                const savedTeam = await response.json();
                console.log('Team saved successfully:', savedTeam);

                // Update current team state
                setTeam(savedTeam);
                setLoadedTeamName(savedTeam.name);
                setIsTeamLoaded(true);

                // Refresh teams list
                await fetchTeams();

                console.log('=== SAVE TEAM SUCCESS ===');
                return { success: true, team: savedTeam };
            } else {
                const errorText = await response.text();
                console.error('Save failed with status:', response.status);
                console.error('Error response:', errorText);
                return { success: false, error: `Server error: ${response.status} - ${errorText}` };
            }
        } catch (error) {
            console.error('Save team error:', error);
            return { success: false, error: error.message };
        }
    }, [cleanTeamData, fetchTeams]);

    const createNewTeam = useCallback((teamName = 'Untitled') => {
        console.log('Creating new team:', teamName);
        // Create a completely new team without any ID
        const newTeam = {
            name: teamName,
            pokemon_data: Array(6).fill(null)
            // No ID - this ensures it will be treated as a new team
        };

        // Set the local state
        setTeam(newTeam);
        setLoadedTeamName(null); // Not loaded from DB
        setIsTeamLoaded(false); // Mark as not saved yet
        setMember(0);

        return newTeam;
    }, []);

    const loadTeam = useCallback((selectedTeam) => {
        console.log('Loading existing team:', selectedTeam);
        setTeam(selectedTeam);
        setLoadedTeamName(selectedTeam.name);
        setIsTeamLoaded(true);
        setMember(0);
    }, []);

    const deleteTeam = useCallback(async (teamId) => {
        try {
            console.log('Deleting team:', teamId);

            const response = await fetch(`http://localhost:3001/api/teams/${teamId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                console.log('Team deleted successfully');

                // If deleted team is currently loaded, reset to new team
                if (team.id === teamId) {
                    setTeam({
                        name: 'Untitled',
                        pokemon_data: Array(6).fill(null)
                    });
                    setLoadedTeamName(null);
                    setIsTeamLoaded(false);
                }

                // Refresh teams list
                await fetchTeams();

                return { success: true };
            } else {
                const errorText = await response.text();
                console.error('Delete failed:', errorText);
                return { success: false, error: errorText };
            }
        } catch (error) {
            console.error('Delete team error:', error);
            return { success: false, error: error.message };
        }
    }, [team.id, fetchTeams]);

    const updateTeamName = useCallback(async (teamId, newName) => {
        try {
            console.log('Updating team name:', teamId, newName);

            // Find the team to update
            const teamToUpdate = teams.find(t => t.id === teamId);
            if (!teamToUpdate) {
                return { success: false, error: 'Team not found' };
            }

            const response = await fetch(`http://localhost:3001/api/teams/${teamId}`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    pokemon_data: teamToUpdate.pokemon_data
                })
            });

            if (response.ok) {
                const updatedTeam = await response.json();
                console.log('Team name updated successfully:', updatedTeam);

                // Update current team if it's the one being edited
                if (team.id === teamId) {
                    setTeam(updatedTeam);
                    setLoadedTeamName(updatedTeam.name);
                }

                // Refresh teams list
                await fetchTeams();

                return { success: true, team: updatedTeam };
            } else {
                const errorText = await response.text();
                console.error('Update failed:', errorText);
                return { success: false, error: errorText };
            }
        } catch (error) {
            console.error('Update team error:', error);
            return { success: false, error: error.message };
        }
    }, [teams, team.id, fetchTeams]);

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
            if (e.name !== "AbortError") console.error(e);
            setTeams([]);
        });
    }, [fetchTeams]);

    return (
        <div className="App">
            <div className="navbar">
                <div className="navbar-left">
                    Welcome {user ? user.name : "Guest"}
                </div>
                {isTeamLoaded && loadedTeamName && (
                    <div className="team-loaded-indicator">
                        Team Loaded: {loadedTeamName}
                    </div>
                )}
            </div>

            {message && <Popup onSignIn={signIn} onSkip={closePopup} />}

            <div className="main-content">
                <div className="app-container">
                    <Team
                        selectedTeam={team}
                        setTeam={setTeam}
                        selectedMember={selectedMember}
                        setMember={setMember}
                        setSearch={setSearch}
                        onSaveTeam={saveTeam}
                        onNewTeam={createNewTeam}
                        teams={teams}
                        setTeams={setTeams}
                        selectedGeneration={selectedGeneration}
                        setSelectedGeneration={setSelectedGeneration}
                    />
                    <Teams
                        teams={teams}
                        onTeamSelect={loadTeam}
                        onTeamDelete={deleteTeam}
                        onTeamUpdate={updateTeamName}
                    />
                </div>

                {search && (
                    <Search 
                        setTeam={setTeam} 
                        selectedIndex={selectedMember} 
                        setSearch={setSearch} 
                        selectedGeneration={selectedGeneration}
                        typesList={typesList}
                    />
                )}
            </div>

            <div className="Debug-Bar">
                <button onClick={() => fetchStatus()}>Get User Info</button>
                <button onClick={() => fetchTeams()}>Refresh Teams</button>
                <button onClick={signIn}>Sign in</button>
                <button onClick={signOut}>Sign out</button>
                <button onClick={openPopup}>Open Popup</button>
                <button onClick={() => setSearch(true)}>Search</button>
            </div>
        </div>
    );
}

export default App;