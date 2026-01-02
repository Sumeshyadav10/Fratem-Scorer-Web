import React, { useState } from "react";
import API_BASE_URL from "../config/api";

function clamp100(v) {
  if (v == null || Number.isNaN(Number(v))) return 0;
  return Math.max(0, Math.min(100, Math.round(Number(v) * 100) / 100));
}

function MetricRow({ label, value, suffix }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <div style={{ color: "#475569" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>
        {value}
        {suffix || ""}
      </div>
    </div>
  );
}

export default function SDI() {
  const [playerId, setPlayerId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [expandedTournaments, setExpandedTournaments] = useState(new Set());

  const toggleTournament = (tournamentId) => {
    const newExpanded = new Set(expandedTournaments);
    if (newExpanded.has(tournamentId)) {
      newExpanded.delete(tournamentId);
    } else {
      newExpanded.add(tournamentId);
    }
    setExpandedTournaments(newExpanded);
  };

  const fetchSDI = async () => {
    setError("");
    setResult(null);
    if (!playerId) return setError("Enter player UID or ID");
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/player-points/player/${playerId}/sdi`
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

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard?.writeText(JSON.stringify(result, null, 2));
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.playerId || "player"}-sdi.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "Inter, Arial, sans-serif",
        color: "#222",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Skill Development Index (SDI)</h2>
        <div>
          <input
            placeholder="Player UID or MongoID"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            style={{
              padding: "8px 10px",
              width: 280,
              border: "1px solid #ddd",
              borderRadius: 6,
            }}
          />
          <button
            onClick={fetchSDI}
            disabled={loading}
            style={{
              marginLeft: 8,
              padding: "8px 12px",
              borderRadius: 6,
              border: "none",
              background: "#2563eb",
              color: "white",
            }}
          >
            {loading ? "Loading..." : "Get SDI"}
          </button>
        </div>
      </div>

      {error && <div style={{ color: "#b91c1c", marginTop: 12 }}>{error}</div>}

      {result && result.tournaments && (
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              background: "white",
              borderRadius: 10,
              padding: 16,
              boxShadow: "0 6px 18px rgba(20,20,40,0.06)",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#666", fontSize: 13 }}>Player</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {result.playerName || result.playerId}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#666", fontSize: 12 }}>
                  Total Tournaments
                </div>
                <div
                  style={{ fontSize: 24, fontWeight: 800, color: "#2563eb" }}
                >
                  {result.totalTournaments}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button
                onClick={handleCopy}
                style={{
                  marginRight: 8,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #e6edf8",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                📋 Copy JSON
              </button>
              <button
                onClick={handleDownload}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #e6edf8",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                💾 Download
              </button>
            </div>
          </div>

          {/* Tournament List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {result.tournaments.map((tournament, idx) => {
              const isExpanded = expandedTournaments.has(
                tournament.tournamentId
              );
              return (
                <div
                  key={tournament.tournamentId || idx}
                  style={{
                    background: "white",
                    borderRadius: 10,
                    boxShadow: "0 6px 18px rgba(20,20,40,0.06)",
                    overflow: "hidden",
                  }}
                >
                  {/* Tournament Header */}
                  <div
                    onClick={() => toggleTournament(tournament.tournamentId)}
                    style={{
                      padding: 16,
                      cursor: "pointer",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>
                        {tournament.tournamentName}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          opacity: 0.85,
                          marginTop: 4,
                          display: "flex",
                          gap: 12,
                          flexWrap: "wrap",
                        }}
                      >
                        {tournament.tournamentUID && (
                          <span>🏆 UID: {tournament.tournamentUID}</span>
                        )}
                        <span>
                          🆔 {tournament.tournamentId?.substring(0, 8)}...
                        </span>
                        <span>📊 {tournament.matchesPlayed} matches</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        Tournament SDI
                      </div>
                      <div style={{ fontSize: 28, fontWeight: 800 }}>
                        {tournament.SDI}
                      </div>
                    </div>
                    <div style={{ marginLeft: 16, fontSize: 20 }}>
                      {isExpanded ? "▼" : "▶"}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div style={{ padding: 16 }}>
                      {/* Components Summary */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 12,
                          marginBottom: 16,
                        }}
                      >
                        {/* Batting */}
                        <div
                          style={{
                            background: "#eff6ff",
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#1e40af",
                              fontWeight: 600,
                            }}
                          >
                            🏏 Batting
                          </div>
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 800,
                              color: "#1e3a8a",
                            }}
                          >
                            {tournament.components?.batting?.battingScore || 0}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#475569",
                              marginTop: 4,
                            }}
                          >
                            Avg:{" "}
                            {tournament.components?.batting?.breakdown
                              ?.battingAvg || 0}{" "}
                            | SR:{" "}
                            {tournament.components?.batting?.breakdown
                              ?.battingSR || 0}
                          </div>
                        </div>

                        {/* Bowling */}
                        <div
                          style={{
                            background: "#f0fdf4",
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#15803d",
                              fontWeight: 600,
                            }}
                          >
                            ⚡ Bowling
                          </div>
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 800,
                              color: "#14532d",
                            }}
                          >
                            {tournament.components?.bowling?.bowlingScore || 0}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#475569",
                              marginTop: 4,
                            }}
                          >
                            Avg:{" "}
                            {tournament.components?.bowling?.breakdown
                              ?.bowlingAvg || 0}{" "}
                            | Eco:{" "}
                            {tournament.components?.bowling?.breakdown
                              ?.bowlingEco || 0}
                          </div>
                        </div>

                        {/* Fielding */}
                        <div
                          style={{
                            background: "#fef2f2",
                            borderRadius: 8,
                            padding: 12,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 12,
                              color: "#b91c1c",
                              fontWeight: 600,
                            }}
                          >
                            🧤 Fielding
                          </div>
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 800,
                              color: "#7f1d1d",
                            }}
                          >
                            {tournament.components?.fielding?.fieldingScore ||
                              0}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#475569",
                              marginTop: 4,
                            }}
                          >
                            Catches:{" "}
                            {tournament.components?.fielding?.breakdown
                              ?.totalCatches || 0}
                          </div>
                        </div>
                      </div>

                      {/* Match-wise Breakdown */}
                      {tournament.matchWiseBreakdown &&
                        tournament.matchWiseBreakdown.length > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                marginBottom: 10,
                                color: "#0f172a",
                              }}
                            >
                              📊 Match-wise SDI Breakdown
                            </div>
                            <div
                              style={{
                                background: "#f8fafc",
                                borderRadius: 8,
                                padding: 12,
                              }}
                            >
                              {/* Table Header */}
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns:
                                    "60px 1fr 100px 80px 80px 60px 60px 60px 100px",
                                  gap: 8,
                                  padding: "8px 12px",
                                  background: "#e2e8f0",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#475569",
                                }}
                              >
                                <div>Match</div>
                                <div>Teams</div>
                                <div>Date</div>
                                <div>Runs(Balls)</div>
                                <div>Wickets</div>
                                <div>Catch</div>
                                <div>R/O</div>
                                <div>Stump</div>
                                <div style={{ textAlign: "right" }}>SDI</div>
                              </div>

                              {/* Table Rows */}
                              {tournament.matchWiseBreakdown.map(
                                (match, mIdx) => (
                                  <div
                                    key={match.matchId || mIdx}
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        "60px 1fr 100px 80px 80px 60px 60px 60px 100px",
                                      gap: 8,
                                      padding: "10px 12px",
                                      borderBottom:
                                        mIdx <
                                        tournament.matchWiseBreakdown.length - 1
                                          ? "1px solid #e2e8f0"
                                          : "none",
                                      fontSize: 13,
                                      color: "#1e293b",
                                    }}
                                  >
                                    <div style={{ fontWeight: 600 }}>
                                      {match.matchNumber}
                                    </div>
                                    <div style={{ fontSize: 12 }}>
                                      {match.teams}
                                    </div>
                                    <div
                                      style={{ fontSize: 11, color: "#64748b" }}
                                    >
                                      {match.date
                                        ? new Date(
                                            match.date
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : "-"}
                                    </div>
                                    <div>
                                      <span style={{ fontWeight: 700 }}>
                                        {match.runs}
                                      </span>
                                      {match.balls > 0 && (
                                        <span
                                          style={{
                                            fontSize: 11,
                                            color: "#64748b",
                                          }}
                                        >
                                          ({match.balls})
                                        </span>
                                      )}
                                    </div>
                                    <div>{match.wickets}</div>
                                    <div>{match.catches}</div>
                                    <div>{match.runOuts || 0}</div>
                                    <div>{match.stumpings || 0}</div>
                                    <div
                                      style={{
                                        textAlign: "right",
                                        fontWeight: 800,
                                        fontSize: 15,
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
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result && !result.tournaments && (
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 18,
          }}
        >
          {/* Left: summary card */}
          <div
            style={{
              background: "white",
              borderRadius: 10,
              padding: 16,
              boxShadow: "0 6px 18px rgba(20,20,40,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#666", fontSize: 13 }}>Player</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {result.playerName || result.playerId}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#666", fontSize: 12 }}>SDI</div>
                <div
                  style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}
                >
                  {result.SDI?.toFixed ? result.SDI.toFixed(2) : result.SDI}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                onClick={handleCopy}
                style={{
                  marginRight: 8,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #e6edf8",
                  background: "white",
                }}
              >
                Copy JSON
              </button>
              <button
                onClick={handleDownload}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #e6edf8",
                  background: "white",
                }}
              >
                Download
              </button>
            </div>

            <div style={{ marginTop: 12, color: "#444" }}>
              <div style={{ fontSize: 13, color: "#666" }}>Quick Breakdown</div>
              <div style={{ marginTop: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#666" }}>Batting</div>
                    <div
                      style={{
                        height: 10,
                        background: "#eef2ff",
                        borderRadius: 6,
                        overflow: "hidden",
                        marginTop: 6,
                      }}
                    >
                      <div
                        style={{
                          width: `${clamp100(
                            result.components?.batting?.battingScore || 0
                          )}%`,
                          height: "100%",
                          background: "linear-gradient(90deg,#60a5fa,#2563eb)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#666" }}>Bowling</div>
                    <div
                      style={{
                        height: 10,
                        background: "#f1f5f9",
                        borderRadius: 6,
                        overflow: "hidden",
                        marginTop: 6,
                      }}
                    >
                      <div
                        style={{
                          width: `${clamp100(
                            result.components?.bowling?.bowlingScore || 0
                          )}%`,
                          height: "100%",
                          background: "linear-gradient(90deg,#34d399,#059669)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#666" }}>Fielding</div>
                    <div
                      style={{
                        height: 10,
                        background: "#f8fafc",
                        borderRadius: 6,
                        overflow: "hidden",
                        marginTop: 6,
                      }}
                    >
                      <div
                        style={{
                          width: `${clamp100(
                            result.components?.fielding?.fieldingScore || 0
                          )}%`,
                          height: "100%",
                          background: "linear-gradient(90deg,#f472b6,#e11d48)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: detailed components */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
            }}
          >
            {/* Batting Card */}
            <div
              style={{
                background: "white",
                borderRadius: 10,
                padding: 14,
                boxShadow: "0 6px 18px rgba(20,20,40,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 700 }}>Batting</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {(result.components?.batting?.battingScore ?? 0).toFixed
                    ? result.components.batting.battingScore.toFixed(2)
                    : result.components?.batting?.battingScore}
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <MetricRow
                  label="Average"
                  value={
                    result.components?.batting?.breakdown?.battingAvg ?? "-"
                  }
                />
                <MetricRow
                  label="Strike Rate"
                  value={
                    result.components?.batting?.breakdown?.battingSR ?? "-"
                  }
                />
                <MetricRow
                  label="Boundary%"
                  value={
                    result.components?.batting?.breakdown?.BE
                      ? `${Number(
                          result.components.batting.breakdown.BE
                        ).toFixed(1)}%`
                      : "-"
                  }
                />
                <MetricRow
                  label="Consistency(CI)"
                  value={
                    result.components?.batting?.breakdown?.CI_raw
                      ? Number(
                          result.components.batting.breakdown.CI_raw
                        ).toFixed(3)
                      : "-"
                  }
                />
                <MetricRow
                  label="Chase Eff.(CE)"
                  value={
                    result.components?.batting?.breakdown?.CE
                      ? Number(result.components.batting.breakdown.CE).toFixed(
                          2
                        )
                      : "-"
                  }
                />
              </div>
            </div>

            {/* Bowling Card */}
            <div
              style={{
                background: "white",
                borderRadius: 10,
                padding: 14,
                boxShadow: "0 6px 18px rgba(20,20,40,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 700 }}>Bowling</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {(result.components?.bowling?.bowlingScore ?? 0).toFixed
                    ? result.components.bowling.bowlingScore.toFixed(2)
                    : result.components?.bowling?.bowlingScore}
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <MetricRow
                  label="Average"
                  value={
                    result.components?.bowling?.breakdown?.bowlingAvg ?? "-"
                  }
                />
                <MetricRow
                  label="Economy"
                  value={
                    result.components?.bowling?.breakdown?.bowlingeco ??
                    result.components?.bowling?.breakdown?.bowlingEco ??
                    "-"
                  }
                />
                <MetricRow
                  label="Strike Rate"
                  value={
                    result.components?.bowling?.breakdown?.bowlingSR ?? "-"
                  }
                />
                <MetricRow
                  label="Dot%"
                  value={
                    result.components?.bowling?.breakdown?.dotBallPct
                      ? `${Number(
                          result.components.bowling.breakdown.dotBallPct
                        ).toFixed(1)}%`
                      : "-"
                  }
                />
                <MetricRow
                  label="PHI"
                  value={
                    result.components?.bowling?.breakdown?.PHI
                      ? Number(
                          result.components.bowling.breakdown.PHI
                        ).toExponential(2)
                      : "-"
                  }
                />
              </div>
            </div>

            {/* Fielding Card */}
            <div
              style={{
                background: "white",
                borderRadius: 10,
                padding: 14,
                boxShadow: "0 6px 18px rgba(20,20,40,0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ fontWeight: 700 }}>Fielding</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {(result.components?.fielding?.fieldingScore ?? 0).toFixed
                    ? result.components.fielding.fieldingScore.toFixed(2)
                    : result.components?.fielding?.fieldingScore}
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <MetricRow
                  label="Catches / match"
                  value={
                    result.components?.fielding?.breakdown?.catchesPerMatch ??
                    "-"
                  }
                />
                <MetricRow
                  label="Run-outs / match"
                  value={
                    result.components?.fielding?.breakdown?.runOutsPerMatch ??
                    "-"
                  }
                />
                <MetricRow
                  label="Stumpings / match"
                  value={
                    result.components?.fielding?.breakdown?.stumpingsPerMatch ??
                    "-"
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
