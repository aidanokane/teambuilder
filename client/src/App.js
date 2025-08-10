import { useEffect, useState, useCallback, useRef } from "react";
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
    const team = selectedTeam ?? [];
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
                        <img src={team[index].sprite} ></img>
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

const Info = ({ pokemon }) => {
    console.log(pokemon);
    const name = pokemon.name;
    let types = pokemon.types[0];
    if(pokemon.types[1] != "null"){
        types += " | " + pokemon.types[1];
    }
    return (
        <div className="Info">
            <h1>{name}</h1>
            <p>{types}</p>
        </div>
    )
}

const TeamList = ({teams, setTeam}) => {
    console.log(teams.length);
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
        // return true;
    });
    const [teams, setTeams] = useState([]);
    const [team, setTeam] = useState([]);

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
            console.log("TEAMS LIST");
            console.log(data);
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
            <Team selectedTeam={team.pokemon_data}/>
            <TeamList teams={teams} setTeam={setTeam}></TeamList>
        </div>
        <div className="Debug-Bar">
            <button onClick={() => fetchStatus()}>Get User Info</button>
            <button onClick={() => fetchTeams()}>Get User Teams</button>
            <button onClick={signIn}>Sign in</button>
            <button onClick={signOut}>Sign out</button>
            <button onClick={openPopup}>Open Popup</button>
            <button onClick={() => saveTeam(default_team)}>Save Default</button>
            <button onClick={() => saveTeam(team)}>Save Team</button>
        </div>
      </div>
  );
}

export default App;
