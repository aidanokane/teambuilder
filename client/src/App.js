import { useState } from "react";
import './App.css';

function closePopup(setMessage){
    setMessage(false);
    sessionStorage.setItem("message", "false");
}

function signIn(setMessage){
    closePopup(setMessage);
    window.location.href = "http://localhost:3001/auth/google";
}

function Popup({setMessage}){

    
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    return (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Get Started</h2>
              <button onClick={() => {signIn(setMessage)}}>Sign In</button>
              <button onClick={() => {closePopup(setMessage)}}>Continue Without</button>
            </div>
          </div>
        )
}

function App() {

    const [message, setMessage] = useState(() => {
        return sessionStorage.getItem("message") !== "false";
    });

    return (
      <div className="App">
        <h1>Welcome to Pokémon Teambuilder</h1>
        {message && <Popup setMessage={setMessage} />}
      </div>
  );
}

export default App;
