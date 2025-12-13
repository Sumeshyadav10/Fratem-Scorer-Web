import React, { useState } from "react";

/**
 * OverSummary Component
 * Displays ball-by-ball over summary for the current match
 * Shows both current over and previous overs history
 */
const OverSummary = ({ match, currentInnings = 1 }) => {
  const [showAllOvers, setShowAllOvers] = useState(false);
  const [expandedOver, setExpandedOver] = useState(null);

  if (!match) {
    return null;
  }

  // Get over summary data for current innings
  const getOverSummaryForInnings = () => {
    if (!match.overSummary || match.overSummary.length === 0) {
      return [];
    }

    // Filter overs for current innings and sort by over number
    return match.overSummary
      .filter((over) => over.innings === currentInnings)
      .sort((a, b) => b.overNumber - a.overNumber); // Most recent first
  };

  const overSummaryData = getOverSummaryForInnings();

  if (overSummaryData.length === 0) {
    return null;
  }

  // Get current over (most recent)
  const currentOver = overSummaryData[0];
  const previousOvers = overSummaryData.slice(1);

  // Helper to get ball display text
  const getBallDisplay = (ball) => {
    if (ball.isWicket) {
      return "W";
    }
    if (ball.extras) {
      // Show extras with runs (e.g., "Wd+1", "NB+2")
      const extrasShort = {
        wide: "Wd",
        "no-ball": "NB",
        bye: "B",
        "leg-bye": "LB",
      };
      const shortCode = extrasShort[ball.extras] || ball.extras;
      return ball.runs > 0 ? `${shortCode}+${ball.runs}` : shortCode;
    }
    return ball.runs.toString();
  };

  // Helper to get ball color
  const getBallColor = (ball) => {
    if (ball.isWicket) return "#dc3545"; // Red for wicket
    if (ball.extras) return "#fd7e14"; // Orange for extras
    if (ball.runs === 6) return "#6f42c1"; // Purple for six
    if (ball.runs === 4) return "#20c997"; // Teal for four
    if (ball.runs === 0) return "#6c757d"; // Gray for dot ball
    return "#28a745"; // Green for runs
  };

  // Toggle expanded over details
  const toggleOverExpansion = (overNumber) => {
    setExpandedOver(expandedOver === overNumber ? null : overNumber);
  };

  return (
    <div
      style={{
        marginTop: 20,
        padding: 15,
        background: "#f8f9fa",
        borderRadius: 8,
        border: "1px solid #dee2e6",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <h4 style={{ margin: 0, fontSize: 18, fontWeight: "bold" }}>
          📊 Over Summary
        </h4>
        {previousOvers.length > 0 && (
          <button
            onClick={() => setShowAllOvers(!showAllOvers)}
            style={{
              padding: "5px 12px",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {showAllOvers
              ? "Show Current Only"
              : `Show All (${overSummaryData.length})`}
          </button>
        )}
      </div>

      {/* Current Over */}
      <div
        style={{
          marginBottom: 15,
          padding: 12,
          background: "white",
          borderRadius: 6,
          border: "2px solid #007bff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <div>
            <span
              style={{
                fontWeight: "bold",
                fontSize: 16,
                color: "#007bff",
              }}
            >
              Current Over {currentOver.overNumber}
            </span>
            <span style={{ marginLeft: 10, color: "#6c757d", fontSize: 14 }}>
              {currentOver.bowler?.playerName || "Unknown Bowler"}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: "bold" }}>
            <span
              style={{ color: currentOver.wickets > 0 ? "#dc3545" : "#28a745" }}
            >
              {currentOver.runs}/{currentOver.wickets}
            </span>
            {currentOver.maidenOver && (
              <span
                style={{
                  marginLeft: 8,
                  padding: "2px 8px",
                  background: "#ffc107",
                  borderRadius: 3,
                  fontSize: 12,
                }}
              >
                M
              </span>
            )}
          </div>
        </div>

        {/* Ball-by-ball display */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {currentOver.balls &&
            currentOver.balls.map((ball, idx) => (
              <div
                key={idx}
                style={{
                  minWidth: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: getBallColor(ball),
                  color: "white",
                  borderRadius: 6,
                  fontWeight: "bold",
                  fontSize: 14,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
                title={ball.ballOutcome || ""}
              >
                {getBallDisplay(ball)}
              </div>
            ))}
          {/* Empty slots for remaining balls in over */}
          {currentOver.balls &&
            currentOver.balls.length < 6 &&
            Array(6 - currentOver.balls.length)
              .fill(0)
              .map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  style={{
                    minWidth: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#e9ecef",
                    color: "#adb5bd",
                    borderRadius: 6,
                    border: "2px dashed #ced4da",
                    fontSize: 12,
                  }}
                >
                  -
                </div>
              ))}
        </div>

        {/* Score at end of over */}
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            color: "#6c757d",
          }}
        >
          Score: {currentOver.runsAtEndOfOver}/{currentOver.wicketsAtEndOfOver}
        </div>
      </div>

      {/* Previous Overs - Collapsible */}
      {showAllOvers && previousOvers.length > 0 && (
        <div>
          <h5
            style={{
              fontSize: 14,
              fontWeight: "bold",
              marginBottom: 10,
              color: "#6c757d",
            }}
          >
            Previous Overs
          </h5>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {previousOvers.map((over, index) => (
              <div
                key={`${over.innings}-${over.overNumber}`}
                style={{
                  marginBottom: 10,
                  padding: 10,
                  background: "white",
                  borderRadius: 6,
                  border: "1px solid #dee2e6",
                  cursor: "pointer",
                }}
                onClick={() => toggleOverExpansion(over.overNumber)}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontSize: 14 }}>
                    <span style={{ fontWeight: "bold" }}>
                      Over {over.overNumber}
                    </span>
                    <span style={{ marginLeft: 8, color: "#6c757d" }}>
                      {over.bowler?.playerName || "Unknown"}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        color: over.wickets > 0 ? "#dc3545" : "#28a745",
                      }}
                    >
                      {over.runs}/{over.wickets}
                    </span>
                    {over.maidenOver && (
                      <span
                        style={{
                          padding: "2px 6px",
                          background: "#ffc107",
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      >
                        M
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: "#adb5bd" }}>
                      {expandedOver === over.overNumber ? "▲" : "▼"}
                    </span>
                  </div>
                </div>

                {/* Expanded ball details */}
                {expandedOver === over.overNumber && (
                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: "1px solid #dee2e6",
                    }}
                  >
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {over.balls &&
                        over.balls.map((ball, idx) => (
                          <div
                            key={idx}
                            style={{
                              minWidth: 36,
                              height: 36,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: getBallColor(ball),
                              color: "white",
                              borderRadius: 5,
                              fontWeight: "bold",
                              fontSize: 13,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            }}
                            title={ball.ballOutcome || ""}
                          >
                            {getBallDisplay(ball)}
                          </div>
                        ))}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "#6c757d",
                      }}
                    >
                      Score: {over.runsAtEndOfOver}/{over.wicketsAtEndOfOver}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          marginTop: 15,
          padding: 10,
          background: "#e9ecef",
          borderRadius: 5,
          fontSize: 12,
        }}
      >
        <strong>Legend:</strong>
        <div
          style={{
            display: "flex",
            gap: 15,
            flexWrap: "wrap",
            marginTop: 5,
          }}
        >
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#dc3545",
                borderRadius: 2,
                marginRight: 5,
              }}
            />
            Wicket
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#6f42c1",
                borderRadius: 2,
                marginRight: 5,
              }}
            />
            Six
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#20c997",
                borderRadius: 2,
                marginRight: 5,
              }}
            />
            Four
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#fd7e14",
                borderRadius: 2,
                marginRight: 5,
              }}
            />
            Extras
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#6c757d",
                borderRadius: 2,
                marginRight: 5,
              }}
            />
            Dot
          </span>
          <span>
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                background: "#28a745",
                borderRadius: 2,
                marginRight: 5,
              }}
            />
            Runs
          </span>
          <span
            style={{
              padding: "2px 6px",
              background: "#ffc107",
              borderRadius: 3,
              fontWeight: "bold",
            }}
          >
            M
          </span>
          <span style={{ marginLeft: -10 }}>Maiden</span>
        </div>
      </div>
    </div>
  );
};

export default OverSummary;
