import React, { useEffect, useState, useRef } from "react";
import { createLiveClient } from "../liveClient";
import API_BASE_URL from "../config/api";

function LiveScoring({ matchId: propMatchId, token, userType, onBack }) {
  const [matchId, setMatchId] = useState(propMatchId || "");
  const [connected, setConnected] = useState(false);
  const [score, setScore] = useState(null);
  const [commentary, setCommentary] = useState([]);
  const [message, setMessage] = useState("");
  const clientRef = useRef(null);

  useEffect(() => {
    return () => {
      if (clientRef.current) clientRef.current.disconnect();
    };
  }, []);

  function connect() {
    if (!matchId) return setMessage("Enter matchId");
    if (!token) return setMessage("Authentication token missing");

    setMessage("Connecting...");
    const client = createLiveClient(API_BASE_URL, token);
    clientRef.current = client;

    client.on("connection_established", (data) => {
      setConnected(true);
      setMessage("Connected: " + (data?.message || ""));
      client.emit("join_match", { matchId });
    });

    client.on("match_joined", (data) => {
      setMessage("Joined match: " + data.matchId);
      if (data.currentScore) setScore(data.currentScore);
    });

    client.on("score_update", (data) => {
      setScore(data.score);
    });

    client.on("ball_event", (data) => {
      setCommentary((c) => [data.ballEvent, ...c].slice(0, 50));
    });

    client.on("commentary_update", (data) => {
      setCommentary((c) => [data.commentary, ...c].slice(0, 50));
    });

    client.on("disconnect", () => setConnected(false));
  }

  async function sendBallEvent() {
    const client = clientRef.current;
    if (client && client.connected()) {
      const ballEvent = {
        runs: { total: 1 },
        wicket: { isWicket: false },
        meta: { note: "test" },
      };
      client.emit("score:ball", { matchId, ballEvent });
      setMessage("Sent ball via socket");
      return;
    }

    // fallback to REST
    try {
      const res = await fetch(`${API_BASE_URL}/api/scoring/${matchId}/ball`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runs: 1, batsman: null }),
      });
      const data = await res.json();
      setMessage("Sent ball via REST: " + (data.message || res.status));
    } catch (err) {
      setMessage("Error sending ball: " + err.message);
    }
  }

  return (
    <div className="page live-scoring">
      <h3>Live Scoring</h3>
      <div style={{ marginBottom: 12 }}>
        <input
          placeholder="matchId"
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
        />
        <button onClick={connect}>Connect & Join</button>
        <button
          onClick={() => {
            clientRef.current &&
              clientRef.current.emit("leave_match", { matchId });
          }}
        >
          Leave
        </button>
        <button onClick={onBack}>Back</button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <button onClick={sendBallEvent}>Record 1 run (test)</button>
      </div>

      <div>
        <strong>Connection:</strong> {connected ? "connected" : "disconnected"}
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Score</strong>
        <pre style={{ background: "#f9f9f9", padding: 8 }}>
          {JSON.stringify(score, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Commentary (latest first)</strong>
        <ul>
          {commentary.map((c, i) => (
            <li key={i}>{JSON.stringify(c)}</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Status:</strong> {message}
      </div>
    </div>
  );
}

export default LiveScoring;
