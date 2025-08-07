import { useEffect, useState } from "react";
import './App.css';

function closePopup(setMessage){
  setMessage(false);
  sessionStorage.setItem("message", "false");
}

function signIn(username, password){
    
}

function Popup(setMessage){
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    
    return (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Get Started</h2>
              
              <input
              type="text"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              />

              <input
              type="text"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              />

              <button>Create Account</button>
              <button>Sign In</button>
              <button onClick={() => {closePopup(setMessage)}}>Continue Without</button>
            </div>
          </div>
        )
}

function App() {

    const [message, setMessage] = useState(() => {
        return sessionStorage.getItem("message") !== "false";
    });
    // useEffect(() => {
    //     fetch("/test")
    //     .then((res) => res.text())
    //     .then((data) => setMessage(data));
    // }, []);

    // useEffect(() => {
    // fetch("/test-db")
    // .then((res) => res.text())
    // .then((data) => setMessage(data));
    // });

    return (
      <div className="App">
        <h1>Welcome to Pokémon Teambuilder</h1>
        {message && <Popup setMessage={setMessage} />}

<button onClick={() => {
  sessionStorage.removeItem("message");
  window.location.reload();
}}>
  Reset Session
</button>
      </div>
  );
}


export default App;
