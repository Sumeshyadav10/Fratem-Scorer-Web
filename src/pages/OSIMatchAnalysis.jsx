import React, { useState, useEffect, useMemo } from "react";
import API_BASE_URL from "../config/api";
import "./OSIMatchAnalysis.css";

const TEAMS = [
  { uid: "FTU0LJUYSW", name: "Chennai Champions" },
  { uid: "FTW0DNMJZ7", name: "Bangalore Blasters" },
  { uid: "FTSK2B3AQB", name: "Delhi Dynamites" },
  { uid: "FT0O12086U", name: "Mumbai Warriors" },
  { uid: "FTQSUE61FG", name: "Kolkata Knights" },
  { uid: "FTAUPD4STW", name: "Pune Patriots" },
  { uid: "FTGCU0AMN7", name: "Ahmedabad Avengers" },
  { uid: "FT30RVR1TC", name: "Gujarat Gladiators" },
];

const OSI_CATEGORIES = {
  ELITE: { min: 1.3, max: 1.5, color: "#4caf50", label: "Elite" },
  STRONG: { min: 1.15, max: 1.29, color: "#8bc34a", label: "Strong" },
  AVERAGE: { min: 0.9, max: 1.14, color: "#ff9800", label: "Average" },
  DEVELOPING: { min: 0.75, max: 0.89, color: "#ff5722", label: "Developing" },
  WEAK: { min: 0.5, max: 0.74, color: "#f44336", label: "Weak" },
};

const getOSICategory = (osi) => {
  const osiValue = parseFloat(osi);
  for (const cat of Object.values(OSI_CATEGORIES)) {
    if (osiValue >= cat.min && osiValue <= cat.max) {
      return cat;
    }
  }
  return OSI_CATEGORIES.AVERAGE;
};

// Summary Card Component
const SummaryCard = ({ label, value, subValue, icon }) => (
  <div className="summary-card">
    <div className="summary-icon">{icon}</div>
    <div className="summary-content">
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
      {subValue && <div className="summary-sub-value">{subValue}</div>}
    </div>
  </div>
);

