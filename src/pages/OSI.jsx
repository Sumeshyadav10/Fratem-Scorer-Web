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

export default function OSI() {
  const [teamId, setTeamId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const fetchOSI = async () => {
    setError("");
    setResult(null);
    if (!teamId) return setError("Enter team UID or ID");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}/osi`);
      const data = await res.json();
      if (!data.success) {
        setError(data.message || "Failed to fetch OSI");
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
    a.download = `${result.teamUID || "team"}-osi.json`;
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
        <h2 style={{ margin: 0 }}>Opposition Strength Index (OSI)</h2>
        <div>
          <input
            placeholder="Team UID or MongoID"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            style={{
              padding: "8px 10px",
              width: 280,
              border: "1px solid #ddd",
              borderRadius: 6,
            }}
          />
          <button
            onClick={fetchOSI}
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
            {loading ? "Loading..." : "Get OSI"}
          </button>
        </div>
      </div>

      {error && <div style={{ color: "#b91c1c", marginTop: 12 }}>{error}</div>}

      {result && (
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
                <div style={{ color: "#666", fontSize: 13 }}>Team</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {result.teamName || result.teamUID}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#666", fontSize: 12 }}>OSI</div>
                <div
                  style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}
                >
                  {result.OSI?.toFixed ? result.OSI.toFixed(2) : result.OSI}
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
                  label="Top 7 Runs"
                  value={result.components?.batting?.breakdown?.top7Runs ?? "-"}
                />
                <MetricRow
                  label="Top 7 Outs"
                  value={result.components?.batting?.breakdown?.top7Outs ?? "-"}
                />
                <MetricRow
                  label="Avg"
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
                  label="Top Batters"
                  value={
                    result.components?.batting?.breakdown?.topBattersCount ??
                    "-"
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
                  label="Top 5 Wickets"
                  value={
                    result.components?.bowling?.breakdown?.top5Wickets ?? "-"
                  }
                />
                <MetricRow
                  label="Runs Conceded"
                  value={
                    result.components?.bowling?.breakdown?.top5RunsConceded ??
                    "-"
                  }
                />
                <MetricRow
                  label="Avg"
                  value={
                    result.components?.bowling?.breakdown?.bowlingAvg ?? "-"
                  }
                />
                <MetricRow
                  label="Economy"
                  value={
                    result.components?.bowling?.breakdown?.bowlingEco ?? "-"
                  }
                />
                <MetricRow
                  label="Strike Rate"
                  value={
                    result.components?.bowling?.breakdown?.bowlingSR ?? "-"
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
                  label="Total Catches"
                  value={
                    result.components?.fielding?.breakdown?.totalCatches ?? "-"
                  }
                />
                <MetricRow
                  label="Total Run-outs"
                  value={
                    result.components?.fielding?.breakdown?.totalRunOuts ?? "-"
                  }
                />
                <MetricRow
                  label="Total Stumpings"
                  value={
                    result.components?.fielding?.breakdown?.totalStumpings ??
                    "-"
                  }
                />
                <MetricRow
                  label="Raw Score"
                  value={
                    result.components?.fielding?.breakdown?.rawFieldingScore ??
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
