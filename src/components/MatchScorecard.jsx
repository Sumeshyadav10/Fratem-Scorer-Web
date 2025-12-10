import React, { useState, useEffect } from "react";
import "./MatchScorecard.css";
import API_BASE_URL from "../config/api";

/**
 * Match Scorecard Component
 * Displays comprehensive match summary with batting and bowling statistics
 */

const MatchScorecard = ({ matchId, apiBaseUrl = API_BASE_URL }) => {
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
        setMatchData(data.data);
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

  const formatExtras = (extras) => {
    if (!extras || !extras.breakdown) return "";
    const { byes, legByes, wides, noBalls, penalties } = extras.breakdown;
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
                  <td className="status">{player.isOut ? "out" : "not out"}</td>
                </tr>
              ))}

              {/* Extras row */}
              <tr className="extras-row">
                <td className="extras-label">{formatExtras(extras)}</td>
                <td className="extras-value">{extras.total}</td>
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
              Target: {score.target} | Required Rate:{" "}
              {score.requiredRunRate || "N/A"}
            </p>
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
                  <strong>{totals.economyRate}</strong>
                </td>
              </tr>
            </tbody>
          </table>
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
          </>
        )}
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
          </>
        )}
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
