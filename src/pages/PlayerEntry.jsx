import React, { useState } from "react";
import API_BASE_URL from "../config/api";

function PlayerEntry({ onCreated, onUserSet }) {
  const [tournamentId, setTournamentId] = useState("");
  const [matchId, setMatchId] = useState("");
  const [status, setStatus] = useState("");
  const [createdMatch, setCreatedMatch] = useState(null);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");

  const apiBase = API_BASE_URL; // backend API URL from env

  // Fresh tokens (expires Nov 12, 2025)
  const organizerToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGUxMTRkYWFkNzU3OTlkNTdkMThiMGUiLCJ1c2VyVHlwZSI6Im9yZ2FuaXplciIsImFjdGl2ZVJvbGUiOiJ0b3VybmFtZW50LW9yZ2FuaXplciIsImlhdCI6MTc2NDU2Nzg2NywiZXhwIjoxNzY1MTcyNjY3fQ.LWR0TikzFMwuOEGV73IJj1kpQ950YDTPbKoo948QCF4";
  const playerToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGYwYmE2MTYyZmM5NzkxOGMyZGQ5ODYiLCJ1c2VyVHlwZSI6InBsYXllciIsImlhdCI6MTc2MjMyOTEyOSwiZXhwIjoxNzYyOTMzOTI5fQ.jDZspQPmhvL7F0Dljz8w6Pv4nCjsjrrq2nCtvXEQSdU";

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
          overs: 15,
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
          overs: 15,
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
    <div className="page player-entry">
      <h3>Quick Token Login & Create Match</h3>

      <div
        style={{
          marginBottom: 12,
          padding: 12,
          background: "#f0f9ff",
          border: "1px solid #0284c7",
        }}
      >
        <h4>Step 1: Use Real Token (Skip Login)</h4>
        <button onClick={useOrganizerToken} style={{ marginRight: 8 }}>
          Use Organizer Token
        </button>
        <button onClick={usePlayerToken}>Use Player Token</button>
        <p style={{ fontSize: 12, marginTop: 8 }}>
          <strong>Organizer:</strong> Can create matches |{" "}
          <strong>Player:</strong> For live scoring view
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

      <form onSubmit={createMatch}>
        <h4>Step 2: Create Match</h4>
        <label>
          Tournament ID (default: FRAT255361)
          <input
            value={tournamentId}
            onChange={(e) => setTournamentId(e.target.value)}
            placeholder="68ed18c056f9077394c82697"
          />
        </label>
        <p style={{ fontSize: 12, color: "#666" }}>
          Will create match between Delhi Dynamites vs Mumbai Warriors
        </p>
        <button type="submit">Create Match</button>
      </form>

      {createdMatch && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#f0f9ff",
            border: "1px solid #0284c7",
          }}
        >
          <p>
            <strong>Match Created:</strong>{" "}
            {createdMatch.teams?.team1?.teamName} vs{" "}
            {createdMatch.teams?.team2?.teamName}
          </p>
          <p>
            <strong>Match ID:</strong> {matchId}
          </p>
          <button onClick={startMatch}>Start Match (Auto Toss)</button>
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <strong>Quick join:</strong>
        <input
          placeholder="existing matchId"
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
        >
          Open
        </button>
      </div>

      <p>{status}</p>
      <p style={{ fontSize: 12, color: "#666" }}>
        Note: This test UI assumes backend auth is relaxed or you run with a
        valid cookie/token.
      </p>
    </div>
  );
}

export default PlayerEntry;
