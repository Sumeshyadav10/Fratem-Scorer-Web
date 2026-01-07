import React, { useState } from "react";
import API_BASE_URL from "../config/api";

/**
 * Opposition Strength Index (OSI) Component
 *
 * Two modes:
 * 1. Team Mode: Enter team UID to see individual team's OSI breakdown
 * 2. Tournament Mode: Enter tournament UID to see all teams with their OSI scores
 *
 * OSI Components:
 * - Batting Strength (BS): Based on top 7 batters
 * - Bowling Strength (BWS): Based on top 5 bowlers
 * - Fielding Strength (FS): Catches, run-outs, stumpings
 * - Overall OSI: Average of all three components
 *
 * Team Points (TP) = (Wins × 3 + Draws × 1) × Opponent OSI
 */

function clamp(value, min = 0, max = 100) {
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.max(min, Math.min(max, num));
}

// Component strength table for individual team view
function TeamOSITable({ data }) {
  if (!data) return null;

  const { components } = data;

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "left",
                fontWeight: 600,
                color: "#475569",
                borderBottom: "2px solid #e2e8f0",
              }}
            >
              Component
            </th>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "center",
                fontWeight: 600,
                color: "#475569",
                borderBottom: "2px solid #e2e8f0",
              }}
            >
              Score
            </th>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "left",
                fontWeight: 600,
                color: "#475569",
                borderBottom: "2px solid #e2e8f0",
              }}
            >
              Breakdown
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Batting Strength */}
          <tr style={{ background: "#eff6ff" }}>
            <td
              style={{
                padding: "16px",
                fontWeight: 600,
                color: "#1e40af",
                borderBottom: "1px solid #dbeafe",
              }}
            >
              Batting Strength (BS)
            </td>
            <td
              style={{
                padding: "16px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: 18,
                color: "#1e40af",
                borderBottom: "1px solid #dbeafe",
              }}
            >
              {components?.batting?.battingScore?.toFixed(2) || "0.00"}
            </td>
            <td
              style={{
                padding: "16px",
                color: "#475569",
                borderBottom: "1px solid #dbeafe",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <strong>Top 7 Runs:</strong>{" "}
                  {components?.batting?.breakdown?.top7Runs || 0}
                </div>
                <div>
                  <strong>Batting Avg:</strong>{" "}
                  {components?.batting?.breakdown?.battingAvg?.toFixed(2) ||
                    "0.00"}
                </div>
                <div>
                  <strong>Strike Rate:</strong>{" "}
                  {components?.batting?.breakdown?.battingSR?.toFixed(2) ||
                    "0.00"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Based on top{" "}
                  {components?.batting?.breakdown?.topBattersCount || 7} batters
                </div>
              </div>
            </td>
          </tr>

          {/* Bowling Strength */}
          <tr style={{ background: "#f0fdf4" }}>
            <td
              style={{
                padding: "16px",
                fontWeight: 600,
                color: "#166534",
                borderBottom: "1px solid #dcfce7",
              }}
            >
              Bowling Strength (BWS)
            </td>
            <td
              style={{
                padding: "16px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: 18,
                color: "#166534",
                borderBottom: "1px solid #dcfce7",
              }}
            >
              {components?.bowling?.bowlingScore?.toFixed(2) || "0.00"}
            </td>
            <td
              style={{
                padding: "16px",
                color: "#475569",
                borderBottom: "1px solid #dcfce7",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <strong>Top 5 Wickets:</strong>{" "}
                  {components?.bowling?.breakdown?.top5Wickets || 0}
                </div>
                <div>
                  <strong>Bowling Avg:</strong>{" "}
                  {components?.bowling?.breakdown?.bowlingAvg?.toFixed(2) ||
                    "0.00"}
                </div>
                <div>
                  <strong>Economy:</strong>{" "}
                  {components?.bowling?.breakdown?.bowlingEco?.toFixed(2) ||
                    "0.00"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Based on top{" "}
                  {components?.bowling?.breakdown?.topBowlersCount || 5} bowlers
                </div>
              </div>
            </td>
          </tr>

          {/* Fielding Strength */}
          <tr style={{ background: "#fef2f2" }}>
            <td
              style={{
                padding: "16px",
                fontWeight: 600,
                color: "#991b1b",
                borderBottom: "1px solid #fecaca",
              }}
            >
              Fielding Strength (FS)
            </td>
            <td
              style={{
                padding: "16px",
                textAlign: "center",
                fontWeight: 700,
                fontSize: 18,
                color: "#991b1b",
                borderBottom: "1px solid #fecaca",
              }}
            >
              {components?.fielding?.fieldingScore?.toFixed(2) || "0.00"}
            </td>
            <td
              style={{
                padding: "16px",
                color: "#475569",
                borderBottom: "1px solid #fecaca",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div>
                  <strong>Catches:</strong>{" "}
                  {components?.fielding?.breakdown?.totalCatches || 0}
                </div>
                <div>
                  <strong>Run Outs:</strong>{" "}
                  {components?.fielding?.breakdown?.totalRunOuts || 0}
                </div>
                <div>
                  <strong>Stumpings:</strong>{" "}
                  {components?.fielding?.breakdown?.totalStumpings || 0}
                </div>
                <div>
                  <strong>Per Match Avg:</strong>{" "}
                  {components?.fielding?.breakdown?.fieldingScorePerMatch?.toFixed(
                    2
                  ) || "0.00"}
                </div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Total:{" "}
                  {components?.fielding?.breakdown?.rawFieldingScore || 0}{" "}
                  dismissals
                </div>
              </div>
            </td>
          </tr>

          {/* Overall OSI */}
          <tr style={{ background: "#f1f5f9" }}>
            <td
              style={{
                padding: "18px 16px",
                fontWeight: 700,
                fontSize: 16,
                color: "#0f172a",
              }}
            >
              Overall OSI
            </td>
            <td
              style={{
                padding: "18px 16px",
                textAlign: "center",
                fontWeight: 800,
                fontSize: 24,
                color: "#0f172a",
              }}
            >
              {data.OSI?.toFixed(2) || "0.00"}
            </td>
            <td
              style={{
                padding: "18px 16px",
                color: "#475569",
                fontStyle: "italic",
              }}
            >
              Average of Batting, Bowling, and Fielding Strengths
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Tournament view - all teams comparison table
function TournamentOSITable({ teams }) {
  if (!teams || teams.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        No teams found in this tournament
      </div>
    );
  }

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
        }}
      >
        <thead>
          <tr style={{ background: "#0f172a", color: "white" }}>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              Rank
            </th>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "left",
                fontWeight: 600,
              }}
            >
              Team
            </th>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              Batting Strength
            </th>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              Bowling Strength
            </th>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              Fielding Strength
            </th>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              OSI Score
            </th>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              W/L/D
            </th>
            <th
              style={{
                padding: "14px 16px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              Team Points
            </th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, idx) => {
            // Color based on rank
            let rowBg = "white";
            if (team.rank === 1) rowBg = "#fef3c7"; // Gold
            else if (team.rank === 2) rowBg = "#e0e7ff"; // Silver
            else if (team.rank === 3) rowBg = "#fed7aa"; // Bronze
            else if (idx % 2 === 0) rowBg = "#f9fafb";

            return (
              <tr
                key={team.teamId}
                style={{
                  background: rowBg,
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {team.rank}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>
                    {team.teamName}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                    {team.teamUID || team.teamId}
                  </div>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <div style={{ fontWeight: 600, color: "#1e40af" }}>
                    {team.battingStrength?.toFixed(2) || "0.00"}
                  </div>
                  {team.stats?.batting && (
                    <div
                      style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}
                    >
                      {team.stats.batting.totalRuns} runs @{" "}
                      {team.stats.batting.average.toFixed(1)}
                    </div>
                  )}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <div style={{ fontWeight: 600, color: "#166534" }}>
                    {team.bowlingStrength?.toFixed(2) || "0.00"}
                  </div>
                  {team.stats?.bowling && (
                    <div
                      style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}
                    >
                      {team.stats.bowling.totalWickets}W @{" "}
                      {team.stats.bowling.economy.toFixed(1)}
                    </div>
                  )}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <div style={{ fontWeight: 600, color: "#991b1b" }}>
                    {team.fieldingStrength?.toFixed(2) || "0.00"}
                  </div>
                  {team.stats?.fielding && (
                    <div
                      style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}
                    >
                      {team.stats.fielding.catches}C{" "}
                      {team.stats.fielding.runOuts}RO{" "}
                      {team.stats.fielding.stumpings}S
                    </div>
                  )}
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#0f172a",
                  }}
                >
                  {team.OSI?.toFixed(2) || "0.00"}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <div style={{ fontWeight: 600 }}>
                    <span style={{ color: "#166534" }}>{team.wins}</span>/
                    <span style={{ color: "#991b1b" }}>{team.losses}</span>/
                    <span style={{ color: "#64748b" }}>{team.draws}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    {team.tournamentMatches} matches
                  </div>
                </td>
                <td
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#7c3aed",
                  }}
                >
                  {team.teamPoints?.toFixed(2) || "0.00"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function OSI() {
  const [mode, setMode] = useState("team"); // "team" or "tournament"
  const [inputId, setInputId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Team mode data
  const [teamData, setTeamData] = useState(null);

  // Tournament mode data
  const [tournamentData, setTournamentData] = useState(null);

  // Expanded tournament statistics
  const [expandedTournaments, setExpandedTournaments] = useState(new Set());

  const handleFetch = async () => {
    setError("");
    setTeamData(null);
    setTournamentData(null);
    setExpandedTournaments(new Set());

    if (!inputId.trim()) {
      setError(
        `Please enter a ${mode === "team" ? "team" : "tournament"} UID or ID`
      );
      return;
    }

    setLoading(true);

    try {
      let url;
      if (mode === "team") {
        url = `${API_BASE_URL}/api/teams/${inputId}/osi`;
      } else {
        url = `${API_BASE_URL}/api/teams/tournament/${inputId}/osi`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to fetch OSI data");
      } else {
        if (mode === "team") {
          setTeamData(data.data);
        } else {
          setTournamentData(data.data);
        }
      }
    } catch (err) {
      setError(err.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const dataToDownload = mode === "team" ? teamData : tournamentData;
    if (!dataToDownload) return;

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${
      mode === "team" ? teamData?.teamUID : tournamentData?.tournamentUID
    }-osi.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        padding: "24px",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        minHeight: "100vh",
        background: "#f8fafc",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Opposition Strength Index (OSI)
            </h1>
            <p
              style={{
                margin: "8px 0 0 0",
                color: "#64748b",
                fontSize: 14,
              }}
            >
              Analyze team strength based on Batting, Bowling, and Fielding
              performance
            </p>
          </div>

          {/* Mode Selector */}
          <div
            style={{
              display: "flex",
              gap: 8,
              background: "#f1f5f9",
              padding: 4,
              borderRadius: 8,
            }}
          >
            <button
              onClick={() => {
                setMode("team");
                setInputId("");
                setTeamData(null);
                setTournamentData(null);
                setError("");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: mode === "team" ? "#0f172a" : "transparent",
                color: mode === "team" ? "white" : "#64748b",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Team View
            </button>
            <button
              onClick={() => {
                setMode("tournament");
                setInputId("");
                setTeamData(null);
                setTournamentData(null);
                setError("");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: mode === "tournament" ? "#0f172a" : "transparent",
                color: mode === "tournament" ? "white" : "#64748b",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Tournament View
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 20,
            alignItems: "center",
          }}
        >
          <input
            type="text"
            placeholder={
              mode === "team"
                ? "Enter Team UID or MongoDB ID"
                : "Enter Tournament UID or MongoDB ID"
            }
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleFetch()}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "2px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 15,
              outline: "none",
              transition: "border 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
            onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
          />
          <button
            onClick={handleFetch}
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              background: loading ? "#94a3b8" : "#3b82f6",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 15,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.background = "#2563eb";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.background = "#3b82f6";
            }}
          >
            {loading ? "Loading..." : "Calculate OSI"}
          </button>
          {(teamData || tournamentData) && (
            <button
              onClick={handleDownload}
              style={{
                padding: "12px 20px",
                borderRadius: 8,
                border: "2px solid #e2e8f0",
                background: "white",
                color: "#475569",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 15,
              }}
            >
              Download JSON
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#991b1b",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Team Mode - Individual Team View */}
      {mode === "team" && teamData && (
        <div>
          {/* Team Info Card */}
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  {teamData.teamName}
                </h2>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginTop: 12,
                    fontSize: 14,
                    color: "#64748b",
                  }}
                >
                  <div>
                    <strong>Team UID:</strong>{" "}
                    {teamData.teamUID || teamData.teamId}
                  </div>
                  <div>
                    <strong>Total Matches:</strong>{" "}
                    {teamData.matchStatistics?.overall?.totalMatches || 0}
                  </div>
                  <div>
                    <strong>Players:</strong>{" "}
                    {teamData.teamStats?.totalPlayers || 0}
                  </div>
                </div>
              </div>

              {/* OSI Score Badge */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: 12,
                  padding: "20px 32px",
                  textAlign: "center",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                }}
              >
                <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>
                  Overall OSI
                </div>
                <div style={{ fontSize: 36, fontWeight: 800 }}>
                  {teamData.OSI?.toFixed(2) || "0.00"}
                </div>
              </div>
            </div>
          </div>

          {/* Match Statistics Card */}
          {teamData.matchStatistics && (
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                marginBottom: 24,
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px 0",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Match Statistics
              </h3>

              {/* Overall Stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    background: "#f0fdf4",
                    borderRadius: 10,
                    padding: "16px",
                    border: "2px solid #86efac",
                  }}
                >
                  <div
                    style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}
                  >
                    WINS
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "#166534",
                      marginTop: 4,
                    }}
                  >
                    {teamData.matchStatistics.overall.wins}
                  </div>
                </div>

                <div
                  style={{
                    background: "#fef2f2",
                    borderRadius: 10,
                    padding: "16px",
                    border: "2px solid #fca5a5",
                  }}
                >
                  <div
                    style={{ fontSize: 12, color: "#991b1b", fontWeight: 600 }}
                  >
                    LOSSES
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "#991b1b",
                      marginTop: 4,
                    }}
                  >
                    {teamData.matchStatistics.overall.losses}
                  </div>
                </div>

                <div
                  style={{
                    background: "#f1f5f9",
                    borderRadius: 10,
                    padding: "16px",
                    border: "2px solid #cbd5e1",
                  }}
                >
                  <div
                    style={{ fontSize: 12, color: "#475569", fontWeight: 600 }}
                  >
                    DRAWS
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "#475569",
                      marginTop: 4,
                    }}
                  >
                    {teamData.matchStatistics.overall.draws}
                  </div>
                </div>

                <div
                  style={{
                    background: "#eff6ff",
                    borderRadius: 10,
                    padding: "16px",
                    border: "2px solid #93c5fd",
                  }}
                >
                  <div
                    style={{ fontSize: 12, color: "#1e40af", fontWeight: 600 }}
                  >
                    WIN %
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 800,
                      color: "#1e40af",
                      marginTop: 4,
                    }}
                  >
                    {teamData.matchStatistics.overall.winPercentage}%
                  </div>
                </div>
              </div>

              {/* Tournament-wise Breakdown */}
              {teamData.matchStatistics.byTournament &&
                teamData.matchStatistics.byTournament.length > 0 && (
                  <div>
                    <h4
                      style={{
                        margin: "0 0 12px 0",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#475569",
                      }}
                    >
                      Tournament-wise Performance
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {teamData.matchStatistics.byTournament.map(
                        (tournament) => {
                          const isExpanded = expandedTournaments.has(
                            tournament.tournamentId
                          );
                          return (
                            <div
                              key={tournament.tournamentId}
                              style={{
                                background: "#f8fafc",
                                borderRadius: 8,
                                border: "1px solid #e2e8f0",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                onClick={() => {
                                  const newExpanded = new Set(
                                    expandedTournaments
                                  );
                                  if (isExpanded) {
                                    newExpanded.delete(tournament.tournamentId);
                                  } else {
                                    newExpanded.add(tournament.tournamentId);
                                  }
                                  setExpandedTournaments(newExpanded);
                                }}
                                style={{
                                  padding: "12px 16px",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#f1f5f9";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                }}
                              >
                                <div>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "#0f172a",
                                    }}
                                  >
                                    {tournament.tournamentName}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#64748b",
                                      marginTop: 2,
                                    }}
                                  >
                                    {tournament.tournamentUID} •{" "}
                                    {tournament.matches} matches
                                  </div>
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                  }}
                                >
                                  <div
                                    style={{ fontSize: 14, color: "#64748b" }}
                                  >
                                    <span
                                      style={{
                                        color: "#166534",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {tournament.wins}W
                                    </span>
                                    {" / "}
                                    <span
                                      style={{
                                        color: "#991b1b",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {tournament.losses}L
                                    </span>
                                    {" / "}
                                    <span
                                      style={{
                                        color: "#475569",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {tournament.draws}D
                                    </span>
                                  </div>
                                  <div
                                    style={{ fontSize: 18, color: "#64748b" }}
                                  >
                                    {isExpanded ? "▼" : "▶"}
                                  </div>
                                </div>
                              </div>

                              {isExpanded && (
                                <div
                                  style={{
                                    padding: "16px",
                                    background: "white",
                                    borderTop: "1px solid #e2e8f0",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(4, 1fr)",
                                      gap: 12,
                                    }}
                                  >
                                    <div>
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "#64748b",
                                        }}
                                      >
                                        Total Matches
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 20,
                                          fontWeight: 700,
                                          color: "#0f172a",
                                          marginTop: 4,
                                        }}
                                      >
                                        {tournament.matches}
                                      </div>
                                    </div>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "#64748b",
                                        }}
                                      >
                                        Wins
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 20,
                                          fontWeight: 700,
                                          color: "#166534",
                                          marginTop: 4,
                                        }}
                                      >
                                        {tournament.wins}
                                      </div>
                                    </div>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "#64748b",
                                        }}
                                      >
                                        Losses
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 20,
                                          fontWeight: 700,
                                          color: "#991b1b",
                                          marginTop: 4,
                                        }}
                                      >
                                        {tournament.losses}
                                      </div>
                                    </div>
                                    <div>
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "#64748b",
                                        }}
                                      >
                                        Draws
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 20,
                                          fontWeight: 700,
                                          color: "#475569",
                                          marginTop: 4,
                                        }}
                                      >
                                        {tournament.draws}
                                      </div>
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      marginTop: 12,
                                      padding: "10px",
                                      background: "#f8fafc",
                                      borderRadius: 6,
                                      fontSize: 13,
                                      color: "#475569",
                                    }}
                                  >
                                    <strong>Win Rate:</strong>{" "}
                                    {tournament.matches > 0
                                      ? (
                                          (tournament.wins /
                                            tournament.matches) *
                                          100
                                        ).toFixed(1)
                                      : 0}
                                    %
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Component Breakdown Table */}
          <TeamOSITable data={teamData} />
        </div>
      )}

      {/* Tournament Mode - All Teams Comparison */}
      {mode === "tournament" && tournamentData && (
        <div>
          {/* Tournament Info Card */}
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              marginBottom: 24,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              {tournamentData.tournamentName}
            </h2>
            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 12,
                fontSize: 14,
                color: "#64748b",
              }}
            >
              <div>
                <strong>Tournament UID:</strong>{" "}
                {tournamentData.tournamentUID || tournamentData.tournamentId}
              </div>
              <div>
                <strong>Total Teams:</strong> {tournamentData.totalTeams}
              </div>
            </div>
          </div>

          {/* Teams Comparison Table or Empty State */}
          {tournamentData.isEmpty ? (
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: "48px 32px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>📋</div>
              <h3 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>
                No Teams Registered Yet
              </h3>
              <p style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>
                This tournament exists but doesn't have any teams registered
                yet. Teams need to register before OSI calculations can be
                displayed.
              </p>
              <div
                style={{
                  marginTop: 24,
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#475569",
                }}
              >
                💡 <strong>Tip:</strong> Once teams register and play matches in
                this tournament, their OSI scores will be calculated and
                displayed here.
              </div>
            </div>
          ) : (
            <TournamentOSITable teams={tournamentData.teams} />
          )}
        </div>
      )}

      {/* Help Text */}
      {!teamData && !tournamentData && !loading && (
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: "32px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <h3 style={{ margin: 0, fontSize: 20, color: "#0f172a" }}>
            {mode === "team"
              ? "Enter a Team UID to view OSI breakdown"
              : "Enter a Tournament UID to compare all teams"}
          </h3>
          <p style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>
            {mode === "team"
              ? "OSI shows individual team strength based on batting, bowling, and fielding performance"
              : "Compare all teams in a tournament with their OSI scores, rankings, and team points"}
          </p>

          <div
            style={{
              marginTop: 24,
              padding: "20px",
              background: "#f8fafc",
              borderRadius: 8,
              textAlign: "left",
              maxWidth: 600,
              margin: "24px auto 0",
            }}
          >
            <h4
              style={{ margin: "0 0 12px 0", fontSize: 16, color: "#0f172a" }}
            >
              OSI Components:
            </h4>
            <ul
              style={{
                margin: 0,
                paddingLeft: 20,
                color: "#475569",
                fontSize: 14,
              }}
            >
              <li style={{ marginBottom: 8 }}>
                <strong>Batting Strength (BS):</strong> Based on top 7 batters'
                runs, average, and strike rate
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Bowling Strength (BWS):</strong> Based on top 5 bowlers'
                wickets, economy, and strike rate
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Fielding Strength (FS):</strong> Catches, run-outs, and
                stumpings
              </li>
              <li>
                <strong>Team Points (TP):</strong> (Wins × 3 + Draws × 1) ×
                Opponent OSI
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
