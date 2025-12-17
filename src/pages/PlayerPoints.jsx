import React, { useState, useEffect } from "react";
import "./PlayerPoints.css";
import API_BASE_URL from "../config/api";

function PlayerPoints({ matchId: propMatchId, token }) {
  const [matchId, setMatchId] = useState(propMatchId || "");
  const [pointsData, setPointsData] = useState(null);
  const [previewData, setPreviewData] = useState(null); // NEW: Preview data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [pushing, setPushing] = useState(false); // NEW: Push state
  const [activeTab, setActiveTab] = useState("overview"); // overview, team1, team2, performers
  const [selectedToken, setSelectedToken] = useState("organizer");
  const [workflowStep, setWorkflowStep] = useState(null); // NEW: Track workflow step

  // Fresh tokens (expires Nov 12, 2025)
  const organizerToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGUxMTRkYWFkNzU3OTlkNTdkMThiMGUiLCJ1c2VyVHlwZSI6Im9yZ2FuaXplciIsImlhdCI6MTc2MjMyOTEyOSwiZXhwIjoxNzYyOTMzOTI5fQ.muY4WfecXeNnjR3R7CNwwyfwE0OJilgm6mAaeAyy64A";
  const playerToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGYwYmE2MTYyZmM5NzkxOGMyZGQ5ODYiLCJ1c2VyVHlwZSI6InBsYXllciIsImlhdCI6MTc2MjMyOTEyOSwiZXhwIjoxNzYyOTMzOTI5fQ.jDZspQPmhvL7F0Dljz8w6Pv4nCjsjrrq2nCtvXEQSdU";

  function getToken() {
    return (
      token || (selectedToken === "organizer" ? organizerToken : playerToken)
    );
  }

  useEffect(() => {
    if (propMatchId) {
      setMatchId(propMatchId);
      fetchMatchPoints(propMatchId);
    }
  }, [propMatchId, token]);

  const fetchMatchPoints = async (id = matchId) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/player-points/match/${id}`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );
      const data = await response.json();

      if (data.success) {
        setPointsData(data.data);
      } else {
        // If points not calculated yet, try calculating
        if (response.status === 404) {
          setError(
            'Points not calculated yet. Click "Calculate Points" button.'
          );
        } else {
          setError(data.message || "Failed to fetch points");
        }
      }
    } catch (err) {
      setError("Error fetching points: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePoints = async () => {
    if (!matchId) return;

    setCalculating(true);
    setError(null);
    setPreviewData(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/player-points/match/${matchId}/calculate?force=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ Points calculated (STEP 1 - Preview):", data);

        setWorkflowStep("preview");
        setPreviewData(data.data);

        alert(
          `✅ Points calculated for ${
            data.meta?.totalPlayers || data.data.length
          } players!\n\n` +
            `🔍 Click "Preview Points" to review before confirming.`
        );
      } else {
        setError(data.message || "Failed to calculate points");
      }
    } catch (err) {
      setError("Error calculating points: " + err.message);
      console.error("Calculate error:", err);
    } finally {
      setCalculating(false);
    }
  };

  // NEW: Preview calculated points (STEP 2)
  const previewPoints = async () => {
    if (!matchId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/player-points/match/${matchId}/preview`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {
                Authorization: `Bearer ${getToken()}`,
              },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ Preview loaded (STEP 2):", data);

        setWorkflowStep("preview");
        setPreviewData(data.data);

        // Group by teams for display
        const grouped = groupPlayersByTeam(data.data);
        setPointsData({
          match: { matchId, status: "preview" },
          teams: grouped,
          meta: data.meta,
        });
      } else {
        setError(data.message || "Failed to fetch preview");
      }
    } catch (err) {
      setError("Error fetching preview: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Push points to cumulative stats (STEP 3)
  const pushPoints = async () => {
    if (!matchId) return;

    const confirm = window.confirm(
      `🚀 Confirm Push?\n\n` +
        `This will add points to ${
          previewData?.length || 0
        } players' cumulative stats.\n\n` +
        `This action cannot be undone. Continue?`
    );

    if (!confirm) return;

    setPushing(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/player-points/match/${matchId}/push`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : `Bearer ${getToken()}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ Points pushed (STEP 3 - Confirmed):", data);

        setWorkflowStep("pushed");
        setPreviewData(null);

        alert(
          `✅ Successfully pushed points for ${
            data.meta?.totalPushed || 0
          } players!\n\n` +
            `🏆 Top Performer: ${
              data.meta?.topPerformer?.playerName || "N/A"
            } - ` +
            `${data.meta?.topPerformer?.matchPoints?.toFixed(1) || 0} pts`
        );

        // Refresh to show pushed data
        await fetchMatchPoints(matchId);
      } else {
        setError(data.message || "Failed to push points");
      }
    } catch (err) {
      setError("Error pushing points: " + err.message);
      console.error("Push error:", err);
    } finally {
      setPushing(false);
    }
  };

  const groupPlayersByTeam = (players) => {
    if (!players || players.length === 0) {
      return {
        team1: { teamName: "Team 1", totalPoints: 0, players: [] },
        team2: { teamName: "Team 2", totalPoints: 0, players: [] },
      };
    }

    const team1Players = players.filter((p) => p.teamId === players[0]?.teamId);
    const team2Players = players.filter((p) => p.teamId !== players[0]?.teamId);

    return {
      team1: {
        teamName: team1Players[0]?.teamName || "Team 1",
        totalPoints: team1Players.reduce(
          (sum, p) => sum + (p.totalPoints || p.points?.total || 0),
          0
        ),
        players: team1Players,
      },
      team2: {
        teamName: team2Players[0]?.teamName || "Team 2",
        totalPoints: team2Players.reduce(
          (sum, p) => sum + (p.totalPoints || p.points?.total || 0),
          0
        ),
        players: team2Players,
      },
    };
  };

  const openPlayerDetails = async (playerId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/player-points/match/${matchId}/player/${playerId}`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      );
      const data = await response.json();

      if (data.success) {
        setSelectedPlayer(data.data);
      }
    } catch (err) {
      console.error("Error fetching player details:", err);
    }
  };

  const renderPlayerRow = (player) => {
    // Handle both preview and pushed data formats
    const totalPoints = player.totalPoints || player.points?.total || 0;
    const categoryPoints = player.categoryPoints || player.points || {};
    const battingStats = player.battingStats || player.stats?.batting || {};
    const bowlingStats = player.bowlingStats || player.stats?.bowling || {};
    const fieldingStats = player.fieldingStats || player.stats?.fielding || {};

    return (
      <tr
        key={player.playerId}
        onClick={() => openPlayerDetails(player.playerId)}
        className="player-row"
      >
        <td className="player-name">
          <div className="player-name-container">
            <strong>{player.playerName}</strong>
            <div className="player-badges">
              {player.isCaptain && <span className="badge captain">C</span>}
              {player.isWicketKeeper && <span className="badge wk">WK</span>}
            </div>
          </div>
          <div className="player-role">{player.playerRole}</div>
        </td>
        <td className="stat-cell">
          <div className="stat-primary">{battingStats.runs || 0}</div>
          <div className="stat-secondary">
            ({battingStats.ballsFaced || 0}b)
          </div>
        </td>
        <td className="stat-cell">
          <div className="stat-primary">
            {battingStats.fours || 0}×4, {battingStats.sixes || 0}×6
          </div>
          <div className="stat-secondary">
            SR: {(battingStats.strikeRate || 0).toFixed(1)}
          </div>
        </td>
        <td className="stat-cell">
          <div className="stat-primary">{bowlingStats.wickets || 0}W</div>
          <div className="stat-secondary">
            {(bowlingStats.overs || 0).toFixed(1)}ov,{" "}
            {bowlingStats.maidens || 0}M
          </div>
        </td>
        <td className="stat-cell">
          <div className="stat-primary">
            {fieldingStats.catches || 0}C / {fieldingStats.runOuts || 0}RO
          </div>
          {(fieldingStats.stumpings || 0) > 0 && (
            <div className="stat-secondary">{fieldingStats.stumpings}ST</div>
          )}
        </td>
        <td className="points-cell batting">
          <strong>
            {(
              categoryPoints.battingPoints ||
              categoryPoints.batting ||
              0
            ).toFixed(1)}
          </strong>
        </td>
        <td className="points-cell bowling">
          <strong>
            {(
              categoryPoints.bowlingPoints ||
              categoryPoints.bowling ||
              0
            ).toFixed(1)}
          </strong>
        </td>
        <td className="points-cell fielding">
          <strong>
            {(
              (categoryPoints.fieldingPoints || categoryPoints.fielding || 0) +
              (categoryPoints.wicketKeepingPoints ||
                categoryPoints.wicketKeeping ||
                0)
            ).toFixed(1)}
          </strong>
        </td>
        <td className="total-points">
          <div className="total-points-value">{totalPoints.toFixed(1)}</div>
          <div className="points-label">PTS</div>
        </td>
      </tr>
    );
  };

  const renderTeamTable = (team) => (
    <div className="team-section">
      <div className="team-header">
        <h3>{team.teamName}</h3>
        <div className="team-total">
          Total Points: <span>{team.totalPoints.toFixed(1)}</span>
        </div>
      </div>

      <div className="table-container">
        <table className="points-table">
          <thead>
            <tr>
              <th rowSpan="2">Player</th>
              <th colSpan="2" className="section-header batting-header">
                Batting
              </th>
              <th className="section-header bowling-header">Bowling</th>
              <th className="section-header fielding-header">Fielding</th>
              <th colSpan="3" className="section-header points-header">
                Fantasy Points
              </th>
              <th rowSpan="2" className="total-header">
                Total
              </th>
            </tr>
            <tr>
              <th>Runs (Balls)</th>
              <th>Boundaries</th>
              <th>Wickets/Overs</th>
              <th>Catches/RO</th>
              <th className="points-subheader bat-pts">Bat</th>
              <th className="points-subheader bowl-pts">Bowl</th>
              <th className="points-subheader field-pts">Field</th>
            </tr>
          </thead>
          <tbody>{team.players.map(renderPlayerRow)}</tbody>
        </table>
      </div>
    </div>
  );

  const renderTopPerformers = () => {
    if (!pointsData?.topPerformers) return null;

    return (
      <div className="top-performers">
        <h3>🏆 Top Performers</h3>

        <div className="performers-grid">
          <div className="performer-card">
            <h4>Overall Top 5</h4>
            <div className="performer-list">
              {pointsData.topPerformers.overall
                .slice(0, 5)
                .map((player, idx) => (
                  <div key={player.playerId} className="performer-item">
                    <span className="rank">#{idx + 1}</span>
                    <span className="name">{player.playerName}</span>
                    <span className="points">
                      {player.totalPoints.toFixed(1)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="performer-card">
            <h4>🏏 Top Batsmen</h4>
            <div className="performer-list">
              {pointsData.topPerformers.batsman
                .slice(0, 3)
                .map((player, idx) => (
                  <div key={player.playerId} className="performer-item">
                    <span className="rank">#{idx + 1}</span>
                    <span className="name">{player.playerName}</span>
                    <span className="points batting">
                      {player.categoryPoints.battingPoints.toFixed(1)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="performer-card">
            <h4>⚡ Top Bowlers</h4>
            <div className="performer-list">
              {pointsData.topPerformers.bowler
                .slice(0, 3)
                .map((player, idx) => (
                  <div key={player.playerId} className="performer-item">
                    <span className="rank">#{idx + 1}</span>
                    <span className="name">{player.playerName}</span>
                    <span className="points bowling">
                      {player.categoryPoints.bowlingPoints.toFixed(1)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="performer-card">
            <h4>🧤 Top Fielders</h4>
            <div className="performer-list">
              {pointsData.topPerformers.fielder
                .slice(0, 3)
                .map((player, idx) => (
                  <div key={player.playerId} className="performer-item">
                    <span className="rank">#{idx + 1}</span>
                    <span className="name">{player.playerName}</span>
                    <span className="points fielding">
                      {player.categoryPoints.fieldingPoints.toFixed(1)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlayerModal = () => {
    if (!selectedPlayer) return null;

    return (
      <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button
            className="modal-close"
            onClick={() => setSelectedPlayer(null)}
          >
            ×
          </button>

          <div className="player-details">
            {/* Player Header */}
            <div className="player-header">
              <div>
                <h2>
                  {selectedPlayer.player.playerName}
                  {selectedPlayer.player.isCaptain && (
                    <span className="badge-c">C</span>
                  )}
                  {selectedPlayer.player.isWicketKeeper && (
                    <span className="badge-wk">WK</span>
                  )}
                </h2>
                <p className="player-meta">
                  {selectedPlayer.player.teamName} ·{" "}
                  {selectedPlayer.player.playerRole}
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="stats-section">
              <div className="stat-card">
                <h3>🏏 Batting</h3>
                <div className="stat-grid">
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.batting.runs}
                    </span>
                    <span className="stat-lbl">Runs</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.batting.ballsFaced}
                    </span>
                    <span className="stat-lbl">Balls</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.batting.strikeRate.toFixed(1)}
                    </span>
                    <span className="stat-lbl">S/R</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.batting.fours}
                    </span>
                    <span className="stat-lbl">4s</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.batting.sixes}
                    </span>
                    <span className="stat-lbl">6s</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.batting.isOut
                        ? "Out"
                        : "Not Out"}
                    </span>
                    <span className="stat-lbl">
                      {selectedPlayer.performance.batting.isOut
                        ? selectedPlayer.performance.batting.dismissalType
                        : "Status"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h3>⚾ Bowling</h3>
                <div className="stat-grid">
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.bowling.wickets}
                    </span>
                    <span className="stat-lbl">Wickets</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.bowling.overs.toFixed(1)}
                    </span>
                    <span className="stat-lbl">Overs</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.bowling.runs}
                    </span>
                    <span className="stat-lbl">Runs</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.bowling.economyRate.toFixed(
                        2
                      )}
                    </span>
                    <span className="stat-lbl">Economy</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.bowling.maidens}
                    </span>
                    <span className="stat-lbl">Maidens</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.bowling.dotBalls}
                    </span>
                    <span className="stat-lbl">Dots</span>
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <h3>🧤 Fielding</h3>
                <div className="stat-grid">
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.fielding.catches}
                    </span>
                    <span className="stat-lbl">Catches</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.fielding.runOuts}
                    </span>
                    <span className="stat-lbl">Run Outs</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.fielding.stumpings}
                    </span>
                    <span className="stat-lbl">Stumpings</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-val">
                      {selectedPlayer.performance.fielding.directHits}
                    </span>
                    <span className="stat-lbl">Direct Hits</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="points-breakdown">
              <h3>📊 Points Breakdown</h3>
              <div className="total-points-display">
                <span className="label">Total Points</span>
                <span className="value">
                  {selectedPlayer.points.total.toFixed(1)}
                </span>
              </div>

              <div className="category-points">
                <div className="category-item batting">
                  <span className="label">Batting Points</span>
                  <span className="value">
                    {selectedPlayer.points.byCategory.battingPoints.toFixed(1)}
                  </span>
                </div>
                <div className="category-item bowling">
                  <span className="label">Bowling Points</span>
                  <span className="value">
                    {selectedPlayer.points.byCategory.bowlingPoints.toFixed(1)}
                  </span>
                </div>
                <div className="category-item fielding">
                  <span className="label">Fielding Points</span>
                  <span className="value">
                    {selectedPlayer.points.byCategory.fieldingPoints.toFixed(1)}
                  </span>
                </div>
                {selectedPlayer.points.byCategory.wicketKeepingPoints > 0 && (
                  <div className="category-item wk">
                    <span className="label">WK Points</span>
                    <span className="value">
                      {selectedPlayer.points.byCategory.wicketKeepingPoints.toFixed(
                        1
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="detailed-breakdown">
                <h4>Detailed Breakdown</h4>
                <table className="breakdown-table">
                  <tbody>
                    {selectedPlayer.points.breakdown.map((item) => (
                      <tr key={item.category}>
                        <td>{item.category}</td>
                        <td className="points-value">
                          {item.points.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="player-points-page">
      <div className="page-header">
        <h2>🏆 Player Points System</h2>

        <div className="controls">
          <div className="match-input">
            <input
              type="text"
              placeholder="Enter Match ID"
              value={matchId}
              onChange={(e) => setMatchId(e.target.value)}
              disabled={!!propMatchId}
            />
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "2px solid #e2e8f0",
              }}
            >
              <option value="organizer">Organizer</option>
              <option value="player">Player</option>
            </select>
            <button
              onClick={() => fetchMatchPoints()}
              disabled={!matchId || loading}
            >
              {loading ? "Loading..." : "Fetch Points"}
            </button>

            {/* 3-STEP WORKFLOW BUTTONS */}
            <button
              onClick={calculatePoints}
              disabled={!matchId || calculating}
              className="calculate-btn"
              title="STEP 1: Calculate points for playing XI (preview mode)"
            >
              {calculating ? "Calculating..." : "1️⃣ Calculate (Preview)"}
            </button>

            {workflowStep === "preview" && (
              <>
                <button
                  onClick={previewPoints}
                  disabled={!matchId || loading}
                  className="preview-btn"
                  title="STEP 2: Preview calculated points before pushing"
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "white",
                  }}
                >
                  {loading ? "Loading..." : "2️⃣ Preview Points"}
                </button>

                <button
                  onClick={pushPoints}
                  disabled={!matchId || pushing}
                  className="push-btn"
                  title="STEP 3: Confirm and push to cumulative stats"
                  style={{
                    backgroundColor: "#10b981",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {pushing ? "Pushing..." : "3️⃣ Push to Stats"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Workflow Status Banner */}
      {workflowStep === "preview" && (
        <div
          className="workflow-banner"
          style={{
            backgroundColor: "#fef3c7",
            border: "2px solid #f59e0b",
            borderRadius: "8px",
            padding: "16px",
            margin: "16px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>⚠️</span>
            <div>
              <strong style={{ color: "#92400e" }}>Preview Mode</strong>
              <p
                style={{
                  margin: "4px 0 0 0",
                  color: "#78350f",
                  fontSize: "14px",
                }}
              >
                Points calculated for {previewData?.length || 0} players. Click
                "Preview Points" to review, then "Push to Stats" to confirm.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={previewPoints}
              style={{
                padding: "8px 16px",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              2️⃣ Preview
            </button>
            <button
              onClick={pushPoints}
              style={{
                padding: "8px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              3️⃣ Push
            </button>
          </div>
        </div>
      )}

      {workflowStep === "pushed" && (
        <div
          className="workflow-banner"
          style={{
            backgroundColor: "#d1fae5",
            border: "2px solid #10b981",
            borderRadius: "8px",
            padding: "16px",
            margin: "16px 0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "24px" }}>✅</span>
          <div>
            <strong style={{ color: "#065f46" }}>
              Points Pushed Successfully!
            </strong>
            <p
              style={{
                margin: "4px 0 0 0",
                color: "#047857",
                fontSize: "14px",
              }}
            >
              Points have been added to player cumulative stats.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {pointsData && (
        <>
          <div className="match-info">
            <div className="info-item">
              <span className="label">Match ID:</span>
              <span className="value">{pointsData.match?.matchId}</span>
            </div>
            <div className="info-item">
              <span className="label">Status:</span>
              <span className="value status">
                {pointsData.match?.status || "completed"}
              </span>
            </div>
          </div>

          <div className="tabs">
            <button
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={activeTab === "team1" ? "active" : ""}
              onClick={() => setActiveTab("team1")}
            >
              {pointsData.teams?.team1?.teamName || "Team 1"}
            </button>
            <button
              className={activeTab === "team2" ? "active" : ""}
              onClick={() => setActiveTab("team2")}
            >
              {pointsData.teams?.team2?.teamName || "Team 2"}
            </button>
            <button
              className={activeTab === "performers" ? "active" : ""}
              onClick={() => setActiveTab("performers")}
            >
              Top Performers
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "overview" && (
              <div className="overview-tab">
                {pointsData.teams?.team1 &&
                  renderTeamTable(pointsData.teams.team1)}
                {pointsData.teams?.team2 &&
                  renderTeamTable(pointsData.teams.team2)}
              </div>
            )}

            {activeTab === "team1" && pointsData.teams?.team1 && (
              <div className="team-tab">
                {renderTeamTable(pointsData.teams.team1)}
              </div>
            )}

            {activeTab === "team2" && pointsData.teams?.team2 && (
              <div className="team-tab">
                {renderTeamTable(pointsData.teams.team2)}
              </div>
            )}

            {activeTab === "performers" && renderTopPerformers()}
          </div>
        </>
      )}

      {!loading && !pointsData && !error && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Points Data</h3>
          <p>Enter a match ID and fetch points to view player performance.</p>
        </div>
      )}

      {renderPlayerModal()}
    </div>
  );
}

export default PlayerPoints;
