import React, { useState, useEffect } from "react";
import "./App.css";
import PlayerEntry from "./pages/PlayerEntry";
import LiveScoring from "./pages/LiveScoring";
import ScorerKeypad from "./pages/ScorerKeypad";
import TeamLineup from "./pages/TeamLineup";
import ScorecardTest from "./pages/ScorecardTest";
import PlayerPoints from "./pages/PlayerPoints";
import PlayerCumulativeStats from "./pages/PlayerCumulativeStats";
import CompletedMatchScorecard from "./pages/CompletedMatchScorecard";
import LineupSelection from "./components/LineupSelection";
import ErrorBoundary from "./components/ErrorBoundary";
import Breadcrumb from "./components/Breadcrumb";
import API_BASE_URL from "./config/api";

function App() {
  const [view, setView] = useState("entry");
  const [matchId, setMatchId] = useState("");
  const [userType, setUserType] = useState("");
  const [token, setToken] = useState("");
  const [match, setMatch] = useState(null);
  const [showLineupSelection, setShowLineupSelection] = useState(false);

  // Listen for custom navigation events from child components
  useEffect(() => {
    const handleNavigate = (event) => {
      const { view: newView, matchId: newMatchId } = event.detail;
      if (newView) setView(newView);
      if (newMatchId) setMatchId(newMatchId);
    };

    window.addEventListener("navigate", handleNavigate);
    return () => window.removeEventListener("navigate", handleNavigate);
  }, []);

  // Generate breadcrumb path based on current view
  const getBreadcrumbPath = () => {
    const paths = {
      entry: [{ label: "Home", view: "entry", icon: "🏠" }],
      lineup: [
        { label: "Home", view: "entry", icon: "🏠" },
        { label: "Team Lineup", view: "lineup", icon: "👥" },
      ],
      keypad: [
        { label: "Home", view: "entry", icon: "🏠" },
        { label: "Scorer Keypad", view: "keypad", icon: "⌨️", matchId },
      ],
      live: [
        { label: "Home", view: "entry", icon: "🏠" },
        { label: "Live View", view: "live", icon: "📡", matchId },
      ],
      scorecard: [
        { label: "Home", view: "entry", icon: "🏠" },
        { label: "Scorecard Test", view: "scorecard", icon: "📊" },
      ],
      points: [
        { label: "Home", view: "entry", icon: "🏠" },
        { label: "Player Points", view: "points", icon: "🏆" },
      ],
      cumulative: [
        { label: "Home", view: "entry", icon: "🏠" },
        { label: "Player Statistics", view: "cumulative", icon: "📈" },
      ],
      "completed-scorecard": [
        { label: "Home", view: "entry", icon: "🏠" },
        {
          label: "Match Result",
          view: "completed-scorecard",
          icon: "🏆",
          matchId,
        },
      ],
    };

    return paths[view] || [{ label: "Home", view: "entry", icon: "🏠" }];
  };

  const handleBreadcrumbNavigate = (targetView, targetMatchId) => {
    setView(targetView);
    if (targetMatchId) setMatchId(targetMatchId);
  };

  const handleMatchCreated = async (newMatchId) => {
    console.log("🔍 App.jsx - Setting matchId:", newMatchId);
    console.log("🔍 App.jsx - Type of matchId:", typeof newMatchId);
    console.log("🔍 App.jsx - Length of matchId:", newMatchId?.length);
    setMatchId(newMatchId);

    // Fetch match data to check if lineup selection is needed
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${newMatchId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await response.json();

      if (data.success) {
        setMatch(data.data.match);

        // Check if match has started (any balls played)
        const matchStarted =
          data.data.match.status === "live" && data.data.match.score?.balls > 0;

        if (matchStarted) {
          // Match already in progress - go directly to keypad
          console.log("🏏 Match already started, going to keypad");
          setView("keypad");
        } else {
          // Match not started - always show lineup selection
          console.log("🎯 Match not started, showing lineup selection");
          setShowLineupSelection(true);
        }
      }
    } catch (error) {
      console.error("Error fetching match:", error);
      // Fallback to lineup selection for new matches
      setShowLineupSelection(true);
    }
  };

  const handleUserSet = (newUserType, newToken) => {
    setUserType(newUserType);
    setToken(newToken);
  };

  // Function to check lineup and navigate to keypad
  const navigateToKeypad = async () => {
    if (!matchId) return;

    // Fetch match data to check lineup status
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await response.json();

      if (data.success) {
        setMatch(data.data.match);

        // Check if both teams have selected players
        const team1HasLineup =
          data.data.match.teams.team1.selectedPlayers?.length > 0;
        const team2HasLineup =
          data.data.match.teams.team2.selectedPlayers?.length > 0;

        if (!team1HasLineup || !team2HasLineup) {
          // Show lineup selection modal
          setShowLineupSelection(true);
        } else {
          // Lineup is complete, go to keypad
          setView("keypad");
        }
      }
    } catch (error) {
      console.error("Error fetching match:", error);
      // Still allow navigation if fetch fails
      setView("keypad");
    }
  };

  // Function to open lineup selection
  const openLineupSelection = async () => {
    if (!matchId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await response.json();

      if (data.success) {
        setMatch(data.data.match);
        setShowLineupSelection(true);
      }
    } catch (error) {
      console.error("Error fetching match:", error);
    }
  };

  return (
    <div className="app-root">
      {/* Show lineup selection modal if needed */}
      {showLineupSelection && match && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
            overflow: "auto",
            padding: 20,
          }}
        >
          <LineupSelection
            match={match}
            token={token}
            onComplete={() => {
              setShowLineupSelection(false);
              setView("keypad");
            }}
          />
        </div>
      )}

      <header>
        <h2>🏏 Cricket Scorer Test Frontend</h2>
        <nav>
          <button onClick={() => setView("entry")}>Match Setup</button>
          <button
            onClick={openLineupSelection}
            disabled={!matchId}
            style={{ cursor: matchId ? "pointer" : "not-allowed" }}
          >
            Team Lineup
          </button>
          <button
            onClick={navigateToKeypad}
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
          <button
            onClick={() => setView("cumulative")}
            className="cumulative-nav-btn"
          >
            📈 Player Stats
          </button>
          <button
            onClick={() => setView("completed-scorecard")}
            className="completed-scorecard-nav-btn"
          >
            🏆 Match Result
          </button>
        </nav>
        {matchId && (
          <div style={{ fontSize: 12, color: "#666", marginTop: 5 }}>
            Match ID: {matchId} | User: {userType}
          </div>
        )}
      </header>

      <main>
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          path={getBreadcrumbPath()}
          onNavigate={handleBreadcrumbNavigate}
        />

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

        {view === "cumulative" && (
          <ErrorBoundary>
            <PlayerCumulativeStats token={token} />
          </ErrorBoundary>
        )}

        {view === "completed-scorecard" && (
          <ErrorBoundary>
            <CompletedMatchScorecard
              matchId={matchId}
              onBack={() => setView("entry")}
            />
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}

export default App;
