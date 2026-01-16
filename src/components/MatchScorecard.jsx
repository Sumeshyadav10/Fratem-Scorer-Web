import React, { useState, useEffect } from "react";
import "./MatchScorecard.css";
import API_BASE_URL from "../config/api";

/**
 * Match Scorecard Component
 * Displays comprehensive match summary with batting and bowling statistics
 */

const MatchScorecard = ({
  matchId: propMatchId,
  apiBaseUrl = API_BASE_URL,
}) => {
  const matchId = propMatchId?.trim();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    if (matchId) {
      fetchMatchSummary();
    }
  }, [matchId]);

  const fetchMatchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${apiBaseUrl}/api/match-summary/${matchId}`
      );
      const data = await response.json();

      if (data.success) {
        // If fallOfWickets is missing from the match summary, fall back to live-match endpoint
        let enrichedData = data.data;
        if (
          !enrichedData.fallOfWickets ||
          enrichedData.fallOfWickets.length === 0
        ) {
          try {
            console.debug(
              "Falling back to /api/live-matches for fallOfWickets"
            );
            const liveRes = await fetch(
              `${apiBaseUrl}/api/live-matches/${matchId}`
            );
            const liveJson = await liveRes.json();
            if (liveJson && liveJson.success && liveJson.data?.match) {
              enrichedData.fallOfWickets =
                liveJson.data.match.fallOfWickets || [];
            }
          } catch (err) {
            console.warn(
              "Failed to fetch fallback live-match data:",
              err.message
            );
          }
        }

        setMatchData(enrichedData);
      } else {
        setError(data.message || "Failed to fetch match data");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatOvers = (overs) => {
    if (!overs) return "0";
    return typeof overs === "string" ? overs : overs.toString();
  };

  const formatStrikeRate = (runs, balls) => {
    if (!balls || balls === 0) return "0.00";
    return ((runs / balls) * 100).toFixed(2);
  };

  const formatExtras = (extras, fallbackExtras) => {
    // Support multiple shapes and casing from different endpoints / payloads
    const ex = extras || fallbackExtras || {};
    const breakdown = ex.breakdown || ex;

    const byes = breakdown.byes ?? breakdown.by ?? 0;
    const legByes =
      breakdown.legByes ?? breakdown.legbyes ?? breakdown.leg ?? 0;
    const wides = breakdown.wides ?? breakdown.wide ?? 0;
    const noBalls =
      breakdown.noBalls ?? breakdown.noballs ?? breakdown.no_ball ?? 0;
    const penalties = breakdown.penalties ?? breakdown.pens ?? 0;

    const parts = [];
    if (byes > 0) parts.push(`b ${byes}`);
    if (legByes > 0) parts.push(`lb ${legByes}`);
    if (wides > 0) parts.push(`w ${wides}`);
    if (noBalls > 0) parts.push(`nb ${noBalls}`);
    if (penalties > 0) parts.push(`p ${penalties}`);

    return parts.length > 0 ? `Extras (${parts.join(", ")})` : "";
  };

  const BattingCard = ({ inningsData, inningsNumber }) => {
    if (!inningsData || !inningsData.battingSummary) return null;

    const { players, totals } = inningsData.battingSummary;
    const { score, extras } = inningsData;

    return (
      <div className="batting-card">
        <div className="card-header">
          <h3>
            {inningsData.battingTeam.teamName} - Innings {inningsNumber}
          </h3>
          <div className="score-summary">
            <span className="score">
              {score.runs}/{score.wickets}
            </span>
            <span className="overs">({formatOvers(score.overs)} ov)</span>
            <span className="run-rate">RR: {score.runRate}</span>
          </div>
        </div>

        <div className="batting-table">
          <table>
            <thead>
              <tr>
                <th>Batsman</th>
                <th>R</th>
                <th>B</th>
                <th>4s</th>
                <th>6s</th>
                <th>SR</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr
                  key={player.playerId || index}
                  className={player.isOut ? "out" : "not-out"}
                >
                  <td className="player-name">
                    {player.playerName}
                    {player.position && (
                      <span className="batting-position">
                        ({player.position})
                      </span>
                    )}
                  </td>
                  <td className="runs">{player.runs}</td>
                  <td className="balls">{player.ballsFaced}</td>
                  <td className="fours">{player.fours}</td>
                  <td className="sixes">{player.sixes}</td>
                  <td className="strike-rate">
                    {formatStrikeRate(player.runs, player.ballsFaced)}
                  </td>
                  <td className="status">
                    {player.isOut ? player.dismissal || "out" : "not out"}
                  </td>
                </tr>
              ))}

              {/* Extras row */}
              <tr className="extras-row">
                <td className="extras-label">
                  {formatExtras(extras, inningsData.score?.extras)}
                </td>
                <td className="extras-value">
                  {(extras && extras.total) ||
                    (inningsData.score &&
                      inningsData.score.extras &&
                      inningsData.score.extras.total) ||
                    0}
                </td>
                <td colSpan="5"></td>
              </tr>

              {/* Total row */}
              <tr className="total-row">
                <td>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>{score.runs}</strong>
                </td>
                <td>
                  <strong>({formatOvers(score.overs)} ov)</strong>
                </td>
                <td colSpan="4"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {score.target && (
          <div className="target-info">
            <p>
              <strong>Target:</strong> {score.target}
            </p>
            {inningsNumber === 2 && (
              <div className="chasing-info">
                <span>
                  <strong>Remaining balls:</strong>{" "}
                  {(() => {
                    const matchOvers = matchData?.matchInfo?.overs || 0;
                    const totalBalls = Number(matchOvers) * 6;
                    const remaining = Math.max(
                      0,
                      totalBalls - (score.balls || 0)
                    );
                    return remaining;
                  })()}
                </span>
                <span>
                  <strong>CRR:</strong>{" "}
                  {(score.runRate || 0).toFixed
                    ? (score.runRate || 0).toFixed(2)
                    : score.runRate}
                </span>
                <span>
                  <strong>RRR:</strong>{" "}
                  {score.requiredRunRate
                    ? Number(score.requiredRunRate).toFixed(2)
                    : "N/A"}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const BowlingCard = ({ inningsData, inningsNumber }) => {
    if (!inningsData || !inningsData.bowlingSummary) return null;

    const { players, totals } = inningsData.bowlingSummary;
    const bowlingTeamName = inningsData.bowlingTeam.teamName;

    return (
      <div className="bowling-card">
        <div className="card-header">
          <h3>
            {bowlingTeamName} - Bowling (Innings {inningsNumber})
          </h3>
        </div>

        <div className="bowling-table">
          <table>
            <thead>
              <tr>
                <th>Bowler</th>
                <th>O</th>
                <th>M</th>
                <th>R</th>
                <th>W</th>
                <th>WD</th>
                <th>NB</th>
                <th>DB</th>
                <th>Econ</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player.playerId || index}>
                  <td className="player-name">
                    {player.playerName}
                    {player.position && (
                      <span className="bowling-position">
                        ({player.position})
                      </span>
                    )}
                  </td>
                  <td className="overs">{formatOvers(player.overs)}</td>
                  <td className="maidens">{player.maidens}</td>
                  <td className="runs">{player.runs}</td>
                  <td className="wickets">{player.wickets}</td>
                  <td className="wides">{player.wides}</td>
                  <td className="no-balls">{player.noBalls}</td>
                  <td className="dot-balls">{player.dotBalls}</td>
                  <td className="economy">{player.economyRate}</td>
                </tr>
              ))}

              {/* Total row */}
              <tr className="total-row">
                <td>
                  <strong>Total</strong>
                </td>
                <td>
                  <strong>{formatOvers(totals.overs)}</strong>
                </td>
                <td></td>
                <td>
                  <strong>{totals.runs}</strong>
                </td>
                <td>
                  <strong>{totals.wickets}</strong>
                </td>
                <td></td>
                <td></td>
                <td>
                  <strong>{totals.dotBalls || 0}</strong>
                </td>
                <td>
                  <strong>{totals.economyRate}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- Fall of Wickets Card ---
  const formatOver = (overs, balls) => {
    if (overs !== undefined && overs !== null) return overs;
    if (!balls && balls !== 0) return "0";
    // Convert balls to overs.ball format (e.g., 14 balls -> 2.2)
    const completeOvers = Math.floor((balls || 0) / 6);
    const remainder = (balls || 0) % 6;
    return `${completeOvers}.${remainder}`;
  };

  const FallOfWicketsCard = ({ fallOfWickets = [], inningsNumber }) => {
    const items = (fallOfWickets || []).filter(
      (f) => f.innings === inningsNumber
    );

    return (
      <div
        id={`fall-of-wickets-innings-${inningsNumber}`}
        className="fall-of-wickets-card"
      >
        <div className="card-header">
          <h3>Fall of Wickets — Innings {inningsNumber}</h3>
        </div>

        <div className="fow-list">
          {items.length === 0 ? (
            <div className="fow-empty">
              No fall of wickets recorded for this innings.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Over</th>
                  <th>Batsman</th>
                  <th>Dismissal</th>
                  <th>Bowler</th>
                  <th>Fielder(s)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((wicket, idx) => (
                  <tr key={wicket._id?.$oid || idx}>
                    <td>{wicket.wicketNumber ?? idx + 1}</td>
                    <td>{formatOver(wicket.overs, wicket.balls)}</td>
                    <td>{wicket.dismissedPlayer?.playerName || "-"}</td>
                    <td>{wicket.dismissalType || "-"}</td>
                    <td>{wicket.bowler?.playerName || "-"}</td>
                    <td>
                      {wicket.fielder?.playerName
                        ? wicket.fielder.playerName +
                          (wicket.assistFielder
                            ? ` (assist: ${wicket.assistFielder.playerName})`
                            : "")
                        : wicket.assistFielder
                        ? `Assist: ${wicket.assistFielder.playerName}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  const MatchHeader = ({ matchInfo, teams }) => (
    <div className="match-header">
      <div className="match-title">
        <h1>
          {teams.team1.teamName} vs {teams.team2.teamName}
        </h1>
        <div className="match-details">
          <span className="match-type">{matchInfo.matchType}</span>
          {matchInfo.matchFormat && (
            <span
              className="match-format"
              style={{
                background: "#007bff",
                color: "white",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              {matchInfo.matchFormat === "overarm"
                ? "⚾ Overarm"
                : matchInfo.matchFormat === "leather-ball"
                ? "🏏 Leather Ball"
                : matchInfo.matchFormat === "underarm"
                ? "🥎 Underarm"
                : matchInfo.matchFormat}
            </span>
          )}
          <span className="venue">
            {matchInfo.venue?.ground}, {matchInfo.venue?.city}
          </span>
          <span className="status">{matchInfo.status}</span>
        </div>
      </div>

      {matchInfo.toss && (
        <div className="toss-info">
          <p>
            <strong>Toss:</strong> {matchInfo.toss.tossWinner?.teamName} won the
            toss and chose to {matchInfo.toss.decision}
          </p>
        </div>
      )}
    </div>
  );

  const TabNavigation = () => (
    <div className="tab-navigation">
      <button
        className={`tab-button ${activeTab === "summary" ? "active" : ""}`}
        onClick={() => setActiveTab("summary")}
      >
        Match Summary
      </button>
      <button
        className={`tab-button ${activeTab === "innings1" ? "active" : ""}`}
        onClick={() => setActiveTab("innings1")}
        disabled={!matchData?.innings?.innings1}
      >
        1st Innings
      </button>
      <button
        className={`tab-button ${activeTab === "innings2" ? "active" : ""}`}
        onClick={() => setActiveTab("innings2")}
        disabled={!matchData?.innings?.innings2}
      >
        2nd Innings
      </button>
      {matchData?.superOvers && matchData.superOvers.length > 0 && (
        <button
          className={`tab-button ${activeTab === "superover" ? "active" : ""}`}
          onClick={() => setActiveTab("superover")}
        >
          🔁 Super Over
        </button>
      )}
    </div>
  );

  const SummaryView = () => {
    if (!matchData.innings) return <div>No innings data available</div>;

    return (
      <div className="summary-view">
        {matchData.innings.innings1 && (
          <>
            <BattingCard
              inningsData={matchData.innings.innings1}
              inningsNumber={1}
            />
            <BowlingCard
              inningsData={matchData.innings.innings1}
              inningsNumber={1}
            />
            <FallOfWicketsCard
              fallOfWickets={matchData.fallOfWickets}
              inningsNumber={1}
            />
          </>
        )}

        {matchData.innings.innings2 && (
          <>
            <BattingCard
              inningsData={matchData.innings.innings2}
              inningsNumber={2}
            />
            <BowlingCard
              inningsData={matchData.innings.innings2}
              inningsNumber={2}
            />
            <FallOfWicketsCard
              fallOfWickets={matchData.fallOfWickets}
              inningsNumber={2}
            />
          </>
        )}

        {/* Super Over Section - show inline in summary */}
        {renderSuperOverSection()}
      </div>
    );
  };

  // Render Super Over Section
  const renderSuperOverSection = () => {
    const superOvers =
      matchData?.superOvers || matchData?.scorecard?.superOvers;
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
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <strong>
                    1st Innings -{" "}
                    {so.innings1?.teamName ||
                      so.battingFirstTeam?.teamName ||
                      "Team"}
                  </strong>
                  <strong>
                    {so.innings1?.runs || 0}/{so.innings1?.wickets || 0} (
                    {so.innings1?.balls || 0} balls)
                  </strong>
                </div>

                {/* Batsmen table */}
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Batsman</th>
                      <th style={{ textAlign: "right" }}>R</th>
                      <th style={{ textAlign: "right" }}>B</th>
                      <th style={{ textAlign: "right" }}>4s</th>
                      <th style={{ textAlign: "right" }}>6s</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(so.innings1?.batsmen || []).map((bat, idx) => (
                      <tr key={idx}>
                        <td>{bat.playerName || "-"}</td>
                        <td style={{ textAlign: "right" }}>{bat.runs || 0}</td>
                        <td style={{ textAlign: "right" }}>{bat.balls || 0}</td>
                        <td style={{ textAlign: "right" }}>{bat.fours || 0}</td>
                        <td style={{ textAlign: "right" }}>{bat.sixes || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Bowler info */}
                {so.innings1?.bowler?.playerName && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      padding: "8px",
                      background: "#f5f5f5",
                      borderRadius: "4px",
                      marginTop: "10px",
                    }}
                  >
                    <strong>Bowler:</strong> {so.innings1.bowler.playerName} -{" "}
                    {so.innings1.bowler.runs || 0}-
                    {so.innings1.bowler.wickets || 0} (
                    {so.innings1.bowler.balls || 0} balls)
                  </div>
                )}
              </div>
            </div>

            {/* Second Innings */}
            <div>
              <div
                style={{
                  background: "white",
                  borderRadius: "8px",
                  padding: "15px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <strong>
                    2nd Innings -{" "}
                    {so.innings2?.teamName ||
                      so.battingSecondTeam?.teamName ||
                      "Team"}
                  </strong>
                  <strong>
                    {so.innings2?.runs || 0}/{so.innings2?.wickets || 0} (
                    {so.innings2?.balls || 0} balls)
                  </strong>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>Batsman</th>
                      <th style={{ textAlign: "right" }}>R</th>
                      <th style={{ textAlign: "right" }}>B</th>
                      <th style={{ textAlign: "right" }}>4s</th>
                      <th style={{ textAlign: "right" }}>6s</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(so.innings2?.batsmen || []).map((bat, idx) => (
                      <tr key={idx}>
                        <td>{bat.playerName || "-"}</td>
                        <td style={{ textAlign: "right" }}>{bat.runs || 0}</td>
                        <td style={{ textAlign: "right" }}>{bat.balls || 0}</td>
                        <td style={{ textAlign: "right" }}>{bat.fours || 0}</td>
                        <td style={{ textAlign: "right" }}>{bat.sixes || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Bowler info */}
                {so.innings2?.bowler?.playerName && (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#666",
                      padding: "8px",
                      background: "#f5f5f5",
                      borderRadius: "4px",
                      marginTop: "10px",
                    }}
                  >
                    <strong>Bowler:</strong> {so.innings2.bowler.playerName} -{" "}
                    {so.innings2.bowler.runs || 0}-
                    {so.innings2.bowler.wickets || 0} (
                    {so.innings2.bowler.balls || 0} balls)
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const ErrorDisplay = () => (
    <div className="error-container">
      <div className="error-message">
        <h2>⚠️ Error Loading Match Data</h2>
        <p>{error}</p>
        <button className="retry-button" onClick={fetchMatchSummary}>
          Retry
        </button>
      </div>
    </div>
  );

  const LoadingDisplay = () => (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading match scorecard...</p>
    </div>
  );

  if (loading) return <LoadingDisplay />;
  if (error) return <ErrorDisplay />;
  if (!matchData) return <div>No match data found</div>;

  return (
    <div className="match-scorecard">
      <MatchHeader matchInfo={matchData.matchInfo} teams={matchData.teams} />
      <TabNavigation />

      <div className="content-area">
        {activeTab === "summary" && <SummaryView />}
        {activeTab === "innings1" && matchData.innings?.innings1 && (
          <>
            <BattingCard
              inningsData={matchData.innings.innings1}
              inningsNumber={1}
            />
            <BowlingCard
              inningsData={matchData.innings.innings1}
              inningsNumber={1}
            />
            <FallOfWicketsCard
              fallOfWickets={matchData.fallOfWickets}
              inningsNumber={1}
            />
          </>
        )}
        {activeTab === "innings2" && matchData.innings?.innings2 && (
          <>
            <BattingCard
              inningsData={matchData.innings.innings2}
              inningsNumber={2}
            />
            <BowlingCard
              inningsData={matchData.innings.innings2}
              inningsNumber={2}
            />
            <FallOfWicketsCard
              fallOfWickets={matchData.fallOfWickets}
              inningsNumber={2}
            />
          </>
        )}

        {activeTab === "superover" && renderSuperOverSection()}
      </div>

      <div className="refresh-controls">
        <button className="refresh-button" onClick={fetchMatchSummary}>
          🔄 Refresh Data
        </button>
        <span className="last-updated">
          Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default MatchScorecard;
