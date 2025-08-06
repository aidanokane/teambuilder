import { useEffect, useState } from "react";
import './App.css';

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/test")
      .then((res) => res.text())
      .then((data) => setMessage(data));
  }, []);

  useEffect(() => {
    fetch("/test-db")
    .then((res) => res.text())
    .then((data) => setMessage(data));
  });

  return (<h1>{message}</h1>);
}


export default App;
