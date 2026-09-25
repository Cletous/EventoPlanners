import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await api.get("/health");

        setStatus(
          response.data.database
            ? "Frontend, Backend and Database are connected"
            : "API connected but database failed",
        );
      } catch (error) {
        setStatus("Unable to connect to backend");
      }
    };

    checkApi();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-slate-900">EventoPlanners</h1>

        <p className="mt-2 text-slate-500">Discover. Register. Attend.</p>

        <div className="mt-6 rounded-xl bg-indigo-50 p-4 text-indigo-700">
          {status}
        </div>
      </div>
    </div>
  );
}

export default App;