// OSI Chart Component
const OSIChart = ({ progression }) => {
  const maxOSI = useMemo(
    () => Math.max(...progression.map((p) => parseFloat(p.osi)), 1.5),
    [progression],
  );

  return (
    <div className="osi-chart">
      <h3>📈 OSI Progression Chart</h3>
      <div className="chart-container">
        {progression.map((match, index) => {
          const height = (parseFloat(match.osi) / maxOSI) * 100;
          const category = getOSICategory(match.osi);

          return (
            <div key={index} className="chart-bar-wrapper">
              <div
                className="chart-bar"
                style={{
                  height: `${height * 2}px`,
                  background: `linear-gradient(180deg, ${category.color} 0%, ${category.color}dd 100%)`,
                }}
                title={`Match ${match.matchNumber}: OSI ${match.osi}\n${category.label}`}
              >
                <span className="bar-value">{match.osi}</span>
              </div>
              <div className="bar-label">M{match.matchNumber}</div>
              <div className={`match-result-badge ${match.result}`}>
                {match.result.toUpperCase()[0]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Strength Bar Component
const StrengthBar = ({ label, value, color }) => {
  const percentage = (parseFloat(value) / 1.5) * 100;

  return (
    <div className="strength-bar-wrapper">
      <div className="strength-label">{label}</div>
      <div className="bar-container">
        <div
          className="bar-fill"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
          }}
        >
          <span>{value}</span>
        </div>
      </div>
      <div className="strength-value">{value}</div>
    </div>
  );
};

// Stats Category Component
const StatsCategory = ({ title, stats, icon, color }) => (
  <div className="stat-category">
    <h5 style={{ color }}>
      {icon} {title}
    </h5>
    {Object.entries(stats).map(([key, value]) => (
      <div key={key} className="stat-row">
        <span className="stat-label">
          {key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())}
        </span>
        <span
          className={`stat-value ${key.includes("strength") ? "highlight" : ""}`}
        >
          {value}
        </span>
      </div>
    ))}
  </div>
);

// Match Card Component
const MatchCard = React.memo(({ match, matchNumber }) => {
  const [expanded, setExpanded] = useState(false);
  const category = getOSICategory(match.osiCalculation.currentOSI);

  return (
    <div className="match-card" style={{ borderLeftColor: category.color }}>
      <div className="match-header">
        <div className="match-number">M{matchNumber}</div>
        <div className="match-info">
          <h3>vs {match.opponent.name}</h3>
          <div className="tournament-info">🏆 {match.tournament.name}</div>
          <div className="match-date">
            📅{" "}
            {match.matchDate
              ? new Date(match.matchDate).toLocaleDateString()
              : "N/A"}
          </div>
        </div>
        <div className="match-result-section">
          <div className={`result-badge ${match.matchResult}`}>
            {match.matchResult.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="score-section">
        <div className="team-score">
          <div className="team-name">Your Team</div>
          <div className="score">{match.score.yourTeam}</div>
        </div>
        <div className="vs-text">VS</div>
        <div className="team-score">
          <div className="team-name">{match.opponent.name}</div>
          <div className="score">{match.score.opponent}</div>
        </div>
      </div>

      {match.osiCalculation.isBenchmarked && (
        <div className="transition-info">
          <h5>⚠️ {match.osiCalculation.transitionInfo.stage}</h5>
          <div className="transition-details">
            <span>
              <strong>Matches:</strong>{" "}
              {match.osiCalculation.transitionInfo.matchesPlayed}
            </span>
            <span>
              <strong>Benchmark Weight:</strong>{" "}
              {match.osiCalculation.transitionInfo.benchmarkWeight}%
            </span>
            <span>
              <strong>Performance Weight:</strong>{" "}
              {match.osiCalculation.transitionInfo.performanceWeight}%
            </span>
          </div>
        </div>
      )}

      <div className="osi-calculation-summary">
        <div className="osi-current">
          <div className="osi-value">{match.osiCalculation.currentOSI}</div>
          <div className="osi-category" style={{ background: category.color }}>
            {category.label}
          </div>
        </div>
        <div className="osi-change">
          <span className="change-label">Change:</span>
          <span
            className={`change-value ${
              match.osiEvolution.change.startsWith("+")
                ? "positive"
                : match.osiEvolution.change === "Initial"
                  ? "initial"
                  : "negative"
            }`}
          >
            {match.osiEvolution.change}
          </span>
        </div>
      </div>

      <button className="expand-button" onClick={() => setExpanded(!expanded)}>
        {expanded ? "▼ Hide Details" : "▶ Show Details"}
      </button>

      {expanded && (
        <>
          <div className="strength-bars-section">
            <h4>Strength Components</h4>
            <StrengthBar
              label="Batting Strength (BS)"
              value={match.osiCalculation.battingStrength}
              color="#667eea"
            />
            <StrengthBar
              label="Bowling Strength (BWS)"
              value={match.osiCalculation.bowlingStrength}
              color="#764ba2"
            />
            <StrengthBar
              label="Fielding Strength (FS)"
              value={match.osiCalculation.fieldingStrength}
              color="#f093fb"
            />
          </div>

          <div className="cumulative-stats-section">
            <h4>📊 Cumulative Stats After Match {matchNumber}</h4>
            <div className="stats-grid">
              <StatsCategory
                title="Batting"
                icon="🏏"
                color="#667eea"
                stats={{
                  runs: match.cumulativeStats.batting.runs,
                  outs: match.cumulativeStats.batting.outs,
                  ballsFaced: match.cumulativeStats.batting.ballsFaced,
                  average: match.cumulativeStats.batting.average,
                  strikeRate: match.cumulativeStats.batting.strikeRate,
                  strength: match.cumulativeStats.batting.strength,
                }}
              />
              <StatsCategory
                title="Bowling"
                icon="🎯"
                color="#764ba2"
                stats={{
                  wickets: match.cumulativeStats.bowling.wickets,
                  runsConceded: match.cumulativeStats.bowling.runsConceded,
                  ballsBowled: match.cumulativeStats.bowling.ballsBowled,
                  average: match.cumulativeStats.bowling.average,
                  economy: match.cumulativeStats.bowling.economy,
                  strength: match.cumulativeStats.bowling.strength,
                }}
              />
              <StatsCategory
                title="Fielding"
                icon="🥎"
                color="#f093fb"
                stats={{
                  catches: match.cumulativeStats.fielding.catches,
                  runOuts: match.cumulativeStats.fielding.runOuts,
                  stumpings: match.cumulativeStats.fielding.stumpings,
                  totalDismissals:
                    match.cumulativeStats.fielding.totalDismissals,
                  dismissalsPerMatch:
                    match.cumulativeStats.fielding.dismissalsPerMatch,
                  strength: match.cumulativeStats.fielding.strength,
                }}
              />
            </div>
          </div>

          <div className="calculation-steps">
            <h4>🎓 OSI Calculation Steps</h4>
            <div className="calc-step formula">
              Formula: OSI = (BS + BWS + FS) / 3
            </div>
            <div className="calc-step">
              Step 1: BS = {match.osiCalculation.battingStrength}
            </div>
            <div className="calc-step">
              Step 2: BWS = {match.osiCalculation.bowlingStrength}
            </div>
            <div className="calc-step">
              Step 3: FS = {match.osiCalculation.fieldingStrength}
            </div>
            <div className="calc-step">
              Step 4: Performance OSI = ({match.osiCalculation.battingStrength}{" "}
              + {match.osiCalculation.bowlingStrength} +{" "}
              {match.osiCalculation.fieldingStrength}) / 3 ={" "}
              {match.osiCalculation.performanceOSI}
            </div>
            {match.osiCalculation.isBenchmarked &&
              match.osiCalculation.transitionInfo.performanceOSI && (
                <div className="calc-step">
                  Step 5: Apply Benchmarking = (0.8 ×{" "}
                  {match.osiCalculation.transitionInfo.benchmarkWeight}%) +(
                  {match.osiCalculation.performanceOSI} ×{" "}
                  {match.osiCalculation.transitionInfo.performanceWeight}%)
                </div>
              )}
            <div className="calc-step result">
              Final OSI = {match.osiCalculation.currentOSI}
            </div>
          </div>
        </>
      )}
    </div>
  );
});

MatchCard.displayName = "MatchCard";

// Main Component
const OSIMatchAnalysis = () => {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const fetchTeamAnalysis = async (teamUID) => {
    if (!teamUID) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/osi-analysis/team/${teamUID}/match-by-match`,
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "Failed to load analysis");
      }
    } catch (err) {
      console.error("Error loading analysis:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamAnalysis(selectedTeam);
    }
  }, [selectedTeam]);

  const handleTeamChange = (e) => {
    setSelectedTeam(e.target.value);
    setData(null);
  };

  return (
    <div className="osi-match-analysis">
      <div className="header">
        <h1>🏏 Match-by-Match OSI Analysis</h1>
        <p>
          Detailed progression of Opposition Strength Index across all matches
        </p>
      </div>

      <div className="team-selector">
        <h3>Select Team to Analyze</h3>
        <select value={selectedTeam} onChange={handleTeamChange}>
          <option value="">-- Select a Team --</option>
          {TEAMS.map((team) => (
            <option key={team.uid} value={team.uid}>
              {team.name} - {team.uid}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="loading">⏳ Loading match-by-match analysis...</div>
      )}

      {error && <div className="error">{error}</div>}

      {data && !loading && (
        <div className="content">
          {/* Summary Section */}
          <div className="summary-section">
            <h3>📊 Overall Summary</h3>
            <div className="summary-grid">
              <SummaryCard
                icon="🎯"
                label="Total Matches"
                value={data.summary.totalMatches}
              />
              <SummaryCard
                icon="📈"
                label="Current OSI"
                value={data.summary.currentOSI}
                subValue={data.summary.currentCategory}
              />
              <SummaryCard
                icon="📊"
                label="OSI Change"
                value={
                  (data.summary.osiChange >= 0 ? "+" : "") +
                  data.summary.osiChange
                }
                subValue={data.summary.transitionStage}
              />
              <SummaryCard
                icon="🎬"
                label="Initial OSI"
                value={data.summary.initialOSI}
                subValue="Starting Point"
              />
            </div>
          </div>

          {/* OSI Progression Chart */}
          <OSIChart progression={data.osiProgression} />

          {/* Formula Reference */}
          <div className="formula-reference">
            <h4>📐 OSI Calculation Formulas</h4>
            <div className="formula-item">
              <strong>OSI =</strong> (Batting Strength + Bowling Strength +
              Fielding Strength) / 3
            </div>
            <div className="formula-item">
              <strong>Batting Strength =</strong> (Batting Avg / 25 × 0.6) +
              (Strike Rate / 100 × 0.4)
            </div>
            <div className="formula-item">
              <strong>Bowling Strength =</strong> (25 / Bowling Avg × 0.6) + (6
              / Economy × 0.4)
            </div>
            <div className="formula-item">
              <strong>Fielding Strength =</strong> (Total Dismissals / Matches)
              / 5
            </div>
            <div className="formula-item benchmark">
              <strong>Benchmarking:</strong> Matches 0-2: OSI = 0.8 | Matches
              3-5: Blended | Matches 6+: Performance-Based
            </div>
          </div>

          {/* Match Timeline */}
          <div className="matches-timeline">
            <h3>⏱️ Match-by-Match Timeline</h3>
            {data.matchByMatchDetails.map((match, index) => (
              <MatchCard
                key={index}
                match={match}
                matchNumber={match.matchNumber}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OSIMatchAnalysis;
