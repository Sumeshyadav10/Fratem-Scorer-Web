import React, { useState, useEffect } from "react";
import "./CompletedMatchScorecard.css";
import API_BASE_URL from "../config/api";

/**
 * Completed Match Scorecard Page
 * Displays final match scorecard using the new GET /api/matches/:matchId/scorecard endpoint
 * Shows batting, bowling, fielding stats with professional UI/UX
 */
const CompletedMatchScorecard = ({ matchId: propMatchId, onBack }) => {
  const [matchId, setMatchId] = useState(propMatchId || "");
  const [scorecardData, setScorecardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeInnings, setActiveInnings] = useState(1);

  useEffect(() => {
    if (propMatchId) {
      setMatchId(propMatchId);
      fetchScorecard(propMatchId);
    }
  }, [propMatchId]);

  const fetchScorecard = async (id = matchId) => {
    if (!id || id.trim() === "") {
      setError("Please enter a valid Match ID");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/matches/${id}/scorecard`
      );
      const data = await response.json();

      if (data.success) {
        setScorecardData(data.data);
        setError(null);
      } else {
        setError(data.message || "Failed to fetch scorecard");
        setScorecardData(null);
      }
    } catch (err) {
      setError("Network error: " + err.message);
      setScorecardData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMatch = (e) => {
    e.preventDefault();
    fetchScorecard();
  };

  const formatOvers = (overs) => {
    if (!overs && overs !== 0) return "0";
    return typeof overs === "string" ? overs : overs.toString();
  };

  const formatStrikeRate = (runs, balls) => {
    if (!balls || balls === 0) return "0.00";
    return ((runs / balls) * 100).toFixed(2);
  };

  const formatEconomy = (runs, overs) => {
    if (!overs || overs === 0) return "0.00";
    // Convert overs to balls (6.2 = 38 balls)
    const [completedOvers, extraBalls] = overs
      .toString()
      .split(".")
      .map(Number);
    const totalBalls = (completedOvers || 0) * 6 + (extraBalls || 0);
    if (totalBalls === 0) return "0.00";
    return ((runs / totalBalls) * 6).toFixed(2);
  };

  const renderMatchOverview = () => {
    if (!scorecardData) return null;

    const matchInfo = scorecardData.scorecard?.matchInfo || {};
    const result = scorecardData.result || matchInfo.result;
    const team1Name =
      scorecardData.team1?.teamName ||
      scorecardData.scorecard?.teams?.team1?.teamName ||
      "Team 1";
    const team2Name =
      scorecardData.team2?.teamName ||
      scorecardData.scorecard?.teams?.team2?.teamName ||
      "Team 2";
    const venue = scorecardData.venue || matchInfo.venue;
    const venueText =
      typeof venue === "object"
        ? `${venue.ground || ""}, ${venue.city || ""}`.trim()
        : venue || "Venue not specified";

    return (
      <div className="match-overview-card">
        <div className="match-header">
          <div className="tournament-info">
            <span className="tournament-badge">
              {scorecardData.tournament || "Tournament"}
            </span>
            <span className="match-type-badge">
              {scorecardData.matchType || matchInfo.matchType || "T20"}
            </span>
          </div>
          <h1 className="match-title">
            {team1Name} vs {team2Name}
          </h1>
          <div className="match-meta">
            <span className="venue">📍 {venueText}</span>
            <span className="date">
              📅{" "}
              {matchInfo.timing?.startTime
                ? new Date(matchInfo.timing.startTime).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )
                : "Date not available"}
            </span>
          </div>
        </div>

        {result && result.winner && result.winner.teamName && (
          <div className="result-banner">
            <div className="winner-section">
              <div className="trophy-icon">🏆</div>
              <div className="winner-details">
                <h2 className="winner-name">{result.winner.teamName}</h2>
                <p className="result-text">
                  {result.matchSummary || "Match completed"}
                </p>
                {result.winMargin && (
                  <div className="margin-details">
                    <strong>{result.winMargin}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBattingCard = (innings, inningsNumber) => {
    if (
      !innings ||
      !innings.battingSummary ||
      !innings.battingSummary.players ||
      innings.battingSummary.players.length === 0
    ) {
      return (
        <div className="no-data">
          <p>No batting data available for Innings {inningsNumber}</p>
        </div>
      );
    }

    const battingTeam =
      innings.battingTeam?.teamName ||
      (inningsNumber === 1
        ? scorecardData.team1?.teamName
        : scorecardData.team2?.teamName);

    return (
      <div className="innings-card">
        <div className="innings-header">
          <h3>
            {battingTeam || `Team ${inningsNumber}`} Batting - Innings{" "}
            {inningsNumber}
          </h3>
          <div className="total-score">
            <span className="score-runs">{innings.score?.runs || 0}</span>
            <span className="score-separator">/</span>
            <span className="score-wickets">{innings.score?.wickets || 0}</span>
            <span className="score-overs">
              ({formatOvers(innings.score?.overs)} ov)
            </span>
          </div>
        </div>

        <div className="stats-table-wrapper">
          <table className="stats-table batting-table">
            <thead>
              <tr>
                <th className="player-col">Batsman</th>
                <th>Runs</th>
                <th>Balls</th>
                <th>4s</th>
                <th>6s</th>
                <th>SR</th>
                <th className="dismissal-col">How Out</th>
              </tr>
            </thead>
            <tbody>
              {innings.battingSummary.players.map((player, idx) => (
                <tr key={idx} className={player.isOut ? "" : "not-out"}>
                  <td className="player-name">
                    {player.playerName}
                    {!player.isOut && <span className="not-out-badge">*</span>}
                  </td>
                  <td className="runs-cell">
                    <strong>{player.runs}</strong>
                  </td>
                  <td>{player.ballsFaced || player.balls || 0}</td>
                  <td>{player.fours || 0}</td>
                  <td>{player.sixes || 0}</td>
                  <td className="sr-cell">
                    {formatStrikeRate(
                      player.runs,
                      player.ballsFaced || player.balls
                    )}
                  </td>
                  <td className="dismissal-info">
                    {player.isOut ? player.howOut || "out" : "not out"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="extras-row">
                <td colSpan="2">
                  <strong>Extras</strong>
                </td>
                <td colSpan="5" className="extras-breakdown">
                  {innings.extras?.total || innings.score?.extras?.total || 0} (
                  {(innings.extras?.breakdown?.byes ||
                    innings.score?.extras?.byes ||
                    0) > 0 &&
                    `b ${
                      innings.extras?.breakdown?.byes ||
                      innings.score?.extras?.byes
                    }, `}
                  {(innings.extras?.breakdown?.legByes ||
                    innings.score?.extras?.legByes ||
                    0) > 0 &&
                    `lb ${
                      innings.extras?.breakdown?.legByes ||
                      innings.score?.extras?.legByes
                    }, `}
                  {(innings.extras?.breakdown?.wides ||
                    innings.score?.extras?.wides ||
                    0) > 0 &&
                    `w ${
                      innings.extras?.breakdown?.wides ||
                      innings.score?.extras?.wides
                    }, `}
                  {(innings.extras?.breakdown?.noBalls ||
                    innings.score?.extras?.noBalls ||
                    0) > 0 &&
                    `nb ${
                      innings.extras?.breakdown?.noBalls ||
                      innings.score?.extras?.noBalls
                    }`}
                  {!(
                    innings.extras?.breakdown?.byes ||
                    innings.score?.extras?.byes
                  ) &&
                    !(
                      innings.extras?.breakdown?.legByes ||
                      innings.score?.extras?.legByes
                    ) &&
                    !(
                      innings.extras?.breakdown?.wides ||
                      innings.score?.extras?.wides
                    ) &&
                    !(
                      innings.extras?.breakdown?.noBalls ||
                      innings.score?.extras?.noBalls
                    ) &&
                    "0"}
                  )
                </td>
              </tr>
              <tr className="total-row">
                <td colSpan="2">
                  <strong>Total</strong>
                </td>
                <td colSpan="5">
                  <strong>
                    {innings.score?.runs || 0}/{innings.score?.wickets || 0}
                  </strong>{" "}
                  ({formatOvers(innings.score?.overs)} overs)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  const renderBowlingCard = (innings, inningsNumber) => {
    if (
      !innings ||
      !innings.bowlingSummary ||
      !innings.bowlingSummary.players ||
      innings.bowlingSummary.players.length === 0
    ) {
      return (
        <div className="no-data">
          <p>No bowling data available for Innings {inningsNumber}</p>
        </div>
      );
    }

    const bowlingTeam =
      innings.bowlingTeam?.teamName ||
      (inningsNumber === 1
        ? scorecardData.team2?.teamName
        : scorecardData.team1?.teamName);

    return (
      <div className="innings-card">
        <div className="innings-header">
          <h3>
            {bowlingTeam || `Team ${inningsNumber === 1 ? 2 : 1}`} Bowling
          </h3>
        </div>

        <div className="stats-table-wrapper">
          <table className="stats-table bowling-table">
            <thead>
              <tr>
                <th className="player-col">Bowler</th>
                <th>Overs</th>
                <th>Mdns</th>
                <th>Runs</th>
                <th>Wkts</th>
                <th>Econ</th>
                <th>Wides</th>
                <th>NB</th>
              </tr>
            </thead>
            <tbody>
              {innings.bowlingSummary.players.map((player, idx) => (
                <tr key={idx}>
                  <td className="player-name">{player.playerName}</td>
                  <td>{formatOvers(player.overs)}</td>
                  <td>{player.maidens || 0}</td>
                  <td>{player.runs || 0}</td>
                  <td className="wickets-cell">
                    <strong>{player.wickets || 0}</strong>
                  </td>
                  <td className="econ-cell">
                    {formatEconomy(player.runs, player.overs)}
                  </td>
                  <td>{player.wides || 0}</td>
                  <td>{player.noBalls || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderFieldingCard = (innings, inningsNumber) => {
    if (
      !innings ||
      !innings.fieldingSummary ||
      !innings.fieldingSummary.players ||
      innings.fieldingSummary.players.length === 0
    ) {
      return null; // Don't show if no fielding stats
    }

    const fieldingTeam =
      innings.bowlingTeam?.teamName ||
      (inningsNumber === 1
        ? scorecardData.team2?.teamName
        : scorecardData.team1?.teamName);

    return (
      <div className="innings-card fielding-card">
        <div className="innings-header">
          <h3>
            {fieldingTeam || `Team ${inningsNumber === 1 ? 2 : 1}`} Fielding
          </h3>
        </div>

        <div className="stats-table-wrapper">
          <table className="stats-table fielding-table">
            <thead>
              <tr>
                <th className="player-col">Fielder</th>
                <th>Catches</th>
                <th>Run Outs</th>
                <th>Stumpings</th>
              </tr>
            </thead>
            <tbody>
              {innings.fieldingSummary.players.map((player, idx) => (
                <tr key={idx}>
                  <td className="player-name">{player.playerName}</td>
                  <td>{player.catches || 0}</td>
                  <td>{player.runOuts || 0}</td>
                  <td>{player.stumpings || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderOfficialsInfo = () => {
    if (!scorecardData?.officials) return null;

    const { scorers, umpires } = scorecardData.officials;

    if (!scorers?.length && !umpires?.length) return null;

    return (
      <div className="officials-card">
        <h3>Match Officials</h3>
        <div className="officials-grid">
          {umpires && umpires.length > 0 && (
            <div className="official-section">
              <h4>👨‍⚖️ Umpires</h4>
              <ul>
                {umpires.map((umpire, idx) => (
                  <li key={idx}>{umpire.name || umpire}</li>
                ))}
              </ul>
            </div>
          )}
          {scorers && scorers.length > 0 && (
            <div className="official-section">
              <h4>📝 Scorers</h4>
              <ul>
                {scorers.map((scorer, idx) => (
                  <li key={idx}>
                    {typeof scorer === "string" ? (
                      scorer
                    ) : (
                      <div>
                        <strong>{scorer.name || `Scorer ${idx + 1}`}</strong>
                        {scorer.mobile && (
                          <span
                            style={{
                              color: "#6c757d",
                              fontSize: "14px",
                              marginLeft: "8px",
                            }}
                          >
                            📱 {scorer.mobile}
                          </span>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Super Over Section
  const renderSuperOverSection = () => {
    const superOvers =
      scorecardData?.superOvers || scorecardData?.scorecard?.superOvers;
    if (!superOvers || superOvers.length === 0) return null;

    return (
      <div className="super-over-section" style={{ marginTop: "30px" }}>
        <h2
          style={{
            color: "#ff8c00",
            borderBottom: "3px solid #ff8c00",
            paddingBottom: "10px",
            marginBottom: "20px",
          }}
        >
          🔁 Super Over{superOvers.length > 1 ? "s" : ""} ({superOvers.length})
        </h2>

        {superOvers.map((so, soIndex) => (
          <div
            key={soIndex}
            style={{
              background: "linear-gradient(135deg, #fff5e6 0%, #ffe6cc 100%)",
              border: "2px solid #ff8c00",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            {/* Super Over Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
                borderBottom: "1px solid #ffcc80",
                paddingBottom: "15px",
              }}
            >
              <h3 style={{ margin: 0, color: "#e65100" }}>
                Super Over #{so.superOverNumber || soIndex + 1}
              </h3>
              <span
                style={{
                  background:
                    so.status === "completed"
                      ? "#4caf50"
                      : so.status === "tied"
                      ? "#ff8c00"
                      : "#2196f3",
                  color: "white",
                  padding: "5px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                {so.status || "In Progress"}
              </span>
            </div>

            {/* Result Summary */}
            {so.result?.summary && (
              <div
                style={{
                  background: "#4caf50",
                  color: "white",
                  padding: "12px 20px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                🏆 {so.result.summary}
              </div>
            )}

            {/* First Innings */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  background: "white",
                  borderRadius: "8px",
                  padding: "15px",
                  border: "1px solid #e0e0e0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <h4 style={{ margin: 0, color: "#2e7d32" }}>
                    1st Innings - {so.battingFirstTeam?.teamName || "Team 1"}
                  </h4>
                  <span
                    style={{
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#333",
                    }}
                  >
                    {so.innings1?.runs || 0}/{so.innings1?.wickets || 0}
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#666",
                        marginLeft: "8px",
                      }}
                    >
                      ({so.innings1?.balls || 0} balls)
                    </span>
                  </span>
                </div>

                {/* Batsmen Stats */}
                {so.innings1?.batsmen && so.innings1.batsmen.length > 0 && (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      marginBottom: "10px",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "8px",
                            fontSize: "12px",
                          }}
                        >
                          Batsman
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            padding: "8px",
                            fontSize: "12px",
                          }}
                        >
                          R
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            padding: "8px",
                            fontSize: "12px",
                          }}
                        >
                          B
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            padding: "8px",
                            fontSize: "12px",
                          }}
                        >
                          4s
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            padding: "8px",
                            fontSize: "12px",
                          }}
                        >
                          6s
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {so.innings1.batsmen.map((bat, idx) => (
                        <tr
                          key={idx}
                          style={{ borderBottom: "1px solid #f0f0f0" }}
                        >
                          <td style={{ padding: "8px" }}>
                            {bat.playerName}
                            {bat.isOut && (
                              <span
                                style={{
                                  color: "#d32f2f",
                                  marginLeft: "5px",
                                  fontSize: "11px",
                                }}
                              >
                                ({bat.dismissalType || "out"})
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              fontWeight: "bold",
                              color: "#ff8c00",
                            }}
                          >
                            {bat.runs || 0}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {bat.balls || 0}
                          </td>
                          <td style={{ textAlign: "center", color: "#1976d2" }}>
                            {bat.fours || 0}
                          </td>
                          <td style={{ textAlign: "center", color: "#7b1fa2" }}>
                            {bat.sixes || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Bowler Stats */}
                {so.innings1?.bowler && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      padding: "8px",
                      background: "#f5f5f5",
                      borderRadius: "4px",
                    }}
                  >
                    <strong>Bowler:</strong> {so.innings1.bowler.playerName} -
                    0.{so.innings1.bowler.balls || 0} |{" "}
                    {so.innings1.bowler.runs || 0}-
                    {so.innings1.bowler.wickets || 0}
                  </div>
                )}
              </div>
            </div>

            {/* Second Innings */}
            {so.innings2 &&
              (so.innings2.balls > 0 ||
                so.innings2.runs > 0 ||
                so.innings2.target > 0) && (
                <div>
                  <div
                    style={{
                      background: "white",
                      borderRadius: "8px",
                      padding: "15px",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px",
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, color: "#c62828" }}>
                          2nd Innings -{" "}
                          {so.battingSecondTeam?.teamName || "Team 2"}
                        </h4>
                        {so.innings2.target > 0 && (
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            Target: {so.innings2.target}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "24px",
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      >
                        {so.innings2?.runs || 0}/{so.innings2?.wickets || 0}
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#666",
                            marginLeft: "8px",
                          }}
                        >
                          ({so.innings2?.balls || 0} balls)
                        </span>
                      </span>
                    </div>

                    {/* Batsmen Stats */}
                    {so.innings2?.batsmen && so.innings2.batsmen.length > 0 && (
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          marginBottom: "10px",
                        }}
                      >
                        <thead>
                          <tr style={{ borderBottom: "1px solid #e0e0e0" }}>
                            <th
                              style={{
                                textAlign: "left",
                                padding: "8px",
                                fontSize: "12px",
                              }}
                            >
                              Batsman
                            </th>
                            <th
                              style={{
                                textAlign: "center",
                                padding: "8px",
                                fontSize: "12px",
                              }}
                            >
                              R
                            </th>
                            <th
                              style={{
                                textAlign: "center",
                                padding: "8px",
                                fontSize: "12px",
                              }}
                            >
                              B
                            </th>
                            <th
                              style={{
                                textAlign: "center",
                                padding: "8px",
                                fontSize: "12px",
                              }}
                            >
                              4s
                            </th>
                            <th
                              style={{
                                textAlign: "center",
                                padding: "8px",
                                fontSize: "12px",
                              }}
                            >
                              6s
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {so.innings2.batsmen.map((bat, idx) => (
                            <tr
                              key={idx}
                              style={{ borderBottom: "1px solid #f0f0f0" }}
                            >
                              <td style={{ padding: "8px" }}>
                                {bat.playerName}
                                {bat.isOut && (
                                  <span
                                    style={{
                                      color: "#d32f2f",
                                      marginLeft: "5px",
                                      fontSize: "11px",
                                    }}
                                  >
                                    ({bat.dismissalType || "out"})
                                  </span>
                                )}
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  color: "#ff8c00",
                                }}
                              >
                                {bat.runs || 0}
                              </td>
                              <td style={{ textAlign: "center" }}>
                                {bat.balls || 0}
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  color: "#1976d2",
                                }}
                              >
                                {bat.fours || 0}
                              </td>
                              <td
                                style={{
                                  textAlign: "center",
                                  color: "#7b1fa2",
                                }}
                              >
                                {bat.sixes || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Bowler Stats */}
                    {so.innings2?.bowler && so.innings2.bowler.playerName && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          padding: "8px",
                          background: "#f5f5f5",
                          borderRadius: "4px",
                        }}
                      >
                        <strong>Bowler:</strong> {so.innings2.bowler.playerName}{" "}
                        - 0.{so.innings2.bowler.balls || 0} |{" "}
                        {so.innings2.bowler.runs || 0}-
                        {so.innings2.bowler.wickets || 0}
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="completed-match-scorecard-page">
      <div className="page-header">
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
        <h1 className="page-title">📊 Match Scorecard</h1>
      </div>

      {/* Match ID Search */}
      <div className="search-section">
        <form onSubmit={handleSearchMatch} className="search-form">
          <input
            type="text"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            placeholder="Enter Match ID (e.g., MATCH-xxxxx)"
            className="match-id-input"
          />
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? "Loading..." : "🔍 View Scorecard"}
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading scorecard...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Unable to Load Scorecard</h3>
          <p>{error}</p>
          <button onClick={() => fetchScorecard()} className="retry-button">
            🔄 Try Again
          </button>
        </div>
      )}

      {/* Scorecard Display */}
      {!loading && !error && scorecardData && (
        <div className="scorecard-container">
          {/* Match Overview */}
          {renderMatchOverview()}

          {/* Innings Tabs */}
          {scorecardData.scorecard && (
            <div className="innings-tabs">
              <button
                className={`tab-button ${activeInnings === 1 ? "active" : ""}`}
                onClick={() => setActiveInnings(1)}
              >
                1st Innings
              </button>
              <button
                className={`tab-button ${activeInnings === 2 ? "active" : ""}`}
                onClick={() => setActiveInnings(2)}
              >
                2nd Innings
              </button>
              {/* Super Over Tab - only show if super overs exist */}
              {(scorecardData?.superOvers?.length > 0 ||
                scorecardData?.scorecard?.superOvers?.length > 0) && (
                <button
                  className={`tab-button ${
                    activeInnings === "superover" ? "active" : ""
                  }`}
                  onClick={() => setActiveInnings("superover")}
                  style={{
                    background:
                      activeInnings === "superover"
                        ? "linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)"
                        : "transparent",
                    color: activeInnings === "superover" ? "white" : "#ff8c00",
                    border: "2px solid #ff8c00",
                  }}
                >
                  🔁 Super Over
                </button>
              )}
            </div>
          )}

          {/* Innings Details */}
          {scorecardData.scorecard?.innings && activeInnings === 1 && (
            <div className="innings-content">
              {renderBattingCard(scorecardData.scorecard.innings.innings1, 1)}
              {renderBowlingCard(scorecardData.scorecard.innings.innings1, 1)}
              {renderFieldingCard(scorecardData.scorecard.innings.innings1, 1)}
            </div>
          )}

          {scorecardData.scorecard?.innings && activeInnings === 2 && (
            <div className="innings-content">
              {renderBattingCard(scorecardData.scorecard.innings.innings2, 2)}
              {renderBowlingCard(scorecardData.scorecard.innings.innings2, 2)}
              {renderFieldingCard(scorecardData.scorecard.innings.innings2, 2)}
            </div>
          )}

          {/* Super Over Content */}
          {activeInnings === "superover" && renderSuperOverSection()}

          {/* Officials Info */}
          {renderOfficialsInfo()}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !scorecardData && (
        <div className="empty-state">
          <div className="empty-icon">🏏</div>
          <h3>No Scorecard Loaded</h3>
          <p>Enter a Match ID above to view the scorecard</p>
        </div>
      )}
    </div>
  );
};

export default CompletedMatchScorecard;
