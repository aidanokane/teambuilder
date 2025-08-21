import { useEffect, useState, useCallback } from "react";
import Popup from './components/Popup';
import Team from './components/Team';
import Search from './components/Search';
import './styles/index.css';

const TeamList = ({ teams, setTeam }) => {
    return (
        <div className="Team-List">
            <h2>TEAMS</h2>
            {teams.map((team, index) => (
                <button
                    key={index}
                    onClick={() => {
                        setTeam(team);
                    }}
                >
                    TEAM {index}: {team.name}
                </button>
            ))}
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
        window.location.href = 'http://localhost:3001/auth/google';
    };

    const signOut = async () => {
        setUser(null);
        window.location.href = 'http://localhost:3001/auth/logout';
    };

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
            setTeams(data);
        } catch (e) {
            if (e.name !== "AbortError") console.error(e);
            setTeams([]);
        }
    }, []);

    const saveTeam = useCallback(async (team) => {
        try {
            const res = await fetch('http://localhost:3001/api/teams/save', {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    "name": team.name,
                    "pokemon_data": team.pokemon_data
                })
            });
            
            if (res.ok) {
                // Refresh teams list after saving
                fetchTeams();
            }
        } catch (e) {
            if (e.name !== "AbortError") console.error(e);
        }
    }, [fetchTeams]);

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
        return () => ctrl.abort();
    }, [fetchTeams]);

    return (
        <div className="App">
            <div className="navbar">Welcome {user ? user.name : "Guest"}</div>
            {message && <Popup onSignIn={signIn} onSkip={closePopup} />}
            <div style={{ "display": "flex", "gap": "20px" }}>
                <Team 
                    selectedTeam={team} 
                    setTeam={setTeam} 
                    selectedMember={selectedMember} 
                    setMember={setMember} 
                    setSearch={setSearch} 
                />
                <TeamList teams={teams} setTeam={setTeam} />
                {search && (
                    <Search 
                        setTeam={setTeam} 
                        selectedIndex={selectedMember} 
                        setSearch={setSearch} 
                    />
                )}
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
