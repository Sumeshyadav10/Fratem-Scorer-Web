import React, { useState } from "react";
import API_BASE_URL from "../config/api";

function PlayerEntry({ onCreated, onUserSet }) {
  const [tournamentId, setTournamentId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [matchFormat, setMatchFormat] = useState("overarm"); // Add match format state
  const [numberOfOvers, setNumberOfOvers] = useState(15); // Add overs input
  const [playersPerTeam, setPlayersPerTeam] = useState(11); // Add players per team input
  const [status, setStatus] = useState("");
  const [createdMatch, setCreatedMatch] = useState(null);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");

  const apiBase = API_BASE_URL; // backend API URL from env

  // Fresh tokens (expires Dec 15, 2025)
  const organizerToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGUxMTRkYWFkNzU3OTlkNTdkMThiMGUiLCJ1c2VyVHlwZSI6Im9yZ2FuaXplciIsImlhdCI6MTc2NTE3NTEzMCwiZXhwIjoxNzY1Nzc5OTMwfQ.4UmZTj1Vfj-4SjAbgiLAjR4arUL_v4lDNd6rFFKVcLM";
  const playerToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGYwYmE2MTYyZmM5NzkxOGMyZGQ5ODYiLCJ1c2VyVHlwZSI6InBsYXllciIsImlhdCI6MTc2NTE3NTEzMCwiZXhwIjoxNzY1Nzc5OTMwfQ.g4pqGF4Kbrk0SMGpHF_26a81F3GF2DJyBAWC-X7y89M";

  function useOrganizerToken() {
    setToken(organizerToken);
    setStatus("Using Organizer Token - Ready to create matches!");
    onUserSet && onUserSet("organizer", organizerToken);
  }

  function usePlayerToken() {
    setToken(playerToken);
    setStatus("Using Player Token - Ready for live scoring view!");
    onUserSet && onUserSet("player", playerToken);
  }

  async function login() {
    setStatus("Logging in...");
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      setToken(data.token);
      setStatus(
        "Logged in successfully! Token: " + data.token.substring(0, 20) + "..."
      );
    } catch (err) {
      setStatus(
        "Login error: " +
          err.message +
          " - Try registering first or use existing credentials"
      );
    }
  }

  async function register() {
    setStatus("Registering user...");
    try {
      const res = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role: "admin" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      setStatus(
        "User registered! Check email for OTP verification, or try login directly."
      );
    } catch (err) {
      setStatus("Registration error: " + err.message);
    }
  }

  function getAuthHeaders() {
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  }

  async function createMatch(e) {
    e.preventDefault();
    setStatus("Creating match directly...");
    try {
      const tournamentIdToUse = tournamentId || "68ed18c056f9077394c82697";

      // Try direct match creation first (bypassing fixtures)
      const directMatchRes = await fetch(`${apiBase}/api/live-matches/direct`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tournamentId: tournamentIdToUse,
          team1Id: "68f0ba6a62fc97918c2dd9ef", // Delhi Dynamites
          team2Id: "68f0ba6162fc97918c2dd988", // Mumbai Warriors
          matchType: "T20",
          matchFormat: matchFormat, // Add match format
          overs: numberOfOvers, // Use selected overs
          playersPerTeam: playersPerTeam, // Add players per team
        }),
      });

      if (directMatchRes.ok) {
        const data = await directMatchRes.json();
        setMatchId(data.data.matchId);
        setCreatedMatch(data.data.match);
        setStatus(
          "Match created directly: " + data.data.matchId + " - Ready to start!"
        );
        return;
      }

      // Fallback: Try fixture generation then match creation
      setStatus("Direct creation failed, trying fixture generation...");

      const fixtureRes = await fetch(
        `${apiBase}/api/fixtures/tournament/${tournamentIdToUse}/auto-generate`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ format: "knockout" }),
        }
      );

      if (!fixtureRes.ok) {
        const fixtureError = await fixtureRes.json();
        throw new Error(
          "Fixture generation failed: " +
            (fixtureError.message || fixtureRes.status)
        );
      }

      const fixtureData = await fixtureRes.json();
      setStatus("Fixtures generated, creating match...");

      // Get the first fixture ID
      const firstFixtureId = fixtureData.data.fixtures[0]._id;

      // Now create a match using the first fixture
      const res = await fetch(`${apiBase}/api/live-matches`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tournamentId: tournamentIdToUse,
          fixtureId: firstFixtureId,
          matchType: "T20",
          matchFormat: matchFormat, // Add match format
          overs: numberOfOvers, // Use selected overs
          playersPerTeam: playersPerTeam, // Add players per team
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setMatchId(data.data.matchId);
      setCreatedMatch(data.data.match);
      setStatus("Match created: " + data.data.matchId + " - Ready to start!");
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  }

  async function startMatch() {
    if (!matchId) return setStatus("No match to start");
    setStatus("Starting match...");
    try {
      const res = await fetch(`${apiBase}/api/live-matches/${matchId}/start`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          tossWinner: "team1", // Delhi Dynamites wins toss
          tossDecision: "bat", // Choose to bat first
          battingOrder1:
            createdMatch?.teams?.team1?.players?.slice(0, 11)?.map((p, i) => ({
              playerId: p.playerId,
              playerName: p.playerName,
            })) || [],
          battingOrder2:
            createdMatch?.teams?.team2?.players?.slice(0, 11)?.map((p, i) => ({
              playerId: p.playerId,
              playerName: p.playerName,
            })) || [],
          bowlingOrder1:
            createdMatch?.teams?.team1?.players?.slice(0, 5)?.map((p, i) => ({
              playerId: p.playerId,
              playerName: p.playerName,
            })) || [],
          bowlingOrder2:
            createdMatch?.teams?.team2?.players?.slice(0, 5)?.map((p, i) => ({
              playerId: p.playerId,
              playerName: p.playerName,
            })) || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start");
      setStatus("Match started successfully! Ready for scoring.");
      onCreated && onCreated(matchId);
    } catch (err) {
      setStatus("Error starting match: " + err.message);
    }
  }

  return (
    <div
      className="page player-entry"
      style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}
    >
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <h2 style={{ margin: 0, color: "#1e293b" }}>🏏 Match Setup</h2>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
          Create and configure your cricket match
        </p>
      </div>

      <div
        style={{
          marginBottom: 24,
          padding: 20,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          borderRadius: 12,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h4 style={{ margin: "0 0 16px 0", color: "white", fontSize: 16 }}>
          🔑 Step 1: Authentication
        </h4>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={useOrganizerToken}
            style={{
              flex: 1,
              padding: "12px 20px",
              background: "white",
              color: "#667eea",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.02)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
          >
            👤 Organizer Token
          </button>
          <button
            onClick={usePlayerToken}
            style={{
              flex: 1,
              padding: "12px 20px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "1px solid white",
              borderRadius: 8,
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.02)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
          >
            🎮 Player Token
          </button>
        </div>
        <p
          style={{
            fontSize: 12,
            marginTop: 12,
            color: "rgba(255,255,255,0.9)",
            margin: "12px 0 0 0",
          }}
        >
          <strong>Organizer:</strong> Create & manage matches |{" "}
          <strong>Player:</strong> View live scores
        </p>
      </div>

      <details style={{ marginBottom: 12 }}>
        <summary>Alternative: Manual Login</summary>
        <div
          style={{
            padding: 12,
            background: "#fef2f2",
            border: "1px solid #ef4444",
          }}
        >
          <label>
            Email{" "}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
            />
          </label>
          <label>
            Password{" "}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
            />
          </label>
          <button onClick={login}>Login</button>
          <button onClick={register} style={{ marginLeft: 8 }}>
            Register
          </button>
        </div>
      </details>

      <form
        onSubmit={createMatch}
        style={{
          background: "white",
          padding: 24,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: 24,
        }}
      >
        <h4 style={{ margin: "0 0 20px 0", color: "#1e293b", fontSize: 16 }}>
          ⚙️ Step 2: Match Configuration
        </h4>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontWeight: 600,
              fontSize: 14,
              color: "#334155",
            }}
          >
            Tournament ID{" "}
            <span style={{ color: "#94a3b8", fontWeight: 400 }}>
              (default: FRAT255361)
            </span>
          </label>
          <input
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
            placeholder="68ed18c056f9077394c82697"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "2px solid #e2e8f0",
              fontSize: 14,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#667eea")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "block",
              marginBottom: 6,
              fontWeight: 600,
              fontSize: 14,
              color: "#334155",
            }}
          >
            Match Format
          </label>
          <select
            value={matchFormat}
            onChange={(e) => setMatchFormat(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "2px solid #e2e8f0",
              fontSize: 14,
              background: "white",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#667eea")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          >
            <option value="overarm">⚡ Overarm (Standard)</option>
            <option value="leather-ball">🏏 Leather Ball</option>
            <option value="underarm">🎯 Underarm</option>
          </select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
                fontSize: 14,
                color: "#334155",
              }}
            >
              Number of Overs
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={numberOfOvers}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || value === "0") {
                  setNumberOfOvers("");
                } else {
                  const num = parseInt(value);
                  if (!isNaN(num) && num >= 1 && num <= 50) {
                    setNumberOfOvers(num);
                  }
                }
              }}
              onBlur={(e) => {
                // Set default if empty on blur
                if (e.target.value === "" || e.target.value === "0") {
                  setNumberOfOvers(15);
                }
                e.target.style.borderColor = "#e2e8f0";
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "2px solid #e2e8f0",
                fontSize: 14,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontWeight: 600,
                fontSize: 14,
                color: "#334155",
              }}
            >
              Players Per Team
            </label>
            <input
              type="number"
              min="5"
              max="15"
              value={playersPerTeam}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || value === "0") {
                  setPlayersPerTeam("");
                } else {
                  const num = parseInt(value);
                  if (!isNaN(num) && num >= 5 && num <= 15) {
                    setPlayersPerTeam(num);
                  }
                }
              }}
              onBlur={(e) => {
                // Set default if empty on blur
                if (e.target.value === "" || e.target.value === "0") {
                  setPlayersPerTeam(11);
                }
                e.target.style.borderColor = "#e2e8f0";
              }}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "2px solid #e2e8f0",
                fontSize: 14,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#667eea")}
            />
          </div>
        </div>

        <div
          style={{
            background: "#f8fafc",
            padding: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
            📋 <strong>Match Summary:</strong> {numberOfOvers} over match with{" "}
            {playersPerTeam} players per team
            <br />
            🏆 <strong>Teams:</strong> Delhi Dynamites vs Mumbai Warriors
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "6px 0 0 0" }}>
            💡 Recommended: 11 players for standard, 5-7 for small matches
          </p>
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px 20px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
          }}
        >
          ✨ Create Match
        </button>
      </form>

      {createdMatch && (
        <div
          style={{
            marginBottom: 24,
            padding: 20,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            borderRadius: 12,
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          }}
        >
          <h4 style={{ margin: "0 0 12px 0", color: "white", fontSize: 16 }}>
            ✅ Match Created Successfully!
          </h4>
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            <p style={{ margin: "0 0 8px 0", color: "white", fontSize: 14 }}>
              <strong>🏏 Teams:</strong> {createdMatch.teams?.team1?.teamName}{" "}
              vs {createdMatch.teams?.team2?.teamName}
            </p>
            <p
              style={{
                margin: 0,
                color: "rgba(255,255,255,0.95)",
                fontSize: 13,
                fontFamily: "monospace",
              }}
            >
              <strong>🆔 Match ID:</strong> {matchId}
            </p>
          </div>
          {/* <button
            onClick={startMatch}
            style={{
              width: "100%",
              padding: "12px 20px",
              background: "white",
              color: "#059669",
              border: "none",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.02)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
          >
            🚀 Start Match (Auto Toss)
          </button> */}
        </div>
      )}

      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: 24,
        }}
      >
        <h4 style={{ margin: "0 0 12px 0", color: "#1e293b", fontSize: 16 }}>
          🔗 Quick Join Existing Match
        </h4>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            placeholder="Enter existing match ID"
            value={matchId}
            onChange={(e) => {
              console.log(
                "🔍 PlayerEntry.jsx - Setting matchId from input:",
                e.target.value
              );
              console.log(
                "🔍 PlayerEntry.jsx - Input type:",
                typeof e.target.value
              );
              setMatchId(e.target.value);
            }}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "2px solid #e2e8f0",
              fontSize: 14,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#667eea")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
          <button
            onClick={() => {
              console.log(
                "🔍 PlayerEntry.jsx - Open button clicked with matchId:",
                matchId
              );
              console.log("🔍 PlayerEntry.jsx - matchId type:", typeof matchId);
              onCreated && onCreated(matchId);
            }}
            style={{
              padding: "10px 24px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseOut={(e) => (e.target.style.transform = "scale(1)")}
          >
            Open ➜
          </button>
        </div>
      </div>

      {status && (
        <div
          style={{
            padding: 16,
            background:
              status.includes("Error") || status.includes("error")
                ? "#fee2e2"
                : "#f0fdf4",
            border: `2px solid ${
              status.includes("Error") || status.includes("error")
                ? "#fca5a5"
                : "#86efac"
            }`,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: "#1e293b" }}>{status}</p>
        </div>
      )}

      <p
        style={{
          fontSize: 12,
          color: "#94a3b8",
          textAlign: "center",
          marginTop: 24,
        }}
      >
        💡 Note: This test UI uses pre-configured tokens for quick access.
        Backend auth must be enabled.
      </p>
    </div>
  );
}

export default PlayerEntry;
