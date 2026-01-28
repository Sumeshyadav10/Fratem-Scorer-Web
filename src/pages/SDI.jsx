import React, { useState } from "react";
import API_BASE_URL from "../config/api";

/**
 * Professional SDI Display Component
 * Production-level hierarchical UI for Skill Development Index
 *
 * UI Hierarchy:
 * 1. Player Info Card (Name, UID, Total Matches, Average SDI)
 * 2. Tournament List (Expandable cards)
 * 3. Match List per Tournament (Expandable rows with detailed table)
 * 4. Match Detail Table (Complete metric breakdown without Game Awareness)
 */

// Helper function to render SDI Table for a single match
const MatchSDITable = ({ match }) => {
  const batting = match.components?.batting || {};
  const bowling = match.components?.bowling || {};
  const fielding = match.components?.fielding || {};

  return (
    <div style={{ padding: "16px 20px", background: "#fafbfc" }}>
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 12,
          padding: 12,
          background: "white",
          borderRadius: 8,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
            Match
          </div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {match.matchNumber}
          </div>
        </div>
        <div style={{ flex: 2 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
            Teams
          </div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{match.teams}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
            Date
          </div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>
            {match.date ? new Date(match.date).toLocaleDateString() : "N/A"}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4 }}>
            Match SDI
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: 20,
              color:
                match.SDI >= 70
                  ? "#059669"
                  : match.SDI >= 50
                    ? "#d97706"
                    : "#dc2626",
            }}
          >
            {match.SDI}
          </div>
        </div>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
          background: "white",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <thead>
          <tr
            style={{ background: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}
          >
            <th
              style={{
                padding: "10px 12px",
                textAlign: "left",
                fontWeight: 600,
                color: "#1e293b",
                width: "35%",
              }}
            >
              Metric
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#1e293b",
                width: "20%",
              }}
            >
              Value
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#1e293b",
                width: "15%",
              }}
            >
              Weightage
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#1e293b",
                width: "15%",
              }}
            >
              Score
            </th>
            <th
              style={{
                padding: "10px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#1e293b",
                width: "15%",
              }}
            >
              Component
            </th>
          </tr>
        </thead>
        <tbody>
          {/* BATTING SECTION */}
          <tr style={{ background: "#eff6ff", borderTop: "2px solid #3b82f6" }}>
            <td
              colSpan="5"
              style={{
                padding: "8px 12px",
                fontWeight: 700,
                color: "#1e40af",
                fontSize: 14,
              }}
            >
              🏏 BATTING METRICS @ 40%
            </td>
          </tr>
          <tr style={{ background: "white" }}>
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Batting Average
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {batting.breakdown?.battingAvg?.value ?? 0}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              10%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#2563eb",
              }}
            >
              {batting.breakdown?.battingAvg?.score?.toFixed(2) ?? "0.00"}
            </td>
            <td
              rowSpan="5"
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: 16,
                color: "#1e40af",
                verticalAlign: "middle",
                background: "#eff6ff",
              }}
            >
              {batting.battingScore?.toFixed(2) ?? "0.00"}
            </td>
          </tr>
          <tr style={{ background: "#f8fafc" }}>
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Strike Rate
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {batting.breakdown?.strikeRate?.value ?? 0}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              10%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#2563eb",
              }}
            >
              {batting.breakdown?.strikeRate?.score?.toFixed(2) ?? "0.00"}
            </td>
          </tr>
          <tr style={{ background: "white" }}>
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Boundary Efficiency
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {batting.breakdown?.boundaryEfficiency?.value ?? 0}%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              5%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#2563eb",
              }}
            >
              {batting.breakdown?.boundaryEfficiency?.score?.toFixed(2) ??
                "0.00"}
            </td>
          </tr>
          <tr style={{ background: "#f8fafc" }}>
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Consistency Index
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {batting.breakdown?.consistencyIndex?.value ?? 0}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              10%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#2563eb",
              }}
            >
              {batting.breakdown?.consistencyIndex?.score?.toFixed(2) ?? "0.00"}
            </td>
          </tr>
          <tr
            style={{ background: "white", borderBottom: "1px solid #e2e8f0" }}
          >
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Chasing Efficiency
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {batting.breakdown?.chasingEfficiency?.value ?? 0}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              5%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#2563eb",
              }}
            >
              {batting.breakdown?.chasingEfficiency?.score?.toFixed(2) ??
                "0.00"}
            </td>
          </tr>

          {/* BOWLING SECTION */}
          <tr style={{ background: "#f0fdf4", borderTop: "2px solid #22c55e" }}>
            <td
              colSpan="5"
              style={{
                padding: "8px 12px",
                fontWeight: 700,
                color: "#15803d",
                fontSize: 14,
              }}
            >
              ⚡ BOWLING METRICS @ 40%
            </td>
          </tr>
          <tr style={{ background: "white" }}>
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Bowling Average
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {bowling.breakdown?.bowlingAvg?.value ?? 0}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              10%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#16a34a",
              }}
            >
              {bowling.breakdown?.bowlingAvg?.score?.toFixed(2) ?? "0.00"}
            </td>
            <td
              rowSpan="5"
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: 16,
                color: "#15803d",
                verticalAlign: "middle",
                background: "#f0fdf4",
              }}
            >
              {bowling.bowlingScore?.toFixed(2) ?? "0.00"}
            </td>
          </tr>
          <tr style={{ background: "#f8fafc" }}>
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Economy Rate
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {bowling.breakdown?.economyRate?.value ?? 0}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              10%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#16a34a",
              }}
            >
              {bowling.breakdown?.economyRate?.score?.toFixed(2) ?? "0.00"}
            </td>
          </tr>
          <tr style={{ background: "white" }}>
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Strike Rate
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {bowling.breakdown?.strikeRate?.value ?? 0}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              10%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#16a34a",
              }}
            >
              {bowling.breakdown?.strikeRate?.score?.toFixed(2) ?? "0.00"}
            </td>
          </tr>
          <tr style={{ background: "#f8fafc" }}>
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Dot Ball %
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {bowling.breakdown?.dotBallPercentage?.value ?? 0}%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              5%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#16a34a",
              }}
            >
              {bowling.breakdown?.dotBallPercentage?.score?.toFixed(2) ??
                "0.00"}
            </td>
          </tr>
          <tr
            style={{ background: "white", borderBottom: "1px solid #e2e8f0" }}
          >
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Pressure Handling Index
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {bowling.breakdown?.pressureHandlingIndex?.value ?? "0.00e+0"}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              5%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#16a34a",
              }}
            >
              {bowling.breakdown?.pressureHandlingIndex?.score?.toFixed(2) ??
                "0.00"}
            </td>
          </tr>

          {/* FIELDING SECTION */}
          <tr style={{ background: "#fef2f2", borderTop: "2px solid #ef4444" }}>
            <td
              colSpan="5"
              style={{
                padding: "8px 12px",
                fontWeight: 700,
                color: "#b91c1c",
                fontSize: 14,
              }}
            >
              🧤 FIELDING & WICKET-KEEPING @ 20%
            </td>
          </tr>
          <tr style={{ background: "white" }}>
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Catches Efficiency
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {fielding.breakdown?.catchesEfficiency?.value ?? 0}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              10%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#dc2626",
              }}
            >
              {fielding.breakdown?.catchesEfficiency?.score?.toFixed(2) ??
                "0.00"}
            </td>
            <td
              rowSpan="3"
              style={{
                textAlign: "center",
                fontWeight: 700,
                fontSize: 16,
                color: "#b91c1c",
                verticalAlign: "middle",
                background: "#fef2f2",
              }}
            >
              {fielding.fieldingScore?.toFixed(2) ?? "0.00"}
            </td>
          </tr>
          <tr style={{ background: "#f8fafc" }}>
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Run-Out Success Rate
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {fielding.breakdown?.runOutSuccessRate?.value ?? 0}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              5%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#dc2626",
              }}
            >
              {fielding.breakdown?.runOutSuccessRate?.score?.toFixed(2) ??
                "0.00"}
            </td>
          </tr>
          <tr
            style={{ background: "white", borderBottom: "1px solid #e2e8f0" }}
          >
            <td
              style={{ padding: "8px 12px", paddingLeft: 24, color: "#334155" }}
            >
              Stumping Accuracy
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {fielding.breakdown?.stumpingAccuracy?.value ?? 0}
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                color: "#64748b",
              }}
            >
              5%
            </td>
            <td
              style={{
                padding: "8px 12px",
                textAlign: "center",
                fontWeight: 600,
                color: "#dc2626",
              }}
            >
              {fielding.breakdown?.stumpingAccuracy?.score?.toFixed(2) ??
                "0.00"}
            </td>
          </tr>

          {/* TOTAL SDI ROW */}
          <tr
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <td
              colSpan="3"
              style={{
                padding: "12px",
                fontWeight: 700,
                fontSize: 15,
                textAlign: "right",
              }}
            >
              🏆 MATCH SDI SCORE
            </td>
            <td
              style={{
                padding: "12px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              100%
            </td>
            <td
              style={{
                padding: "12px",
                textAlign: "center",
                fontWeight: 900,
                fontSize: 20,
              }}
            >
              {match.SDI}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Stats Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div style={{ background: "#eff6ff", padding: 12, borderRadius: 8 }}>
          <div
            style={{
              fontSize: 11,
              color: "#1e40af",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Batting Stats
          </div>
          <div style={{ fontSize: 12, color: "#334155" }}>
            <div>
              Runs: <strong>{match.stats?.batting?.runs || 0}</strong> (
              {match.stats?.batting?.balls || 0})
            </div>
            <div>
              Fours: <strong>{match.stats?.batting?.fours || 0}</strong> |
              Sixes: <strong>{match.stats?.batting?.sixes || 0}</strong>
            </div>
          </div>
        </div>
        <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 8 }}>
          <div
            style={{
              fontSize: 11,
              color: "#15803d",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Bowling Stats
          </div>
          <div style={{ fontSize: 12, color: "#334155" }}>
            <div>
              Wickets: <strong>{match.stats?.bowling?.wickets || 0}</strong>
            </div>
            <div>
              Runs Conceded: <strong>{match.stats?.bowling?.runs || 0}</strong>{" "}
              ({match.stats?.bowling?.balls || 0} balls)
            </div>
          </div>
        </div>
        <div style={{ background: "#fef2f2", padding: 12, borderRadius: 8 }}>
          <div
            style={{
              fontSize: 11,
              color: "#b91c1c",
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Fielding Stats
          </div>
          <div style={{ fontSize: 12, color: "#334155" }}>
            <div>
              Catches: <strong>{match.stats?.fielding?.catches || 0}</strong>
            </div>
            <div>
              Run-Outs: <strong>{match.stats?.fielding?.runOuts || 0}</strong> |
              Stumpings:{" "}
              <strong>{match.stats?.fielding?.stumpings || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SDI() {
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [expandedTournaments, setExpandedTournaments] = useState(new Set());
  const [expandedMatches, setExpandedMatches] = useState(new Set());

  const toggleTournament = (tournamentId) => {
    const newExpanded = new Set(expandedTournaments);
    if (newExpanded.has(tournamentId)) {
      newExpanded.delete(tournamentId);
    } else {
      newExpanded.add(tournamentId);
    }
    setExpandedTournaments(newExpanded);
  };

  const toggleMatch = (matchKey) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchKey)) {
      newExpanded.delete(matchKey);
    } else {
      newExpanded.add(matchKey);
    }
    setExpandedMatches(newExpanded);
  };

  const fetchSDI = async () => {
    setError("");
    setResult(null);
    setExpandedTournaments(new Set());
    setExpandedMatches(new Set());

    if (!playerId) return setError("Please enter Player UID or ID");
    setLoading(true);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/player-points/player/${playerId}/sdi`,
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to fetch SDI");
      } else {
        setResult(data.data);
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  // Calculate average SDI across all matches
  const calculateAverageSDI = () => {
    if (!result || !result.tournaments) return 0;

    let totalSDI = 0;
    let totalMatches = 0;

    result.tournaments.forEach((tournament) => {
      if (tournament.matchWiseBreakdown) {
        tournament.matchWiseBreakdown.forEach((match) => {
          totalSDI += match.SDI || 0;
          totalMatches++;
        });
      }
    });

    return totalMatches > 0 ? (totalSDI / totalMatches).toFixed(2) : 0;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      fetchSDI();
    }
  };

  return (
    <div
      style={{
        padding: "20px 24px",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: "20px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Skill Development Index (SDI)
            </h1>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>
              Production-level player performance analytics
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              placeholder="Enter Player UID or MongoDB ID"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{
                padding: "10px 16px",
                width: 320,
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 14,
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
            <button
              onClick={fetchSDI}
              disabled={loading}
              style={{
                padding: "10px 24px",
                borderRadius: 8,
                border: "none",
                background: loading ? "#94a3b8" : "#3b82f6",
                color: "white",
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                !loading && (e.target.style.background = "#2563eb")
              }
              onMouseLeave={(e) =>
                !loading && (e.target.style.background = "#3b82f6")
              }
            >
              {loading ? "Loading..." : "Get SDI"}
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: 16,
            marginBottom: 20,
            color: "#b91c1c",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ fontWeight: 500 }}>{error}</span>
        </div>
      )}

      {/* Results */}
      {result && result.tournaments && (
        <>
          {/* Player Info Card */}
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              marginBottom: 20,
              border: "2px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr",
                gap: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    fontWeight: 600,
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  Player Name
                </div>
                <div
                  style={{ fontSize: 24, fontWeight: 700, color: "#0f172a" }}
                >
                  {result.playerName || "Unknown Player"}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                  ID: {result.playerId?.substring(0, 10)}...
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: "12px 0",
                  background: "#f8fafc",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Total Tournaments
                </div>
                <div
                  style={{ fontSize: 32, fontWeight: 800, color: "#3b82f6" }}
                >
                  {result.totalTournaments}
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: "12px 0",
                  background: "#f8fafc",
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Total Matches
                </div>
                <div
                  style={{ fontSize: 32, fontWeight: 800, color: "#8b5cf6" }}
                >
                  {result.tournaments.reduce(
                    (sum, t) => sum + (t.matchesPlayed || 0),
                    0,
                  )}
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: "12px 0",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: 8,
                  color: "white",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 6,
                    opacity: 0.9,
                  }}
                >
                  Average SDI
                </div>
                <div style={{ fontSize: 32, fontWeight: 800 }}>
                  {calculateAverageSDI()}
                </div>
              </div>
            </div>
          </div>

          {/* Tournament List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {result.tournaments.map((tournament, tIdx) => {
              const isExpanded = expandedTournaments.has(
                tournament.tournamentId,
              );
              const tournamentAvgSDI = tournament.matchWiseBreakdown
                ? (
                    tournament.matchWiseBreakdown.reduce(
                      (sum, m) => sum + (m.SDI || 0),
                      0,
                    ) / tournament.matchWiseBreakdown.length
                  ).toFixed(2)
                : "0.00";

              return (
                <div
                  key={tournament.tournamentId || tIdx}
                  style={{
                    background: "white",
                    borderRadius: 12,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                    border: isExpanded
                      ? "2px solid #3b82f6"
                      : "1px solid #e2e8f0",
                    transition: "all 0.3s",
                  }}
                >
                  {/* Tournament Header */}
                  <div
                    onClick={() => toggleTournament(tournament.tournamentId)}
                    style={{
                      padding: "18px 24px",
                      cursor: "pointer",
                      background: isExpanded
                        ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                        : "#f8fafc",
                      color: isExpanded ? "white" : "#0f172a",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.3s",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>
                          {isExpanded ? "📂" : "📁"}
                        </span>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>
                          {tournament.tournamentName ||
                            `Tournament ${tIdx + 1}`}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          opacity: isExpanded ? 0.9 : 0.7,
                          display: "flex",
                          gap: 16,
                          flexWrap: "wrap",
                        }}
                      >
                        {tournament.tournamentUID && (
                          <span>
                            🏆 UID: <strong>{tournament.tournamentUID}</strong>
                          </span>
                        )}
                        <span>
                          🆔 ID:{" "}
                          <strong>
                            {tournament.tournamentId?.substring(0, 10)}...
                          </strong>
                        </span>
                        <span>
                          📊 Matches:{" "}
                          <strong>{tournament.matchesPlayed}</strong>
                        </span>
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", gap: 24, alignItems: "center" }}
                    >
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: 11,
                            opacity: 0.85,
                            marginBottom: 4,
                          }}
                        >
                          Avg SDI
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800 }}>
                          {tournamentAvgSDI}
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          transition: "transform 0.3s",
                          transform: isExpanded
                            ? "rotate(180deg)"
                            : "rotate(0deg)",
                        }}
                      >
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Tournament Expanded Content - Match List */}
                  {isExpanded && tournament.matchWiseBreakdown && (
                    <div
                      style={{ padding: "16px 24px", background: "#fafbfc" }}
                    >
                      <div
                        style={{
                          marginBottom: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#334155",
                          }}
                        >
                          Match List ({tournament.matchWiseBreakdown.length}{" "}
                          matches)
                        </h3>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          Click on any match to see detailed breakdown
                        </div>
                      </div>

                      {tournament.matchWiseBreakdown.map((match, mIdx) => {
                        const matchKey = `${tournament.tournamentId}-${
                          match.matchId || mIdx
                        }`;
                        const isMatchExpanded = expandedMatches.has(matchKey);

                        return (
                          <div
                            key={matchKey}
                            style={{
                              marginBottom: 12,
                              background: "white",
                              borderRadius: 8,
                              overflow: "hidden",
                              border: isMatchExpanded
                                ? "2px solid #8b5cf6"
                                : "1px solid #e2e8f0",
                              boxShadow: isMatchExpanded
                                ? "0 4px 6px rgba(0,0,0,0.1)"
                                : "0 1px 2px rgba(0,0,0,0.05)",
                            }}
                          >
                            {/* Match Row */}
                            <div
                              onClick={() => toggleMatch(matchKey)}
                              style={{
                                padding: "14px 18px",
                                cursor: "pointer",
                                display: "grid",
                                gridTemplateColumns:
                                  "80px 2fr 120px 120px 60px",
                                gap: 16,
                                alignItems: "center",
                                background: isMatchExpanded
                                  ? "#faf5ff"
                                  : "white",
                                transition: "all 0.2s",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#64748b",
                                    marginBottom: 2,
                                  }}
                                >
                                  Match
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>
                                  {match.matchNumber}
                                </div>
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#64748b",
                                    marginBottom: 2,
                                  }}
                                >
                                  Teams
                                </div>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>
                                  {match.teams}
                                </div>
                              </div>
                              <div>
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#64748b",
                                    marginBottom: 2,
                                  }}
                                >
                                  Date
                                </div>
                                <div style={{ fontWeight: 500, fontSize: 13 }}>
                                  {match.date
                                    ? new Date(match.date).toLocaleDateString()
                                    : "N/A"}
                                </div>
                              </div>
                              <div
                                style={{
                                  textAlign: "center",
                                  background: "#f8fafc",
                                  padding: 8,
                                  borderRadius: 6,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    color: "#64748b",
                                    marginBottom: 2,
                                  }}
                                >
                                  SDI Score
                                </div>
                                <div
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 18,
                                    color:
                                      match.SDI >= 70
                                        ? "#059669"
                                        : match.SDI >= 50
                                          ? "#d97706"
                                          : "#dc2626",
                                  }}
                                >
                                  {match.SDI}
                                </div>
                              </div>
                              <div
                                style={{
                                  textAlign: "center",
                                  fontSize: 20,
                                  transition: "transform 0.2s",
                                  transform: isMatchExpanded
                                    ? "rotate(180deg)"
                                    : "rotate(0deg)",
                                }}
                              >
                                {isMatchExpanded ? "🔽" : "▶️"}
                              </div>
                            </div>

                            {/* Match Expanded Content - Detailed Table */}
                            {isMatchExpanded && <MatchSDITable match={match} />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: "#fffbeb",
              border: "1px solid #fcd34d",
              borderRadius: 8,
              fontSize: 13,
              color: "#78350f",
            }}
          >
            <strong>📊 Note:</strong> The Average SDI is calculated across all
            matches played in all tournaments. Each match SDI is calculated as:{" "}
            <strong>Batting (40%) + Bowling (40%) + Fielding (20%)</strong>.
            Game Awareness metrics are not included in the calculation.
          </div>
        </>
      )}

      {/* Empty State */}
      {!result && !loading && !error && (
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 48,
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3
            style={{
              margin: "0 0 8px 0",
              fontSize: 18,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Enter Player UID to View SDI Analysis
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: "#64748b" }}>
            Get comprehensive performance analytics with tournament and
            match-level breakdowns
          </p>
        </div>
      )}
    </div>
  );
}
