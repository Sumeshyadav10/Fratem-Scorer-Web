import React, { useState } from "react";
import "./App.css";
import PlayerEntry from "./pages/PlayerEntry";
import LiveScoring from "./pages/LiveScoring";
import ScorerKeypad from "./pages/ScorerKeypad";
import TeamLineup from "./pages/TeamLineup";
import ScorecardTest from "./pages/ScorecardTest";
import PlayerPoints from "./pages/PlayerPoints";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [view, setView] = useState("entry");
  const [matchId, setMatchId] = useState("");
  const [userType, setUserType] = useState("");
  const [token, setToken] = useState("");

  const handleMatchCreated = (newMatchId) => {
    console.log("🔍 App.jsx - Setting matchId:", newMatchId);
    console.log("🔍 App.jsx - Type of matchId:", typeof newMatchId);
    console.log("🔍 App.jsx - Length of matchId:", newMatchId?.length);
    setMatchId(newMatchId);
    setView("lineup"); // Go to team lineup first, then scorer keypad
  };

  const handleUserSet = (newUserType, newToken) => {
    setUserType(newUserType);
    setToken(newToken);
  };

  return (
    <div className="app-root">
      <header>
        <h2>🏏 Cricket Scorer Test Frontend</h2>
        <nav>
          <button onClick={() => setView("entry")}>Match Setup</button>
          <button
            onClick={() => setView("lineup")}
            disabled={!matchId}
            style={{ cursor: matchId ? "pointer" : "not-allowed" }}
          >
            Team Lineup
          </button>
          <button
            onClick={() => setView("keypad")}
            disabled={!matchId}
            style={{ cursor: matchId ? "pointer" : "not-allowed" }}
          >
            Scorer Keypad
          </button>
          <button
            onClick={() => setView("live")}
            disabled={!matchId}
            style={{ cursor: matchId ? "pointer" : "not-allowed" }}
          >
            Live View
          </button>
          <button
            onClick={() => setView("scorecard")}
            className="scorecard-nav-btn"
          >
            📊 Scorecard
          </button>
          <button onClick={() => setView("points")} className="points-nav-btn">
            🏆 Player Points
          </button>
        </nav>
        {matchId && (
          <div style={{ fontSize: 12, color: "#666", marginTop: 5 }}>
            Match ID: {matchId} | User: {userType}
          </div>
        )}
      </header>

      <main>
        {view === "entry" && (
          <PlayerEntry
            onCreated={handleMatchCreated}
            onUserSet={handleUserSet}
          />
        )}

        {view === "lineup" && matchId && (
          <>
            {console.log(
              "🔍 App.jsx - Rendering TeamLineup with matchId:",
              matchId
            )}
            <TeamLineup
              matchId={matchId}
              token={token}
              onLineupSet={() => setView("keypad")}
              onBack={() => setView("entry")}
            />
          </>
        )}

        {view === "keypad" && matchId && (
          <ErrorBoundary>
            <ScorerKeypad
              matchId={matchId}
              token={token}
              userType={userType}
              onBack={() => setView("lineup")}
            />
          </ErrorBoundary>
        )}

        {view === "live" && matchId && (
          <LiveScoring
            matchId={matchId}
            token={token}
            userType={userType}
            onBack={() => setView("entry")}
          />
        )}

        {view === "scorecard" && (
          <ErrorBoundary>
            <ScorecardTest />
          </ErrorBoundary>
        )}

        {view === "points" && (
          <ErrorBoundary>
            <PlayerPoints matchId={matchId} token={token} />
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}

export default App;
