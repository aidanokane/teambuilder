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
          <div className="Modal-Overlay">
            <div className="Modal">
              <h2>Get Started</h2>
              <br/>
              <br/>
              <button className="Modal-Button" onClick={() => {signIn(setMessage)}}>Sign In</button>
              <button className="Modal-Button" onClick={() => {closePopup(setMessage)}}>Continue Without</button>
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
        <div className="navbar">Welcome to Pokémon Teambuilder</div>
        {message && <Popup setMessage={setMessage} />}

        <button
        onClick={() => {
            sessionStorage.removeItem("message");
            window.location.reload();
        }}
        style={{
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "10px 20px",
    backgroundColor: "var(--color-3)",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    zIndex: 1500
  }}>Reset Session</button>
      </div>
  );
}

export default App;
