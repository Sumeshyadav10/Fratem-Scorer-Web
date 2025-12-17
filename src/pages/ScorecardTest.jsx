import React, { useState } from "react";
import MatchScorecard from "../components/MatchScorecard";
import "./ScorecardTest.css";
import API_BASE_URL from "../config/api";

/**
 * Scorecard Test Page
 * Allows testing the match scorecard component with different match IDs
 */

const ScorecardTest = ({ matchId: propMatchId }) => {
  const [matchId, setMatchId] = useState(propMatchId || "");
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);
  const [showConfig, setShowConfig] = useState(false);

  // Update matchId when prop changes
  React.useEffect(() => {
    if (propMatchId) {
      setMatchId(propMatchId);
    }
  }, [propMatchId]);

  // Sample match IDs for quick testing
  const sampleMatches = [
    {
      id: "MATCH-1764586886416-bdlq6sc4y",
      label: "Live Match (Delhi vs Mumbai)",
      description: "Current live match with batting stats",
    },
    {
      id: "GENERATE_NEW",
      label: "🎯 Generate New Test Match",
      description: "Create a new complete match with full statistics",
    },
  ];

  const handleMatchSelect = (selectedMatchId) => {
    if (selectedMatchId === "GENERATE_NEW") {
      // Show instructions for generating new match
      alert(
        "To generate a new test match:\n\n1. Open terminal in your backend folder\n2. Run: node generate-test-data.js generate-new\n3. Copy the new match ID from the output\n4. Paste it in the Match ID field above"
      );
      return;
    }
    setMatchId(selectedMatchId);
  };

  const isValidMatchId = (id) => {
    return id && id.trim().length > 0;
  };

  return (
    <div className="scorecard-test">
      {/* Configuration Panel */}
      <div className={`config-panel ${showConfig ? "expanded" : ""}`}>
        <button
          className="config-toggle"
          onClick={() => setShowConfig(!showConfig)}
        >
          ⚙️ {showConfig ? "Hide" : "Show"} Configuration
        </button>

        {showConfig && (
          <div className="config-content">
            <h3>🏏 Match Scorecard Tester</h3>

            {/* API Configuration */}
            <div className="config-section">
              <label htmlFor="api-url">API Base URL:</label>
              <input
                id="api-url"
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder={API_BASE_URL}
                className="config-input"
              />
            </div>

            {/* Match ID Input */}
            <div className="config-section">
              <label htmlFor="match-id">Match ID:</label>
              <input
                id="match-id"
                type="text"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="Enter match ID"
                className="config-input"
              />
            </div>

            {/* Quick Match Selection */}
            <div className="config-section">
              <label>Quick Select:</label>
              <div className="sample-matches">
                {sampleMatches.map((match) => (
                  <div key={match.id} className="sample-match">
                    <button
                      onClick={() => handleMatchSelect(match.id)}
                      className={`sample-match-btn ${
                        matchId === match.id ? "active" : ""
                      }`}
                    >
                      {match.label}
                    </button>
                    <small className="sample-match-desc">
                      {match.description}
                    </small>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Actions */}
            <div className="config-section">
              <div className="test-actions">
                <button
                  className="test-btn api-test"
                  onClick={() => {
                    const testUrl = `${apiUrl}/health`;
                    fetch(testUrl)
                      .then((response) => response.json())
                      .then((data) =>
                        alert(`API Status: ${data.status || "Unknown"}`)
                      )
                      .catch((err) => alert(`API Error: ${err.message}`));
                  }}
                >
                  🔍 Test API Connection
                </button>

                <button
                  className="test-btn match-test"
                  onClick={() => {
                    if (isValidMatchId(matchId)) {
                      const testUrl = `${apiUrl}/api/match-summary/${matchId}`;
                      fetch(testUrl)
                        .then((response) => response.json())
                        .then((data) => {
                          if (data.success) {
                            alert(
                              `Match found: ${data.data.teams.team1.teamName} vs ${data.data.teams.team2.teamName}`
                            );
                          } else {
                            alert(`Match not found: ${data.message}`);
                          }
                        })
                        .catch((err) => alert(`Match Error: ${err.message}`));
                    } else {
                      alert("Please enter a valid match ID");
                    }
                  }}
                  disabled={!isValidMatchId(matchId)}
                >
                  🎯 Test Match Data
                </button>
              </div>
            </div>

            {/* Current Configuration Display */}
            <div className="config-section current-config">
              <h4>Current Configuration:</h4>
              <div className="config-display">
                <div>
                  <strong>API URL:</strong> {apiUrl}
                </div>
                <div>
                  <strong>Match ID:</strong> {matchId || "Not set"}
                </div>
                <div>
                  <strong>Status:</strong>
                  <span
                    className={`status ${
                      isValidMatchId(matchId) ? "valid" : "invalid"
                    }`}
                  >
                    {isValidMatchId(matchId) ? "✅ Valid" : "❌ Invalid"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Scorecard Display */}
      <div className="scorecard-container">
        {isValidMatchId(matchId) ? (
          <MatchScorecard
            matchId={matchId}
            apiBaseUrl={apiUrl}
            key={`${matchId}-${apiUrl}`} // Force re-render on config change
          />
        ) : (
          <div className="no-match">
            <div className="no-match-content">
              <h2>🏏 Match Scorecard Tester</h2>
              <p>
                {propMatchId
                  ? "Loading match scorecard..."
                  : "Please create or select a match to view the scorecard"}
              </p>
              {!propMatchId && (
                <button
                  className="config-prompt"
                  onClick={() => setShowConfig(true)}
                >
                  ⚙️ Configure Match Settings
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Developer Notes */}
      <div className="dev-notes">
        <details>
          <summary>📋 Developer Notes & API Endpoints</summary>
          <div className="notes-content">
            <h4>Available API Endpoints:</h4>
            <ul className="endpoint-list">
              <li>
                <code>
                  GET {apiUrl}/api/match-summary/{"{matchId}"}
                </code>
                <span>Complete match summary</span>
              </li>
              <li>
                <code>
                  GET {apiUrl}/api/match-summary/{"{matchId}"}/statistics
                </code>
                <span>Match statistics and top performers</span>
              </li>
              <li>
                <code>
                  GET {apiUrl}/api/match-summary/{"{matchId}"}/innings/1
                </code>
                <span>First innings details</span>
              </li>
              <li>
                <code>
                  GET {apiUrl}/api/match-summary/{"{matchId}"}/innings/2
                </code>
                <span>Second innings details</span>
              </li>
            </ul>

            <h4>Testing Tips:</h4>
            <ul className="tips-list">
              <li>
                Use the "Test API Connection" button to verify server status
              </li>
              <li>Use "Test Match Data" to check if match ID exists</li>
              <li>
                The scorecard component automatically refreshes every 30 seconds
                for live matches
              </li>
              <li>Check browser console for detailed error messages</li>
              <li>Use network tab to debug API calls</li>
            </ul>

            <h4>Sample Test Data Commands:</h4>
            <div className="code-block">
              <code>
                # Generate test matches
                <br />
                node generate-test-data.js generate 3<br />
                <br />
                # Update existing match with stats
                <br />
                node generate-test-data.js update-existing
                <br />
                <br />
                # Run API tests
                <br />
                node test-match-summary.js
              </code>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default ScorecardTest;
