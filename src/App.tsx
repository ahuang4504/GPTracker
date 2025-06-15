import { useState, useEffect } from "react";
import { getFromStorage } from "./utils";
import "./App.css";

function App() {
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { visitCount } = await getFromStorage<{ visitCount: number }>([
        "visitCount",
      ]);
      await setVisitCount(visitCount || 0);
    };

    fetchData();
  }, []);

  return (
    <>
      <h1>GPTracker</h1>
      <div className="card">
        <p>You've visited ChatGPT {visitCount} times!</p>
      </div>
    </>
  );
}

export default App;
