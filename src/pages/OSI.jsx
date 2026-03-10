import React, { useState, useEffect } from "react";
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

// OSI Evolution Flow Diagram Component
function OSIEvolutionDiagram({ teamUID, teamName, currentOSI, totalMatches }) {
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedMatches, setExpandedMatches] = useState(new Set());

  useEffect(() => {
    const fetchMatchByMatchData = async () => {
      if (!teamUID) return;

      setLoading(true);
      setError("");

      try {
        const url = `${API_BASE_URL}/api/osi-analysis/team/${teamUID}/match-by-match`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          setMatchData(data.data);
        } else {
          setError(data.message || "Failed to fetch match data");
        }
      } catch (err) {
        setError("Error loading match evolution data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchByMatchData();
  }, [teamUID]);

  if (loading) {
    return (
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: "40px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          marginBottom: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 14, color: "#64748b" }}>
          Loading OSI evolution data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "#fef2f2",
          borderRadius: 12,
          padding: "16px",
          marginBottom: 24,
          border: "1px solid #fecaca",
        }}
      >
        <div style={{ fontSize: 14, color: "#991b1b" }}>{error}</div>
      </div>
    );
  }

  if (
    !matchData ||
    !matchData.matchByMatchDetails ||
    matchData.matchByMatchDetails.length === 0
  ) {
    return null;
  }

  const progression = matchData.matchByMatchDetails;
  const maxOSI = Math.max(
    ...progression.map((p) => p.osiCalculation.currentOSI),
  );
  const minOSI = Math.min(
    ...progression.map((p) => p.osiCalculation.currentOSI),
  );

  // Check for warnings
  const warnings = matchData.warnings;
  const hasWarnings = warnings && warnings.hasIncompleteProcessing;

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        padding: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        marginBottom: 24,
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}
        >
          📊 OSI Evolution Flow Diagram
        </h3>
        <p style={{ margin: "8px 0 0 0", fontSize: 14, color: "#64748b" }}>
          Track how {teamName}'s OSI has evolved through {totalMatches} matches
        </p>
      </div>

      {/* Data Quality Warning */}
      {hasWarnings && (
        <div
          style={{
            background: "#fffbeb",
            border: "2px solid #fbbf24",
            borderRadius: 10,
            padding: "16px",
            marginBottom: 20,
            display: "flex",
            gap: 12,
            alignItems: "start",
          }}
        >
          <div style={{ fontSize: 24 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#78350f",
                marginBottom: 6,
              }}
            >
              Data Quality Warning
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#92400e",
                marginBottom: 8,
                lineHeight: 1.5,
              }}
            >
              {warnings.message}
            </div>
            <div
              style={{
                display: "flex",
                gap: 16,
                fontSize: 12,
                color: "#78350f",
                marginBottom: 8,
              }}
            >
              <div>
                <strong>Affected Matches:</strong> {warnings.affectedMatches} of{" "}
                {totalMatches}
              </div>
              <div>
                <strong>Completeness:</strong>{" "}
                {matchData.summary.dataQuality.completeness}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#78350f",
                background: "#fef3c7",
                padding: "8px 12px",
                borderRadius: 6,
                fontStyle: "italic",
              }}
            >
              💡 {warnings.recommendation}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "#f0fdf4",
            borderRadius: 8,
            padding: "12px",
            border: "1px solid #86efac",
          }}
        >
          <div style={{ fontSize: 11, color: "#166534", fontWeight: 600 }}>
            STARTING OSI
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#166534",
              marginTop: 4,
            }}
          >
            {progression[0]?.osiCalculation?.currentOSI?.toFixed(2) || "0.80"}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
            {progression[0]?.osiCalculation?.isBenchmarked
              ? "Benchmarked"
              : "Initial"}
          </div>
        </div>

        <div
          style={{
            background: "#eff6ff",
            borderRadius: 8,
            padding: "12px",
            border: "1px solid #93c5fd",
          }}
        >
          <div style={{ fontSize: 11, color: "#1e40af", fontWeight: 600 }}>
            CURRENT OSI
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#1e40af",
              marginTop: 4,
            }}
          >
            {currentOSI?.toFixed(2) || "0.00"}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
            After {totalMatches} matches
          </div>
        </div>

        <div
          style={{
            background: "#fef2f2",
            borderRadius: 8,
            padding: "12px",
            border: "1px solid #fca5a5",
          }}
        >
          <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 600 }}>
            PEAK OSI
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#991b1b",
              marginTop: 4,
            }}
          >
            {maxOSI?.toFixed(2) || "0.00"}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
            Highest recorded
          </div>
        </div>

        <div
          style={{
            background: "#fefce8",
            borderRadius: 8,
            padding: "12px",
            border: "1px solid #fde047",
          }}
        >
          <div style={{ fontSize: 11, color: "#854d0e", fontWeight: 600 }}>
            OSI CHANGE
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color:
                currentOSI - progression[0]?.osiCalculation?.currentOSI >= 0
                  ? "#166534"
                  : "#991b1b",
              marginTop: 4,
            }}
          >
            {currentOSI - progression[0]?.osiCalculation?.currentOSI >= 0
              ? "+"
              : ""}
            {(currentOSI - progression[0]?.osiCalculation?.currentOSI)?.toFixed(
              2,
            ) || "0.00"}
          </div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
            Overall trend
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div
        style={{
          background: "#f8fafc",
          borderRadius: 12,
          padding: "20px",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: 16,
          }}
        >
          Match-by-Match Progression
        </div>

        {progression.map((match, idx) => {
          const nextMatch = progression[idx + 1];
          const osiChange = nextMatch
            ? nextMatch.osiCalculation.currentOSI -
              match.osiCalculation.currentOSI
            : 0;
          const isIncrease = osiChange > 0;
          const isDecrease = osiChange < 0;
          const isExpanded = expandedMatches.has(match.matchNumber);

          // Extract cumulative stats
          const battingStats = match.cumulativeStats?.batting || {};
          const bowlingStats = match.cumulativeStats?.bowling || {};
          const fieldingStats = match.cumulativeStats?.fielding || {};

          return (
            <div
              key={idx}
              style={{
                marginBottom: 16,
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "white",
                  borderRadius: 10,
                  padding: "16px",
                  border: `2px solid ${match.osiCalculation.isBenchmarked ? "#fbbf24" : "#e5e7eb"}`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                {/* Match Number */}
                <div
                  style={{
                    minWidth: 60,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                  >
                    MATCH
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {match.matchNumber}
                  </div>
                </div>

                {/* Match Details */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#0f172a",
                      marginBottom: 4,
                    }}
                  >
                    vs {match.opponent?.name || "Unknown"}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    {match.matchId && (
                      <span
                        style={{
                          background: "#f1f5f9",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontFamily: "monospace",
                          color: "#475569",
                        }}
                      >
                        ID: {match.matchId}
                      </span>
                    )}
                    <span>
                      Result:{" "}
                      <strong
                        style={{
                          color:
                            match.matchResult === "Won"
                              ? "#166534"
                              : match.matchResult === "Lost"
                                ? "#991b1b"
                                : "#64748b",
                        }}
                      >
                        {match.matchResult || "N/A"}
                      </strong>
                    </span>
                    {match.matchDate && (
                      <span>
                        {new Date(match.matchDate).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </div>

                  {/* Post-Match Processing Warning */}
                  {match.postMatchProcessing &&
                    !match.postMatchProcessing.pointsCalculated && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "4px 8px",
                          background: "#fef3c7",
                          borderRadius: 4,
                          fontSize: 10,
                          color: "#78350f",
                          display: "inline-block",
                          fontWeight: 600,
                        }}
                      >
                        ⚠️ {match.postMatchProcessing.warning}
                      </div>
                    )}

                  {/* Component Strengths */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 8,
                      fontSize: 11,
                    }}
                  >
                    <div
                      style={{
                        background: "#eff6ff",
                        padding: "4px 8px",
                        borderRadius: 4,
                        color: "#1e40af",
                      }}
                    >
                      BS:{" "}
                      {match.osiCalculation?.battingStrength?.toFixed(2) ||
                        "0.00"}
                    </div>
                    <div
                      style={{
                        background: "#f0fdf4",
                        padding: "4px 8px",
                        borderRadius: 4,
                        color: "#166534",
                      }}
                    >
                      BWS:{" "}
                      {match.osiCalculation?.bowlingStrength?.toFixed(2) ||
                        "0.00"}
                    </div>
                    <div
                      style={{
                        background: "#fef2f2",
                        padding: "4px 8px",
                        borderRadius: 4,
                        color: "#991b1b",
                      }}
                    >
                      FS:{" "}
                      {match.osiCalculation?.fieldingStrength?.toFixed(2) ||
                        "0.00"}
                    </div>
                  </div>

                  {/* Benchmarking Info */}
                  {match.osiCalculation.isBenchmarked &&
                    match.osiCalculation.transitionInfo && (
                      <div
                        style={{
                          marginTop: 8,
                          padding: "6px 10px",
                          background: "#fffbeb",
                          borderRadius: 6,
                          fontSize: 11,
                          color: "#78350f",
                          border: "1px solid #fde68a",
                        }}
                      >
                        <strong>⚠️ Benchmarked:</strong>{" "}
                        {match.osiCalculation.transitionInfo.stage}
                        {match.osiCalculation.transitionInfo.benchmarkWeight >
                          0 && (
                          <span style={{ marginLeft: 8 }}>
                            (
                            {
                              match.osiCalculation.transitionInfo
                                .benchmarkWeight
                            }
                            % Benchmark +{" "}
                            {
                              match.osiCalculation.transitionInfo
                                .performanceWeight
                            }
                            % Performance)
                          </span>
                        )}
                      </div>
                    )}

                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedMatches);
                      if (isExpanded) {
                        newExpanded.delete(match.matchNumber);
                      } else {
                        newExpanded.add(match.matchNumber);
                      }
                      setExpandedMatches(newExpanded);
                    }}
                    style={{
                      marginTop: 8,
                      padding: "6px 12px",
                      background: isExpanded ? "#f1f5f9" : "#eff6ff",
                      border: `1px solid ${isExpanded ? "#cbd5e1" : "#bfdbfe"}`,
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: isExpanded ? "#475569" : "#1e40af",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = isExpanded
                        ? "#e2e8f0"
                        : "#dbeafe";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = isExpanded
                        ? "#f1f5f9"
                        : "#eff6ff";
                    }}
                  >
                    <span>{isExpanded ? "▼" : "▶"}</span>
                    {isExpanded ? "Hide" : "Show"} Detailed Calculation
                  </button>
                </div>

                {/* OSI Score */}
                <div
                  style={{
                    minWidth: 100,
                    textAlign: "center",
                    padding: "12px",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    borderRadius: 10,
                    color: "white",
                  }}
                >
                  <div style={{ fontSize: 10, opacity: 0.9, marginBottom: 4 }}>
                    OSI
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>
                    {match.osiCalculation?.currentOSI?.toFixed(2) || "0.00"}
                  </div>
                </div>
              </div>

              {/* Expanded Detailed Calculation View */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: 12,
                    background: "#f8fafc",
                    borderRadius: 10,
                    padding: "20px",
                    border: "2px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#0f172a",
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: "2px solid #cbd5e1",
                    }}
                  >
                    📊 Detailed OSI Calculation Breakdown
                  </div>

                  {/* Batting Strength Calculation */}
                  <div
                    style={{
                      background: "white",
                      borderRadius: 8,
                      padding: "16px",
                      marginBottom: 16,
                      border: "2px solid #bfdbfe",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#1e40af",
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>🏏</span>
                      Batting Strength (BS) Calculation
                    </div>

                    {/* Raw Batting Stats */}
                    <div
                      style={{
                        background: "#eff6ff",
                        borderRadius: 6,
                        padding: "12px",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#1e40af",
                          marginBottom: 8,
                        }}
                      >
                        📈 Raw Cumulative Data (Top 7 Batters):
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: 8,
                          fontSize: 12,
                          color: "#475569",
                        }}
                      >
                        <div>
                          <strong>Total Runs:</strong>{" "}
                          <span style={{ color: "#1e40af", fontWeight: 700 }}>
                            {battingStats.runs || 0}
                          </span>
                        </div>
                        <div>
                          <strong>Total Outs:</strong>{" "}
                          <span style={{ color: "#1e40af", fontWeight: 700 }}>
                            {battingStats.outs || 0}
                          </span>
                        </div>
                        <div>
                          <strong>Balls Faced:</strong>{" "}
                          <span style={{ color: "#1e40af", fontWeight: 700 }}>
                            {battingStats.ballsFaced || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Calculate Batting Average */}
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 6,
                        padding: "10px",
                        marginBottom: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        Step 1: Calculate Batting Average
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#475569",
                          background: "white",
                          padding: "8px",
                          borderRadius: 4,
                        }}
                      >
                        Batting Average = Total Runs / Total Outs
                        <br />= {battingStats.runs || 0} /{" "}
                        {battingStats.outs || 0}
                        <br />={" "}
                        <strong style={{ color: "#1e40af" }}>
                          {battingStats.average?.toFixed(2) || "0.00"}
                        </strong>
                      </div>
                    </div>

                    {/* Step 2: Calculate Strike Rate */}
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 6,
                        padding: "10px",
                        marginBottom: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        Step 2: Calculate Strike Rate
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#475569",
                          background: "white",
                          padding: "8px",
                          borderRadius: 4,
                        }}
                      >
                        Strike Rate = (Total Runs / Balls Faced) × 100
                        <br />= ({battingStats.runs || 0} /{" "}
                        {battingStats.ballsFaced || 0}) × 100
                        <br />={" "}
                        <strong style={{ color: "#1e40af" }}>
                          {battingStats.strikeRate?.toFixed(2) || "0.00"}
                        </strong>
                      </div>
                    </div>

                    {/* Step 3: Calculate BS */}
                    <div
                      style={{
                        background: "#dbeafe",
                        borderRadius: 6,
                        padding: "10px",
                        border: "2px solid #93c5fd",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#1e3a8a",
                          marginBottom: 4,
                        }}
                      >
                        Step 3: Calculate Batting Strength (BS)
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#1e3a8a",
                          background: "white",
                          padding: "8px",
                          borderRadius: 4,
                        }}
                      >
                        <div style={{ marginBottom: 8 }}>
                          <strong>Formula:</strong> BS = (Batting Avg / 25 ×
                          0.6) + (Strike Rate / 100 × 0.4)
                        </div>
                        <div>
                          BS = ({battingStats.average?.toFixed(2) || 0} / 25 ×
                          0.6) + ({battingStats.strikeRate?.toFixed(2) || 0} /
                          100 × 0.4)
                          <br />
                          BS = ({(battingStats.average / 25)?.toFixed(3) || 0} ×
                          0.6) + (
                          {(battingStats.strikeRate / 100)?.toFixed(3) || 0} ×
                          0.4)
                          <br />
                          BS ={" "}
                          {((battingStats.average / 25) * 0.6)?.toFixed(3) ||
                            0}{" "}
                          +{" "}
                          {((battingStats.strikeRate / 100) * 0.4)?.toFixed(
                            3,
                          ) || 0}
                          <br />
                          <strong style={{ fontSize: 14, color: "#1e40af" }}>
                            BS = {battingStats.strength?.toFixed(2) || "0.50"}{" "}
                            (clamped to 0.5-1.5 range)
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bowling Strength Calculation */}
                  <div
                    style={{
                      background: "white",
                      borderRadius: 8,
                      padding: "16px",
                      marginBottom: 16,
                      border: "2px solid #bbf7d0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#166534",
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>⚾</span>
                      Bowling Strength (BWS) Calculation
                    </div>

                    {/* Raw Bowling Stats */}
                    <div
                      style={{
                        background: "#f0fdf4",
                        borderRadius: 6,
                        padding: "12px",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#166534",
                          marginBottom: 8,
                        }}
                      >
                        📈 Raw Cumulative Data (Top 5 Bowlers):
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: 8,
                          fontSize: 12,
                          color: "#475569",
                        }}
                      >
                        <div>
                          <strong>Total Wickets:</strong>{" "}
                          <span style={{ color: "#166534", fontWeight: 700 }}>
                            {bowlingStats.wickets || 0}
                          </span>
                        </div>
                        <div>
                          <strong>Runs Conceded:</strong>{" "}
                          <span style={{ color: "#166534", fontWeight: 700 }}>
                            {bowlingStats.runsConceded || 0}
                          </span>
                        </div>
                        <div>
                          <strong>Balls Bowled:</strong>{" "}
                          <span style={{ color: "#166534", fontWeight: 700 }}>
                            {bowlingStats.ballsBowled || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Calculate Bowling Average */}
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 6,
                        padding: "10px",
                        marginBottom: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        Step 1: Calculate Bowling Average
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#475569",
                          background: "white",
                          padding: "8px",
                          borderRadius: 4,
                        }}
                      >
                        Bowling Average = Runs Conceded / Wickets
                        <br />= {bowlingStats.runsConceded || 0} /{" "}
                        {bowlingStats.wickets || 0}
                        <br />={" "}
                        <strong
                          style={{
                            color:
                              bowlingStats.average === null
                                ? "#dc2626"
                                : "#166534",
                          }}
                        >
                          {bowlingStats.average !== null
                            ? bowlingStats.average.toFixed(2)
                            : "N/A (no wickets)"}
                        </strong>
                      </div>
                    </div>

                    {/* Step 2: Calculate Economy */}
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 6,
                        padding: "10px",
                        marginBottom: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        Step 2: Calculate Economy Rate
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#475569",
                          background: "white",
                          padding: "8px",
                          borderRadius: 4,
                        }}
                      >
                        Economy = (Runs Conceded / Balls Bowled) × 6
                        <br />= ({bowlingStats.runsConceded || 0} /{" "}
                        {bowlingStats.ballsBowled || 0}) × 6
                        <br />={" "}
                        <strong style={{ color: "#166534" }}>
                          {bowlingStats.economy?.toFixed(2) || "0.00"}
                        </strong>
                      </div>
                    </div>

                    {/* Step 3: Calculate BWS */}
                    <div
                      style={{
                        background: "#dcfce7",
                        borderRadius: 6,
                        padding: "10px",
                        border: "2px solid #86efac",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#14532d",
                          marginBottom: 4,
                        }}
                      >
                        Step 3: Calculate Bowling Strength (BWS)
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#14532d",
                          background: "white",
                          padding: "8px",
                          borderRadius: 4,
                        }}
                      >
                        <div style={{ marginBottom: 8 }}>
                          <strong>Formula:</strong>{" "}
                          {bowlingStats.average !== null
                            ? "BWS = (25 / Bowling Avg × 0.6) + (6 / Economy × 0.4)"
                            : "BWS = (6 / Economy × 0.6) [No wickets penalty]"}
                        </div>
                        <div>
                          {bowlingStats.average !== null ? (
                            <>
                              BWS = (25 / {bowlingStats.average.toFixed(2)} ×
                              0.6) + (6 /{" "}
                              {bowlingStats.economy?.toFixed(2) || 0} × 0.4)
                              <br />
                              BWS = ({(25 / bowlingStats.average).toFixed(3)} ×
                              0.6) + (
                              {(6 / bowlingStats.economy)?.toFixed(3) || 0} ×
                              0.4)
                              <br />
                              BWS ={" "}
                              {((25 / bowlingStats.average) * 0.6).toFixed(
                                3,
                              )} +{" "}
                              {((6 / bowlingStats.economy) * 0.4)?.toFixed(3) ||
                                0}
                              <br />
                            </>
                          ) : (
                            <>
                              <span style={{ color: "#dc2626" }}>
                                ⚠ No wickets taken - using economy-only penalty
                                calculation
                              </span>
                              <br />
                              BWS = (6 / {bowlingStats.economy?.toFixed(2) ||
                                0}{" "}
                              × 0.6)
                              <br />
                              BWS ={" "}
                              {((6 / bowlingStats.economy) * 0.6)?.toFixed(3) ||
                                0}
                              <br />
                            </>
                          )}
                          <strong style={{ fontSize: 14, color: "#166534" }}>
                            BWS = {bowlingStats.strength?.toFixed(2) || "0.50"}{" "}
                            {bowlingStats.average !== null
                              ? "(clamped to 0.5-1.5 range)"
                              : "(capped at 0.5-0.7 for no wickets)"}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fielding Strength Calculation */}
                  <div
                    style={{
                      background: "white",
                      borderRadius: 8,
                      padding: "16px",
                      marginBottom: 16,
                      border: "2px solid #fecaca",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#991b1b",
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>🧤</span>
                      Fielding Strength (FS) Calculation
                    </div>

                    {/* Raw Fielding Stats */}
                    <div
                      style={{
                        background: "#fef2f2",
                        borderRadius: 6,
                        padding: "12px",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#991b1b",
                          marginBottom: 8,
                        }}
                      >
                        📈 Raw Cumulative Data (All Players):
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(150px, 1fr))",
                          gap: 8,
                          fontSize: 12,
                          color: "#475569",
                        }}
                      >
                        <div>
                          <strong>Catches:</strong>{" "}
                          <span style={{ color: "#991b1b", fontWeight: 700 }}>
                            {fieldingStats.catches || 0}
                          </span>
                        </div>
                        <div>
                          <strong>Run Outs:</strong>{" "}
                          <span style={{ color: "#991b1b", fontWeight: 700 }}>
                            {fieldingStats.runOuts || 0}
                          </span>
                        </div>
                        <div>
                          <strong>Stumpings:</strong>{" "}
                          <span style={{ color: "#991b1b", fontWeight: 700 }}>
                            {fieldingStats.stumpings || 0}
                          </span>
                        </div>
                        <div>
                          <strong>Total Dismissals:</strong>{" "}
                          <span style={{ color: "#991b1b", fontWeight: 700 }}>
                            {fieldingStats.totalDismissals || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 1: Calculate Dismissals Per Match */}
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 6,
                        padding: "10px",
                        marginBottom: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        Step 1: Calculate Dismissals Per Match
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#475569",
                          background: "white",
                          padding: "8px",
                          borderRadius: 4,
                        }}
                      >
                        Dismissals Per Match = Total Dismissals / Matches Played
                        <br />= {fieldingStats.totalDismissals || 0} /{" "}
                        {match.matchNumber}
                        <br />={" "}
                        <strong style={{ color: "#991b1b" }}>
                          {fieldingStats.dismissalsPerMatch?.toFixed(2) ||
                            "0.00"}
                        </strong>
                      </div>
                    </div>

                    {/* Step 2: Calculate FS */}
                    <div
                      style={{
                        background: "#fee2e2",
                        borderRadius: 6,
                        padding: "10px",
                        border: "2px solid #fca5a5",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#7f1d1d",
                          marginBottom: 4,
                        }}
                      >
                        Step 2: Calculate Fielding Strength (FS)
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontFamily: "monospace",
                          color: "#7f1d1d",
                          background: "white",
                          padding: "8px",
                          borderRadius: 4,
                        }}
                      >
                        <div style={{ marginBottom: 8 }}>
                          <strong>Formula:</strong> FS = (Dismissals Per Match)
                          / 5
                        </div>
                        <div>
                          FS ={" "}
                          {fieldingStats.dismissalsPerMatch?.toFixed(2) || 0} /
                          5
                          <br />
                          <strong style={{ fontSize: 14, color: "#991b1b" }}>
                            FS = {fieldingStats.strength?.toFixed(2) || "0.50"}{" "}
                            (clamped to 0.5-1.5 range)
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final OSI Calculation */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      borderRadius: 8,
                      padding: "16px",
                      color: "white",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>🎯</span>
                      Final OSI Calculation
                    </div>

                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        borderRadius: 6,
                        padding: "12px",
                        fontSize: 13,
                        fontFamily: "monospace",
                      }}
                    >
                      {!match.osiCalculation.isBenchmarked ? (
                        <>
                          <div style={{ marginBottom: 8 }}>
                            <strong>Performance-Based OSI:</strong>
                          </div>
                          <div>
                            OSI = (BS + BWS + FS) / 3
                            <br />= ({battingStats.strength?.toFixed(2) ||
                              0} + {bowlingStats.strength?.toFixed(2) || 0} +{" "}
                            {fieldingStats.strength?.toFixed(2) || 0}) / 3
                            <br />={" "}
                            {(
                              (battingStats.strength +
                                bowlingStats.strength +
                                fieldingStats.strength) /
                              3
                            )?.toFixed(3) || 0}
                            <br />
                            <strong style={{ fontSize: 16 }}>
                              Final OSI ={" "}
                              {match.osiCalculation.currentOSI?.toFixed(2) ||
                                "0.00"}
                            </strong>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ marginBottom: 8 }}>
                            <strong>Blended OSI (Benchmarked):</strong>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            Performance OSI = (BS + BWS + FS) / 3
                            <br />= ({battingStats.strength?.toFixed(2) ||
                              0} + {bowlingStats.strength?.toFixed(2) || 0} +{" "}
                            {fieldingStats.strength?.toFixed(2) || 0}) / 3
                            <br />={" "}
                            {match.osiCalculation.performanceOSI?.toFixed(2) ||
                              "0.00"}
                          </div>
                          <div>
                            Blended OSI = (0.80 ×{" "}
                            {
                              match.osiCalculation.transitionInfo
                                .benchmarkWeight
                            }
                            %) + (Performance ×{" "}
                            {
                              match.osiCalculation.transitionInfo
                                .performanceWeight
                            }
                            %)
                            <br />= (0.80 ×{" "}
                            {match.osiCalculation.transitionInfo
                              .benchmarkWeight / 100}
                            ) + (
                            {match.osiCalculation.performanceOSI?.toFixed(2)} ×{" "}
                            {match.osiCalculation.transitionInfo
                              .performanceWeight / 100}
                            )
                            <br />={" "}
                            {(
                              (0.8 *
                                match.osiCalculation.transitionInfo
                                  .benchmarkWeight) /
                              100
                            )?.toFixed(3)}{" "}
                            +{" "}
                            {(
                              (match.osiCalculation.performanceOSI *
                                match.osiCalculation.transitionInfo
                                  .performanceWeight) /
                              100
                            )?.toFixed(3)}
                            <br />
                            <strong style={{ fontSize: 16 }}>
                              Final OSI ={" "}
                              {match.osiCalculation.currentOSI?.toFixed(2) ||
                                "0.00"}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* OSI Raw Points (Unclamped) */}
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      borderRadius: 8,
                      padding: "16px",
                      color: "white",
                      marginTop: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>📊</span>
                      OSI Raw Points (Unclamped Components)
                    </div>

                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        borderRadius: 6,
                        padding: "12px",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ fontSize: 12, marginBottom: 8 }}>
                        <strong>
                          Raw Components (Before 0.5-1.5 Clamping):
                        </strong>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 12,
                          fontSize: 13,
                        }}
                      >
                        <div
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            padding: 8,
                            borderRadius: 4,
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: 11, opacity: 0.9 }}>
                            Raw BS
                          </div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              fontFamily: "monospace",
                            }}
                          >
                            {battingStats.rawStrength?.toFixed(3) ||
                              battingStats.strength?.toFixed(3) ||
                              "0.500"}
                          </div>
                        </div>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            padding: 8,
                            borderRadius: 4,
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: 11, opacity: 0.9 }}>
                            Raw BWS
                          </div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              fontFamily: "monospace",
                            }}
                          >
                            {bowlingStats.rawStrength?.toFixed(3) ||
                              bowlingStats.strength?.toFixed(3) ||
                              "0.500"}
                          </div>
                        </div>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            padding: 8,
                            borderRadius: 4,
                            textAlign: "center",
                          }}
                        >
                          <div style={{ fontSize: 11, opacity: 0.9 }}>
                            Raw FS
                          </div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 700,
                              fontFamily: "monospace",
                            }}
                          >
                            {fieldingStats.rawStrength?.toFixed(3) ||
                              fieldingStats.strength?.toFixed(3) ||
                              "0.500"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        borderRadius: 6,
                        padding: "12px",
                        fontSize: 13,
                        fontFamily: "monospace",
                      }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <strong>OSI Raw Points Calculation:</strong>
                      </div>
                      <div>
                        OSI Raw Points = Raw BS + Raw BWS + Raw FS
                        <br />={" "}
                        {battingStats.rawStrength?.toFixed(3) ||
                          battingStats.strength?.toFixed(3) ||
                          "0.500"}{" "}
                        +{" "}
                        {bowlingStats.rawStrength?.toFixed(3) ||
                          bowlingStats.strength?.toFixed(3) ||
                          "0.500"}{" "}
                        +{" "}
                        {fieldingStats.rawStrength?.toFixed(3) ||
                          fieldingStats.strength?.toFixed(3) ||
                          "0.500"}
                        <br />
                        <strong
                          style={{
                            fontSize: 16,
                            background: "rgba(255,255,255,0.25)",
                            padding: "4px 8px",
                            borderRadius: 4,
                            display: "inline-block",
                            marginTop: 8,
                          }}
                        >
                          OSI Raw Points ={" "}
                          {(
                            (battingStats.rawStrength ||
                              battingStats.strength ||
                              0.5) +
                            (bowlingStats.rawStrength ||
                              bowlingStats.strength ||
                              0.5) +
                            (fieldingStats.rawStrength ||
                              fieldingStats.strength ||
                              0.5)
                          ).toFixed(3)}
                        </strong>
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: "1px solid rgba(255,255,255,0.3)",
                          fontSize: 11,
                          opacity: 0.9,
                        }}
                      >
                        ℹ️ This is the sum of unclamped component values. The
                        standard OSI (above) uses clamped values (0.5-1.5 range)
                        divided by 3.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Arrow indicator between matches */}
              {nextMatch && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "8px 0",
                    fontSize: 12,
                    color: isIncrease
                      ? "#166534"
                      : isDecrease
                        ? "#991b1b"
                        : "#64748b",
                    fontWeight: 600,
                  }}
                >
                  <div
                    style={{
                      background: isIncrease
                        ? "#f0fdf4"
                        : isDecrease
                          ? "#fef2f2"
                          : "#f8fafc",
                      padding: "4px 12px",
                      borderRadius: 20,
                      border: `1px solid ${isIncrease ? "#86efac" : isDecrease ? "#fca5a5" : "#e5e7eb"}`,
                    }}
                  >
                    {isIncrease && "↑ "}
                    {isDecrease && "↓ "}
                    {osiChange >= 0 ? "+" : ""}
                    {osiChange.toFixed(3)}
                    {isIncrease && " (Improved)"}
                    {isDecrease && " (Declined)"}
                    {!isIncrease && !isDecrease && " (Stable)"}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Statistical Summary */}
      <div
        style={{
          marginTop: 20,
          padding: "16px",
          background: "#f8fafc",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#0f172a",
            marginBottom: 12,
          }}
        >
          📈 Statistical Verification
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            fontSize: 12,
            color: "#475569",
          }}
        >
          <div>
            <strong>Total Matches Analyzed:</strong> {progression.length}
          </div>
          <div>
            <strong>Benchmarked Matches:</strong>{" "}
            {progression.filter((m) => m.osiCalculation.isBenchmarked).length}
          </div>
          <div>
            <strong>Performance-Based:</strong>{" "}
            {progression.filter((m) => !m.osiCalculation.isBenchmarked).length}
          </div>
          <div>
            <strong>OSI Range:</strong> {minOSI.toFixed(2)} -{" "}
            {maxOSI.toFixed(2)}
          </div>
          <div>
            <strong>Average OSI:</strong>{" "}
            {(
              progression.reduce(
                (sum, m) => sum + m.osiCalculation.currentOSI,
                0,
              ) / progression.length
            ).toFixed(2)}
          </div>
          <div>
            <strong>Wins:</strong>{" "}
            {progression.filter((m) => m.matchResult === "Won").length} (
            {(
              (progression.filter((m) => m.matchResult === "Won").length /
                progression.length) *
              100
            ).toFixed(1)}
            %)
          </div>
        </div>
      </div>
    </div>
  );
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
                    2,
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
            if (team.rank === 1)
              rowBg = "#fef3c7"; // Gold
            else if (team.rank === 2)
              rowBg = "#e0e7ff"; // Silver
            else if (team.rank === 3)
              rowBg = "#fed7aa"; // Bronze
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
  const [mode, setMode] = useState("team"); // "team", "tournament", or "global"
  const [inputId, setInputId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Team mode data
  const [teamData, setTeamData] = useState(null);

  // Tournament mode data
  const [tournamentData, setTournamentData] = useState(null);

  // Global leaderboard data
  const [globalLeaderboardData, setGlobalLeaderboardData] = useState(null);

  // Expanded tournament statistics
  const [expandedTournaments, setExpandedTournaments] = useState(new Set());

  // Tournament-specific OSI data
  const [tournamentOSIData, setTournamentOSIData] = useState({});
  const [loadingTournamentOSI, setLoadingTournamentOSI] = useState({});

  // Auto-fetch global leaderboard when switching to global mode
  useEffect(() => {
    if (mode === "global") {
      fetchGlobalLeaderboard();
    }
  }, [mode]);

  const fetchGlobalLeaderboard = async () => {
    setError("");
    setTeamData(null);
    setTournamentData(null);
    setGlobalLeaderboardData(null);
    setLoading(true);

    try {
      const url = `${API_BASE_URL}/api/osi-analysis/leaderboard/global`;
      const res = await fetch(url);
      const data = await res.json();

      console.log("Global Leaderboard Response:", data);

      if (!data.success) {
        setError(data.message || "Failed to fetch global leaderboard");
      } else {
        setGlobalLeaderboardData(data);
        console.log("Global Leaderboard Data Set:", data);
      }
    } catch (err) {
      console.error("Error fetching global leaderboard:", err);
      setError(err.message || "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = async () => {
    setError("");
    setTeamData(null);
    setTournamentData(null);
    setGlobalLeaderboardData(null);
    setExpandedTournaments(new Set());
    setTournamentOSIData({});
    setLoadingTournamentOSI({});

    if (!inputId.trim()) {
      setError(
        `Please enter a ${mode === "team" ? "team" : "tournament"} UID or ID`,
      );
      return;
    }

    setLoading(true);

    try {
      let url;
      if (mode === "team") {
        url = `${API_BASE_URL}/api/teams/${inputId}/osi`;
      } else if (mode === "tournament") {
        url = `${API_BASE_URL}/api/teams/tournament/${inputId}/osi`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Failed to fetch OSI data");
      } else {
        if (mode === "team") {
          setTeamData(data.data);
        } else if (mode === "tournament") {
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

  // Fetch tournament-specific OSI breakdown
  const fetchTournamentOSI = async (tournamentId, teamUID) => {
    // Check if already loaded
    if (tournamentOSIData[tournamentId]) {
      return;
    }

    setLoadingTournamentOSI((prev) => ({ ...prev, [tournamentId]: true }));

    try {
      const url = `${API_BASE_URL}/api/teams/${teamUID}/osi/tournament/${tournamentId}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setTournamentOSIData((prev) => ({
          ...prev,
          [tournamentId]: data.data,
        }));
      } else {
        console.error("Failed to fetch tournament OSI:", data.message);
      }
    } catch (err) {
      console.error("Error fetching tournament OSI:", err);
    } finally {
      setLoadingTournamentOSI((prev) => ({ ...prev, [tournamentId]: false }));
    }
  };

  // Handle tournament expansion with OSI fetch
  const handleTournamentExpand = (tournament) => {
    const newExpanded = new Set(expandedTournaments);
    const isExpanding = !expandedTournaments.has(tournament.tournamentId);

    if (isExpanding) {
      newExpanded.add(tournament.tournamentId);
      // Fetch tournament-specific OSI data
      fetchTournamentOSI(tournament.tournamentId, teamData.teamUID || inputId);
    } else {
      newExpanded.delete(tournament.tournamentId);
    }

    setExpandedTournaments(newExpanded);
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
                setGlobalLeaderboardData(null);
                setError("");
                setExpandedTournaments(new Set());
                setTournamentOSIData({});
                setLoadingTournamentOSI({});
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
                setGlobalLeaderboardData(null);
                setError("");
                setExpandedTournaments(new Set());
                setTournamentOSIData({});
                setLoadingTournamentOSI({});
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
            <button
              onClick={() => {
                setMode("global");
                setInputId("");
                setTeamData(null);
                setTournamentData(null);
                setGlobalLeaderboardData(null);
                setError("");
                setExpandedTournaments(new Set());
                setTournamentOSIData({});
                setLoadingTournamentOSI({});
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: mode === "global" ? "#0f172a" : "transparent",
                color: mode === "global" ? "white" : "#64748b",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              🌍 Global Leaderboard
            </button>
          </div>
        </div>

        {/* Input Section - Only show for team and tournament modes */}
        {mode !== "global" && (
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
        )}

        {/* Global mode loading indicator */}
        {mode === "global" && loading && (
          <div
            style={{
              marginTop: 20,
              padding: "16px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 8,
              color: "#1e40af",
              fontSize: 14,
              textAlign: "center",
            }}
          >
            Loading global leaderboard data...
          </div>
        )}

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
                            tournament.tournamentId,
                          );
                          const tournamentOSI =
                            tournamentOSIData[tournament.tournamentId];
                          const isLoadingOSI =
                            loadingTournamentOSI[tournament.tournamentId];

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
                                onClick={() =>
                                  handleTournamentExpand(tournament)
                                }
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
                                  {/* Match Statistics */}
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(4, 1fr)",
                                      gap: 12,
                                      marginBottom: 16,
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

                                  {/* Win Rate */}
                                  <div
                                    style={{
                                      marginBottom: 16,
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

                                  {/* Tournament-specific OSI Breakdown */}
                                  {isLoadingOSI && (
                                    <div
                                      style={{
                                        padding: "20px",
                                        textAlign: "center",
                                        color: "#64748b",
                                        fontSize: 14,
                                      }}
                                    >
                                      Loading tournament OSI...
                                    </div>
                                  )}

                                  {!isLoadingOSI && tournamentOSI && (
                                    <div>
                                      <div
                                        style={{
                                          fontSize: 14,
                                          fontWeight: 600,
                                          color: "#0f172a",
                                          marginBottom: 12,
                                          paddingBottom: 8,
                                          borderBottom: "2px solid #e2e8f0",
                                        }}
                                      >
                                        Tournament OSI Breakdown
                                      </div>

                                      {/* Overall Tournament OSI */}
                                      <div
                                        style={{
                                          background:
                                            "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                          borderRadius: 8,
                                          padding: "16px",
                                          marginBottom: 12,
                                          color: "white",
                                          display: "flex",
                                          justifyContent: "space-between",
                                          alignItems: "center",
                                        }}
                                      >
                                        <div>
                                          <div
                                            style={{
                                              fontSize: 12,
                                              opacity: 0.9,
                                            }}
                                          >
                                            Tournament OSI
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 14,
                                              opacity: 0.8,
                                              marginTop: 2,
                                            }}
                                          >
                                            (BS + BWS + FS) / 3
                                          </div>
                                        </div>
                                        <div
                                          style={{
                                            fontSize: 32,
                                            fontWeight: 800,
                                          }}
                                        >
                                          {tournamentOSI.osi?.overall?.toFixed(
                                            2,
                                          ) || "0.00"}
                                        </div>
                                      </div>

                                      {/* OSI Components Grid */}
                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns: "repeat(3, 1fr)",
                                          gap: 12,
                                        }}
                                      >
                                        {/* Batting Strength */}
                                        <div
                                          style={{
                                            background: "#eff6ff",
                                            borderRadius: 8,
                                            padding: "12px",
                                            border: "2px solid #bfdbfe",
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontSize: 11,
                                              color: "#1e40af",
                                              fontWeight: 600,
                                              marginBottom: 6,
                                            }}
                                          >
                                            BATTING STRENGTH (BS)
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 24,
                                              fontWeight: 800,
                                              color: "#1e40af",
                                              marginBottom: 8,
                                            }}
                                          >
                                            {tournamentOSI.osi?.battingStrength?.toFixed(
                                              2,
                                            ) || "0.00"}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 10,
                                              color: "#475569",
                                              lineHeight: 1.4,
                                            }}
                                          >
                                            <div>
                                              Runs:{" "}
                                              {tournamentOSI.batting
                                                ?.totalRuns || 0}
                                            </div>
                                            <div>
                                              Avg:{" "}
                                              {tournamentOSI.batting?.battingAverage?.toFixed(
                                                2,
                                              ) || "0.00"}
                                            </div>
                                            <div>
                                              SR:{" "}
                                              {tournamentOSI.batting?.strikeRate?.toFixed(
                                                2,
                                              ) || "0.00"}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Bowling Strength */}
                                        <div
                                          style={{
                                            background: "#f0fdf4",
                                            borderRadius: 8,
                                            padding: "12px",
                                            border: "2px solid #bbf7d0",
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontSize: 11,
                                              color: "#166534",
                                              fontWeight: 600,
                                              marginBottom: 6,
                                            }}
                                          >
                                            BOWLING STRENGTH (BWS)
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 24,
                                              fontWeight: 800,
                                              color: "#166534",
                                              marginBottom: 8,
                                            }}
                                          >
                                            {tournamentOSI.osi?.bowlingStrength?.toFixed(
                                              2,
                                            ) || "0.00"}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 10,
                                              color: "#475569",
                                              lineHeight: 1.4,
                                            }}
                                          >
                                            <div>
                                              Wickets:{" "}
                                              {tournamentOSI.bowling
                                                ?.totalWickets || 0}
                                            </div>
                                            <div>
                                              Avg:{" "}
                                              {tournamentOSI.bowling?.bowlingAverage?.toFixed(
                                                2,
                                              ) || "0.00"}
                                            </div>
                                            <div>
                                              Eco:{" "}
                                              {tournamentOSI.bowling?.economy?.toFixed(
                                                2,
                                              ) || "0.00"}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Fielding Strength */}
                                        <div
                                          style={{
                                            background: "#fef2f2",
                                            borderRadius: 8,
                                            padding: "12px",
                                            border: "2px solid #fecaca",
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontSize: 11,
                                              color: "#991b1b",
                                              fontWeight: 600,
                                              marginBottom: 6,
                                            }}
                                          >
                                            FIELDING STRENGTH (FS)
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 24,
                                              fontWeight: 800,
                                              color: "#991b1b",
                                              marginBottom: 8,
                                            }}
                                          >
                                            {tournamentOSI.osi?.fieldingStrength?.toFixed(
                                              2,
                                            ) || "0.00"}
                                          </div>
                                          <div
                                            style={{
                                              fontSize: 10,
                                              color: "#475569",
                                              lineHeight: 1.4,
                                            }}
                                          >
                                            <div>
                                              Catches:{" "}
                                              {tournamentOSI.fielding
                                                ?.totalCatches || 0}
                                            </div>
                                            <div>
                                              Run Outs:{" "}
                                              {tournamentOSI.fielding
                                                ?.totalRunOuts || 0}
                                            </div>
                                            <div>
                                              Stumpings:{" "}
                                              {tournamentOSI.fielding
                                                ?.totalStumpings || 0}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Benchmarking System Explanation */}
          {teamData.isBenchmarked && teamData.transitionInfo && (
            <div
              style={{
                background: "white",
                borderRadius: 12,
                padding: "24px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                marginBottom: 24,
                border: "2px solid #fbbf24",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 800,
                  }}
                >
                  ⚠️
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#0f172a",
                  }}
                >
                  Benchmarking System Active
                </h3>
              </div>

              <div
                style={{
                  background: "#fffbeb",
                  borderRadius: 8,
                  padding: "16px",
                  marginBottom: 16,
                  border: "1px solid #fde68a",
                }}
              >
                <div
                  style={{ fontWeight: 600, color: "#92400e", marginBottom: 8 }}
                >
                  Current Stage: {teamData.transitionInfo.stage}
                </div>
                <div style={{ color: "#78350f", fontSize: 14 }}>
                  {teamData.transitionInfo.reason}
                </div>
              </div>

              {teamData.transitionInfo.stage === "Transitioning" && (
                <div>
                  <div
                    style={{ fontSize: 14, color: "#64748b", marginBottom: 12 }}
                  >
                    <strong>Blended OSI Formula:</strong> (Benchmark ×{" "}
                    {teamData.transitionInfo.benchmarkWeight}%) + (Performance ×{" "}
                    {teamData.transitionInfo.performanceWeight}%)
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        background: "#f1f5f9",
                        borderRadius: 8,
                        padding: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        Benchmark OSI
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#475569",
                        }}
                      >
                        {teamData.transitionInfo.benchmarkOSI?.toFixed(2) ||
                          "0.80"}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}
                      >
                        Weight: {teamData.transitionInfo.benchmarkWeight}%
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#eff6ff",
                        borderRadius: 8,
                        padding: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          marginBottom: 4,
                        }}
                      >
                        Performance OSI
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 700,
                          color: "#1e40af",
                        }}
                      >
                        {teamData.transitionInfo.performanceOSI?.toFixed(2) ||
                          "0.00"}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}
                      >
                        Weight: {teamData.transitionInfo.performanceWeight}%
                      </div>
                    </div>

                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        borderRadius: 8,
                        padding: "12px",
                        color: "white",
                      }}
                    >
                      <div
                        style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}
                      >
                        Blended OSI
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700 }}>
                        {teamData.transitionInfo.blendedOSI?.toFixed(2) ||
                          teamData.OSI?.toFixed(2) ||
                          "0.00"}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                        Final Result
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "white",
                      borderRadius: 8,
                      padding: "12px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "#475569",
                        marginBottom: 8,
                      }}
                    >
                      <strong>Calculation:</strong>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        fontFamily: "monospace",
                        background: "#f8fafc",
                        padding: "8px",
                        borderRadius: 4,
                      }}
                    >
                      Blended OSI = (0.80 ×{" "}
                      {teamData.transitionInfo.benchmarkWeight / 100}) + (
                      {teamData.transitionInfo.performanceOSI?.toFixed(2)} ×{" "}
                      {teamData.transitionInfo.performanceWeight / 100}) ={" "}
                      <strong style={{ color: "#d97706" }}>
                        {teamData.transitionInfo.blendedOSI?.toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div
                style={{
                  marginTop: 16,
                  padding: "12px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  fontSize: 13,
                  color: "#475569",
                }}
              >
                <div style={{ marginBottom: 8 }}>
                  <strong>Matches Played:</strong>{" "}
                  {teamData.transitionInfo.matchesPlayed}
                </div>
                {teamData.transitionInfo.matchesNeeded > 0 && (
                  <div>
                    <strong>Matches Until Full Performance-Based:</strong>{" "}
                    {teamData.transitionInfo.matchesNeeded}
                  </div>
                )}
              </div>

              {/* Benchmarking Timeline */}
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0f172a",
                    marginBottom: 12,
                  }}
                >
                  Benchmarking Timeline
                </div>
                <div style={{ position: "relative", paddingLeft: 24 }}>
                  {[
                    {
                      matches: "0-2",
                      weight: "100%",
                      desc: "Full Benchmark (0.8)",
                    },
                    {
                      matches: "3",
                      weight: "60%/40%",
                      desc: "60% Benchmark + 40% Performance",
                    },
                    {
                      matches: "4",
                      weight: "40%/60%",
                      desc: "40% Benchmark + 60% Performance",
                    },
                    {
                      matches: "5",
                      weight: "20%/80%",
                      desc: "20% Benchmark + 80% Performance",
                    },
                    {
                      matches: "6+",
                      weight: "0%/100%",
                      desc: "Fully Performance-Based",
                    },
                  ].map((stage, idx) => {
                    const isCurrentStage =
                      (teamData.transitionInfo.matchesPlayed <= 2 &&
                        stage.matches === "0-2") ||
                      (teamData.transitionInfo.matchesPlayed === 3 &&
                        stage.matches === "3") ||
                      (teamData.transitionInfo.matchesPlayed === 4 &&
                        stage.matches === "4") ||
                      (teamData.transitionInfo.matchesPlayed === 5 &&
                        stage.matches === "5") ||
                      (teamData.transitionInfo.matchesPlayed >= 6 &&
                        stage.matches === "6+");

                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 12,
                          padding: "8px",
                          background: isCurrentStage
                            ? "#fef3c7"
                            : "transparent",
                          borderRadius: 6,
                          border: isCurrentStage ? "2px solid #f59e0b" : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: isCurrentStage ? "#f59e0b" : "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 12,
                            color: isCurrentStage ? "white" : "#64748b",
                            marginRight: 12,
                            flexShrink: 0,
                          }}
                        >
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: isCurrentStage ? "#92400e" : "#0f172a",
                              fontSize: 13,
                            }}
                          >
                            Matches {stage.matches}: {stage.weight}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: isCurrentStage ? "#78350f" : "#64748b",
                              marginTop: 2,
                            }}
                          >
                            {stage.desc}
                          </div>
                        </div>
                        {isCurrentStage && (
                          <div
                            style={{
                              fontSize: 18,
                              color: "#f59e0b",
                              marginLeft: 8,
                            }}
                          >
                            ◀
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* OSI Evolution Flow Diagram */}
          {teamData.matchStatistics?.overall?.totalMatches > 0 && (
            <OSIEvolutionDiagram
              teamUID={teamData.teamUID || inputId}
              teamName={teamData.teamName}
              currentOSI={teamData.OSI}
              totalMatches={teamData.matchStatistics.overall.totalMatches}
            />
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

      {/* Global Leaderboard Mode - All Teams Across All Tournaments */}
      {mode === "global" && globalLeaderboardData && (
        <div>
          {/* Global Leaderboard Info Card */}
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
              🌍 Global OSI Leaderboard
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
                <strong>Total Teams:</strong> {globalLeaderboardData.totalTeams}
              </div>
              <div>
                <strong>Scope:</strong> All tournaments
              </div>
            </div>

            {/* Tier Distribution Summary */}
            {globalLeaderboardData.tierDistribution && (
              <div
                style={{
                  marginTop: 16,
                  padding: "16px",
                  background: "#f8fafc",
                  borderRadius: 8,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: 12,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, color: "#eab308" }}>👑</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Elite (1.5)
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}
                  >
                    {globalLeaderboardData.tierDistribution.elite || 0}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, color: "#3b82f6" }}>⭐</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Strong (1.0)
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}
                  >
                    {globalLeaderboardData.tierDistribution.strong || 0}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, color: "#64748b" }}>▪️</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Average (0.8)
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}
                  >
                    {globalLeaderboardData.tierDistribution.average || 0}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, color: "#f97316" }}>📉</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Below Avg (0.5)
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}
                  >
                    {globalLeaderboardData.tierDistribution.belowAverage || 0}
                  </div>
                </div>
              </div>
            )}

            {/* Explanation Panel */}
            <div
              style={{
                marginTop: 16,
                padding: "16px",
                background: "#eff6ff",
                borderRadius: 8,
                border: "1px solid #bfdbfe",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  color: "#1e40af",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                📌 Global Leaderboard Explanation
              </div>
              <div style={{ fontSize: 13, color: "#1e3a8a", lineHeight: 1.6 }}>
                This leaderboard ranks{" "}
                <strong>all teams across all tournaments</strong> based on their
                raw OSI Points. The OSI Score (1.5, 1.0, 0.8, 0.5) is determined
                by percentile distribution across the entire ecosystem, making
                teams from different tournaments directly comparable.
                <br />
                <br />
                <strong>OSI Score Assignment:</strong>
                <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
                  <li>
                    <strong>1.5 (Elite):</strong> Top 12.5% performers globally
                  </li>
                  <li>
                    <strong>1.0 (Strong):</strong> 25th-37.5th percentile
                  </li>
                  <li>
                    <strong>0.8 (Average):</strong> 37.5th-62.5th percentile
                  </li>
                  <li>
                    <strong>0.5 (Below Average):</strong> Bottom 37.5%
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Global Leaderboard Table */}
          <div
            style={{
              background: "white",
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
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
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Rank
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Team
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      OSI Points
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      OSI Score
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Batting
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Bowling
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Fielding
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Current OSI
                    </th>
                    <th
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        fontWeight: 700,
                        color: "#475569",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Matches
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {globalLeaderboardData.leaderboard &&
                  globalLeaderboardData.leaderboard.length > 0 ? (
                    globalLeaderboardData.leaderboard.map((team, index) => {
                      const { osiScore, percentileTier } = team;

                      // Tier colors
                      let tierColor = "#64748b";
                      let tierBg = "white";
                      let tierLabel = "Average";
                      let tierEmoji = "";

                      if (osiScore === 1.5) {
                        tierColor = "#eab308";
                        tierBg = "#fef9c3";
                        tierLabel = "Elite";
                        tierEmoji = "👑";
                      } else if (osiScore === 1.0) {
                        tierColor = "#3b82f6";
                        tierBg = "#dbeafe";
                        tierLabel = "Strong";
                        tierEmoji = "⭐";
                      } else if (osiScore === 0.8) {
                        tierColor = "#64748b";
                        tierBg = "white";
                        tierLabel = "Average";
                        tierEmoji = "";
                      } else if (osiScore === 0.5) {
                        tierColor = "#f97316";
                        tierBg = "#ffedd5";
                        tierLabel = "Below Avg";
                        tierEmoji = "📉";
                      }

                      // Medal for top 3
                      let medal = "";
                      if (index === 0) medal = "🥇";
                      else if (index === 1) medal = "🥈";
                      else if (index === 2) medal = "🥉";

                      return (
                        <tr
                          key={team.teamUID || team.teamId}
                          style={{
                            background: tierBg,
                            borderBottom: "1px solid #e2e8f0",
                          }}
                        >
                          <td
                            style={{
                              padding: "16px",
                              fontWeight: 700,
                              color: "#0f172a",
                              fontSize: 16,
                            }}
                          >
                            {medal} {index + 1}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <div style={{ fontWeight: 600, color: "#0f172a" }}>
                              {team.teamName}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                                marginTop: 2,
                              }}
                            >
                              {team.teamUID || team.teamId}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "16px",
                              textAlign: "center",
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {team.osiRawPoints?.toFixed(2) || "0.00"}
                          </td>
                          <td style={{ padding: "16px", textAlign: "center" }}>
                            <div
                              style={{
                                display: "inline-block",
                                padding: "6px 12px",
                                background: tierBg,
                                border: `2px solid ${tierColor}`,
                                borderRadius: 8,
                                fontWeight: 700,
                                color: tierColor,
                                fontSize: 14,
                              }}
                            >
                              {tierEmoji} {osiScore}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: tierColor,
                                marginTop: 4,
                                fontWeight: 600,
                              }}
                            >
                              {tierLabel}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "16px",
                              textAlign: "center",
                              color: "#059669",
                              fontWeight: 600,
                            }}
                          >
                            {team.battingStrength?.toFixed(2) || "0.00"}
                          </td>
                          <td
                            style={{
                              padding: "16px",
                              textAlign: "center",
                              color: "#dc2626",
                              fontWeight: 600,
                            }}
                          >
                            {team.bowlingStrength?.toFixed(2) || "0.00"}
                          </td>
                          <td
                            style={{
                              padding: "16px",
                              textAlign: "center",
                              color: "#7c3aed",
                              fontWeight: 600,
                            }}
                          >
                            {team.fieldingStrength?.toFixed(2) || "0.00"}
                          </td>
                          <td
                            style={{
                              padding: "16px",
                              textAlign: "center",
                              fontWeight: 700,
                              color: "#0f172a",
                              fontSize: 15,
                            }}
                          >
                            {team.currentOSI?.toFixed(2) || "0.00"}
                          </td>
                          <td
                            style={{
                              padding: "16px",
                              textAlign: "center",
                              color: "#64748b",
                            }}
                          >
                            {team.matchesPlayed || 0}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        style={{
                          padding: "48px",
                          textAlign: "center",
                          color: "#64748b",
                        }}
                      >
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                        <div>No teams found in the database</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      {!teamData && !tournamentData && !globalLeaderboardData && !loading && (
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
              : mode === "tournament"
                ? "Enter a Tournament UID to compare all teams"
                : "Loading global leaderboard..."}
          </h3>
          <p style={{ marginTop: 12, color: "#64748b", fontSize: 14 }}>
            {mode === "team"
              ? "OSI shows individual team strength based on batting, bowling, and fielding performance"
              : mode === "tournament"
                ? "Compare all teams in a tournament with their OSI scores, rankings, and team points"
                : "View the global ranking of all teams across all tournaments"}
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
