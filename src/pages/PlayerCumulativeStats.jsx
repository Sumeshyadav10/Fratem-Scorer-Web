import React, { useState, useEffect } from "react";
import "./PlayerPoints.css";
import API_BASE_URL from "../config/api";

/**
 * NEW: Player Cumulative Stats Component
 * Uses the new single-document PlayerCumulativePoints model
 * Shows overall career stats + match history
 */
function PlayerCumulativeStats({ playerId: propPlayerId, token }) {
  const [playerId, setPlayerId] = useState(propPlayerId || "");
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState("all");
  const [activeTab, setActiveTab] = useState("overview"); // overview, matches, tournaments

  useEffect(() => {
    if (propPlayerId) {
      setPlayerId(propPlayerId);
      fetchPlayerStats(propPlayerId);
    }
  }, [propPlayerId]);

  const fetchPlayerStats = async (id = playerId) => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/player-points/player/${id}/cumulative`
      );
      const data = await response.json();

      if (data.success) {
        setPlayerData(data.data);
      } else {
        setError(data.message || "Failed to fetch player stats");
      }
    } catch (err) {
      setError("Error fetching player stats: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTournamentList = () => {
    if (!playerData) return [];

    const tournaments = new Set(
      playerData.matchHistory.map((m) => m.tournamentId?.toString())
    );
    return Array.from(tournaments).filter(Boolean);
  };

  const getFilteredMatches = () => {
    if (!playerData) return [];

    if (selectedTournament === "all") {
      return playerData.matchHistory;
    }

    return playerData.matchHistory.filter(
      (m) => m.tournamentId?.toString() === selectedTournament
    );
  };

  const getTournamentStats = () => {
    const matches = getFilteredMatches();

    if (matches.length === 0) {
      return {
        totalMatches: 0,
        totalPoints: 0,
        averagePoints: 0,
        totalRuns: 0,
        totalWickets: 0,
        highestScore: 0,
      };
    }

    return {
      totalMatches: matches.length,
      totalPoints: matches.reduce((sum, m) => sum + m.totalPoints, 0),
      averagePoints:
        matches.reduce((sum, m) => sum + m.totalPoints, 0) / matches.length,
      totalRuns: matches.reduce((sum, m) => sum + m.battingStats.runs, 0),
      totalWickets: matches.reduce((sum, m) => sum + m.bowlingStats.wickets, 0),
      highestScore: Math.max(...matches.map((m) => m.totalPoints), 0),
    };
  };

  const renderOverviewTab = () => {
    if (!playerData) return null;

    const stats =
      selectedTournament === "all"
        ? playerData.overallStats
        : getTournamentStats();

    return (
      <div className="overview-content">
        <div className="stats-grid">
          {/* Total Points Card */}
          <div className="stat-card primary">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h3>Total Points</h3>
              <div className="stat-value">
                {selectedTournament === "all"
                  ? stats.totalPoints?.toFixed(1)
                  : stats.totalPoints.toFixed(1)}
              </div>
              <div className="stat-label">
                Across{" "}
                {selectedTournament === "all"
                  ? stats.totalMatchesPushed
                  : stats.totalMatches}{" "}
                matches
              </div>
            </div>
          </div>

          {/* Average Points Card */}
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Average Points</h3>
              <div className="stat-value">
                {selectedTournament === "all"
                  ? stats.averagePoints?.toFixed(1)
                  : stats.averagePoints.toFixed(1)}
              </div>
              <div className="stat-label">Per Match</div>
            </div>
          </div>

          {/* Highest Score Card */}
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>Highest Score</h3>
              <div className="stat-value">
                {selectedTournament === "all"
                  ? stats.highestScore
                  : stats.highestScore.toFixed(1)}
              </div>
              <div className="stat-label">Best Performance</div>
            </div>
          </div>

          {/* Batting Stats Card */}
          <div className="stat-card batting">
            <div className="stat-icon">🏏</div>
            <div className="stat-content">
              <h3>Batting</h3>
              <div className="stat-breakdown">
                <div className="breakdown-item">
                  <span className="label">Runs:</span>
                  <span className="value">{stats.totalRuns}</span>
                </div>
                {selectedTournament === "all" && (
                  <>
                    <div className="breakdown-item">
                      <span className="label">Average:</span>
                      <span className="value">
                        {stats.battingAverage?.toFixed(2)}
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span className="label">S/R:</span>
                      <span className="value">
                        {stats.battingStrikeRate?.toFixed(1)}
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span className="label">High Score:</span>
                      <span className="value">{stats.highestInnings}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bowling Stats Card */}
          <div className="stat-card bowling">
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>Bowling</h3>
              <div className="stat-breakdown">
                <div className="breakdown-item">
                  <span className="label">Wickets:</span>
                  <span className="value">{stats.totalWickets}</span>
                </div>
                {selectedTournament === "all" && (
                  <>
                    <div className="breakdown-item">
                      <span className="label">Average:</span>
                      <span className="value">
                        {stats.bowlingAverage?.toFixed(2)}
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span className="label">Economy:</span>
                      <span className="value">
                        {stats.bowlingEconomy?.toFixed(2)}
                      </span>
                    </div>
                    <div className="breakdown-item">
                      <span className="label">Best:</span>
                      <span className="value">{stats.bestBowling}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Fielding Stats Card */}
          <div className="stat-card fielding">
            <div className="stat-icon">🧤</div>
            <div className="stat-content">
              <h3>Fielding</h3>
              <div className="stat-breakdown">
                <div className="breakdown-item">
                  <span className="label">Catches:</span>
                  <span className="value">{stats.totalCatches}</span>
                </div>
                <div className="breakdown-item">
                  <span className="label">Run Outs:</span>
                  <span className="value">{stats.totalRunOuts}</span>
                </div>
                {selectedTournament === "all" && stats.totalStumpings > 0 && (
                  <div className="breakdown-item">
                    <span className="label">Stumpings:</span>
                    <span className="value">{stats.totalStumpings}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Form */}
        {selectedTournament === "all" && playerData.recentForm && (
          <div className="recent-form">
            <h3>📈 Recent Form (Last 5 Matches)</h3>
            <div className="form-list">
              {playerData.recentForm.map((match, idx) => (
                <div key={match.matchId} className="form-item">
                  <div className="match-number">#{idx + 1}</div>
                  <div className="match-details">
                    <div className="team-info">
                      {match.teamName} vs {match.opponent}
                    </div>
                    <div className="match-date">
                      {new Date(match.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="match-points">
                    <strong>{match.points.toFixed(1)}</strong> pts
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMatchesTab = () => {
    const matches = getFilteredMatches();

    return (
      <div className="matches-content">
        <div className="matches-header">
          <h3>
            {selectedTournament === "all"
              ? "All Matches"
              : "Tournament Matches"}
          </h3>
          <div className="matches-count">{matches.length} matches</div>
        </div>

        <div className="matches-list">
          {matches.map((match, idx) => (
            <div key={match.matchId} className="match-card">
              <div className="match-header-row">
                <div className="match-number">Match #{idx + 1}</div>
                <div className="match-date">
                  {new Date(match.matchDate).toLocaleDateString()}
                </div>
              </div>

              <div className="match-teams">
                <div className="team-badge">{match.teamName}</div>
                <span>vs</span>
                <div className="team-badge opponent">
                  {match.opponentTeamName}
                </div>
              </div>

              <div className="match-stats-grid">
                {/* Batting */}
                <div className="match-stat batting">
                  <div className="stat-label">🏏 Batting</div>
                  <div className="stat-value">
                    {match.battingStats.runs} ({match.battingStats.ballsFaced}b)
                  </div>
                  <div className="stat-detail">
                    {match.battingStats.fours}×4, {match.battingStats.sixes}×6
                  </div>
                </div>

                {/* Bowling */}
                <div className="match-stat bowling">
                  <div className="stat-label">⚡ Bowling</div>
                  <div className="stat-value">
                    {match.bowlingStats.wickets}W in {match.bowlingStats.overs}
                    ov
                  </div>
                  <div className="stat-detail">
                    {match.bowlingStats.runs} runs, {match.bowlingStats.maidens}
                    M
                  </div>
                </div>

                {/* Fielding */}
                <div className="match-stat fielding">
                  <div className="stat-label">🧤 Fielding</div>
                  <div className="stat-value">
                    {match.fieldingStats.catches}C /{" "}
                    {match.fieldingStats.runOuts}RO
                  </div>
                  {match.fieldingStats.stumpings > 0 && (
                    <div className="stat-detail">
                      {match.fieldingStats.stumpings} stumpings
                    </div>
                  )}
                </div>
              </div>

              {/* Points Breakdown */}
              <div className="match-points-section">
                <div className="points-row">
                  <span>Batting Points:</span>
                  <strong>
                    {match.categoryPoints.battingPoints.toFixed(1)}
                  </strong>
                </div>
                <div className="points-row">
                  <span>Bowling Points:</span>
                  <strong>
                    {match.categoryPoints.bowlingPoints.toFixed(1)}
                  </strong>
                </div>
                <div className="points-row">
                  <span>Fielding Points:</span>
                  <strong>
                    {match.categoryPoints.fieldingPoints.toFixed(1)}
                  </strong>
                </div>
                {match.categoryPoints.wicketKeepingPoints > 0 && (
                  <div className="points-row">
                    <span>WK Points:</span>
                    <strong>
                      {match.categoryPoints.wicketKeepingPoints.toFixed(1)}
                    </strong>
                  </div>
                )}
                <div className="points-row total">
                  <span>Total Points:</span>
                  <strong className="total-value">
                    {match.totalPoints.toFixed(1)}
                  </strong>
                </div>
              </div>

              <div className="match-status">
                <span className={`status-badge ${match.matchStatus}`}>
                  {match.matchStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="player-cumulative-stats-page">
      <div className="page-header">
        <h2>📊 Player Career Statistics</h2>

        <div className="controls">
          <input
            type="text"
            placeholder="Enter Player ID or UID"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            disabled={!!propPlayerId}
          />
          <button
            onClick={() => fetchPlayerStats()}
            disabled={!playerId || loading}
          >
            {loading ? "Loading..." : "Fetch Stats"}
          </button>
        </div>
        <div className="search-hint">
          💡 You can search using either Player ID (MongoDB ObjectId) or Player
          UID
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
        </div>
      )}

      {playerData && (
        <>
          {/* Player Header */}
          <div className="player-header-card">
            <div className="player-info">
              <h2>
                {playerData.player.playerName}
                {playerData.player.isWicketKeeper && (
                  <span className="badge-wk">WK</span>
                )}
              </h2>
              <div className="player-role">{playerData.player.playerRole}</div>
            </div>
          </div>

          {/* Tournament Filter */}
          <div className="tournament-filter">
            <label>Filter by Tournament:</label>
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
            >
              <option value="all">All Tournaments (Career Stats)</option>
              {getTournamentList().map((tournamentId) => (
                <option key={tournamentId} value={tournamentId}>
                  Tournament {tournamentId.substring(0, 8)}...
                </option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={activeTab === "overview" ? "active" : ""}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              className={activeTab === "matches" ? "active" : ""}
              onClick={() => setActiveTab("matches")}
            >
              Match History
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === "overview" && renderOverviewTab()}
            {activeTab === "matches" && renderMatchesTab()}
          </div>
        </>
      )}

      {!loading && !playerData && !error && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Player Data</h3>
          <p>
            Enter a player ID or UID to view career statistics and match
            history.
          </p>
          <div className="example-hint">
            <strong>Examples:</strong>
            <ul>
              <li>Player ID: 507f1f77bcf86cd799439011</li>
              <li>Player UID: FUNJXP9B0G</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerCumulativeStats;
