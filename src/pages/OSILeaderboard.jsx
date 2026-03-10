import { useState, useEffect } from "react";

const OSILeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scope, setScope] = useState("global"); // "global" or "tournament"
  const [tournamentId, setTournamentId] = useState("");

  useEffect(() => {
    fetchLeaderboard();
  }, [scope, tournamentId]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const endpoint =
        scope === "global"
          ? `http://localhost:4000/api/osi-analysis/leaderboard/global`
          : `http://localhost:4000/api/osi-analysis/tournament/${tournamentId}/leaderboard`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setLeaderboardData(data);
        setError(null);
      } else {
        setError(data.message || "Failed to load leaderboard");
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (osiScore) => {
    if (osiScore === 1.5) return "#fef08a"; // Yellow for Elite
    if (osiScore === 1.0) return "#bfdbfe"; // Blue for Strong
    if (osiScore === 0.8) return "#fff"; // White for Average
    return "#fed7aa"; // Orange for Below Average
  };

  const getTierBadgeStyle = (tierName) => {
    const styles = {
      Elite: { bg: "#fef08a", text: "#854d0e", border: "#fbbf24" },
      Strong: { bg: "#bfdbfe", text: "#1e40af", border: "#60a5fa" },
      Average: { bg: "#e5e7eb", text: "#374151", border: "#9ca3af" },
      "Below Average": { bg: "#fed7aa", text: "#9a3412", border: "#fb923c" },
    };
    return styles[tierName] || styles.Average;
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 50,
              height: 50,
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #3b82f6",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          ></div>
          <p style={{ color: "#6b7280", fontSize: 14 }}>
            Loading leaderboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          padding: 20,
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: 20,
            maxWidth: 500,
          }}
        >
          <h3 style={{ color: "#991b1b", margin: "0 0 8px" }}>
            Error Loading Leaderboard
          </h3>
          <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!leaderboardData) return null;

  const {
    tournament,
    totalTeams,
    tierDistribution,
    osiScoreScale,
    leaderboard,
  } = leaderboardData;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "40px 20px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}
      </style>

      {/* Header */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 32px",
          animation: "slideUp 0.5s ease-out",
        }}
      >
        <h1
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: "#fff",
            textAlign: "center",
            margin: "0 0 8px",
            textShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          🏆{" "}
          {scope === "global"
            ? "Global OSI Leaderboard"
            : "Tournament OSI Leaderboard"}
        </h1>

        {/* Scope Toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            marginTop: 20,
          }}
        >
          <button
            onClick={() => setScope("global")}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background: scope === "global" ? "#fff" : "rgba(255,255,255,0.3)",
              color: scope === "global" ? "#667eea" : "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            🌍 Global Leaderboard
          </button>
          <button
            onClick={() => setScope("tournament")}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              background:
                scope === "tournament" ? "#fff" : "rgba(255,255,255,0.3)",
              color: scope === "tournament" ? "#667eea" : "#fff",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            🏟️ Tournament View
          </button>
        </div>

        {/* Tournament ID Input (only show when tournament scope selected) */}
        {scope === "tournament" && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              marginTop: 12,
            }}
          >
            <input
              type="text"
              placeholder="Enter Tournament ID (e.g., FRAT267827)"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                width: 300,
                fontSize: 14,
              }}
            />
            <button
              onClick={fetchLeaderboard}
              style={{
                padding: "8px 20px",
                borderRadius: 6,
                border: "none",
                background: "#fff",
                color: "#667eea",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Load
            </button>
          </div>
        )}

        {tournament && (
          <>
            <p
              style={{
                fontSize: 18,
                color: "#e0e7ff",
                textAlign: "center",
                margin: "12px 0 0",
              }}
            >
              {tournament.tournamentName}
            </p>
            <p
              style={{
                fontSize: 14,
                color: "#c7d2fe",
                textAlign: "center",
                margin: "4px 0 0",
              }}
            >
              Tournament ID: {tournament.tournamentUID}
            </p>
          </>
        )}
      </div>

      {/* Stats Cards */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto 32px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
          animation: "slideUp 0.6s ease-out",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
            Total Teams
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#1f2937" }}>
            {totalTeams}
          </div>
        </div>

        {tierDistribution && (
          <>
            <div
              style={{
                background: "#fef08a",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: 14, color: "#854d0e", marginBottom: 8 }}>
                Elite Tier
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#713f12" }}>
                {tierDistribution.elite}
              </div>
            </div>

            <div
              style={{
                background: "#bfdbfe",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: 14, color: "#1e40af", marginBottom: 8 }}>
                Strong Tier
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#1e3a8a" }}>
                {tierDistribution.strong}
              </div>
            </div>

            <div
              style={{
                background: "#fed7aa",
                borderRadius: 12,
                padding: 20,
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ fontSize: 14, color: "#9a3412", marginBottom: 8 }}>
                Below Average
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#7c2d12" }}>
                {tierDistribution.belowAverage}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Leaderboard Table */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          animation: "slideUp 0.7s ease-out",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            overflow: "hidden",
          }}
        >
          {/* Table Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "80px 60px 1fr 120px 120px 100px 100px 100px 120px",
              gap: 12,
              padding: "16px 20px",
              background: "#f9fafb",
              borderBottom: "2px solid #e5e7eb",
              fontWeight: 600,
              fontSize: 13,
              color: "#374151",
            }}
          >
            <div>Rank</div>
            <div></div>
            <div>Team</div>
            <div style={{ textAlign: "center" }}>OSI Points</div>
            <div style={{ textAlign: "center" }}>OSI Score</div>
            <div style={{ textAlign: "center" }}>Batting</div>
            <div style={{ textAlign: "center" }}>Bowling</div>
            <div style={{ textAlign: "center" }}>Fielding</div>
            <div style={{ textAlign: "center" }}>Matches</div>
          </div>

          {/* Table Body */}
          {leaderboard.map((team, index) => {
            const tierStyle = getTierBadgeStyle(team.percentileTier);
            return (
              <div
                key={team.teamId}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "80px 60px 1fr 120px 120px 100px 100px 100px 120px",
                  gap: 12,
                  padding: "16px 20px",
                  background: getTierColor(team.osiScore),
                  borderBottom:
                    index < leaderboard.length - 1
                      ? "1px solid #e5e7eb"
                      : "none",
                  alignItems: "center",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.01)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Rank */}
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: team.rank <= 3 ? "#f59e0b" : "#6b7280",
                  }}
                >
                  {team.rank === 1
                    ? "🥇"
                    : team.rank === 2
                      ? "🥈"
                      : team.rank === 3
                        ? "🥉"
                        : `#${team.rank}`}
                </div>

                {/* Trophy/Medal */}
                <div style={{ fontSize: 28 }}>
                  {team.osiScore === 1.5 && "👑"}
                </div>

                {/* Team Name */}
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#1f2937",
                      marginBottom: 4,
                    }}
                  >
                    {team.teamName}
                  </div>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: tierStyle.bg,
                      color: tierStyle.text,
                      border: `1px solid ${tierStyle.border}`,
                    }}
                  >
                    {team.percentileTier}
                  </div>
                </div>

                {/* OSI Points */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  {team.osiRawPoints.toFixed(2)}
                </div>

                {/* OSI Score */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    color:
                      team.osiScore === 1.5
                        ? "#854d0e"
                        : team.osiScore === 1.0
                          ? "#1e40af"
                          : team.osiScore === 0.8
                            ? "#374151"
                            : "#9a3412",
                  }}
                >
                  {team.currentOSI.toFixed(2)}
                </div>

                {/* Batting Strength */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    color: "#374151",
                  }}
                >
                  {team.battingStrength.toFixed(2)}
                </div>

                {/* Bowling Strength */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    color: "#374151",
                  }}
                >
                  {team.bowlingStrength.toFixed(2)}
                </div>

                {/* Fielding Strength */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    color: "#374151",
                  }}
                >
                  {team.fieldingStrength.toFixed(2)}
                </div>

                {/* Matches Played */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#6b7280",
                  }}
                >
                  {team.matchesPlayed}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: "rgba(255,255,255,0.95)",
            borderRadius: 12,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#1f2937",
              margin: "0 0 12px",
            }}
          >
            OSI Score Distribution{" "}
            {scope === "global"
              ? "(Global Percentile)"
              : "(Tournament Percentile)"}
          </h3>
          {osiScoreScale && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              {Object.entries(osiScoreScale).map(([score, description]) => (
                <div
                  key={score}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      background: getTierColor(parseFloat(score)),
                      border: "2px solid #e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#1f2937",
                    }}
                  >
                    {score}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1f2937",
                      }}
                    >
                      {description.split(" (")[0]}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6b7280",
                      }}
                    >
                      {description.match(/\((.*?)\)/)?.[1] || ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explanation Panel */}
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: "rgba(255,255,255,0.9)",
            borderRadius: 12,
            border: "2px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
            <strong>ℹ️ How OSI Works:</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20 }}>
              <li>
                <strong>OSI Points</strong>: Absolute performance score (Batting
                + Bowling + Fielding strengths)
              </li>
              <li>
                <strong>OSI Score</strong>:{" "}
                {scope === "global"
                  ? "Global percentile tier for matchmaking (1.5 = top 12.5% globally)"
                  : "Tournament percentile tier (1.5 = top 12.5% in this tournament)"}
              </li>
              <li>
                <strong>Current OSI</strong>: Average of the three strength
                components (0.5-1.5 range)
              </li>
            </ul>
            <div
              style={{
                marginTop: 12,
                padding: 10,
                background: "#fef3c7",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              💡 <strong>Note:</strong>{" "}
              {scope === "global"
                ? "Global leaderboard compares ALL teams across all tournaments. A team's rank here reflects their absolute skill level."
                : "Tournament leaderboard only compares teams within this specific tournament. Use global view for cross-tournament comparison."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OSILeaderboard;
