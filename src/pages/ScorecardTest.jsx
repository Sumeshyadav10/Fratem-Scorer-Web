import React, { useState } from "react";
import MatchScorecard from "../components/MatchScorecard";
import "./ScorecardTest.css";
import API_BASE_URL from "../config/api";

/**
 * Scorecard Test Page
 * Allows testing the match scorecard component with different match IDs
 */

const ScorecardTest = ({ matchId: propMatchId }) => {
  const [matchId, setMatchId] = useState(propMatchId?.trim() || "");
  const [apiUrl, setApiUrl] = useState(API_BASE_URL);

  // Update matchId when prop changes
  React.useEffect(() => {
    if (propMatchId) {
      setMatchId(propMatchId.trim());
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
              {!propMatchId && null}
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
