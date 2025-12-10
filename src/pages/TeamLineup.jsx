import { useState, useEffect } from "react";
import API_BASE_URL from "../config/api";

const TeamLineup = ({ matchId, token, onLineupSet, onBack }) => {
  const [match, setMatch] = useState(null);
  const [team1PlayingXI, setTeam1PlayingXI] = useState([]);
  const [team2PlayingXI, setTeam2PlayingXI] = useState([]);
  const [team1Captain, setTeam1Captain] = useState(null);
  const [team1WicketKeeper, setTeam1WicketKeeper] = useState(null);
  const [team2Captain, setTeam2Captain] = useState(null);
  const [team2WicketKeeper, setTeam2WicketKeeper] = useState(null);
  const [status, setStatus] = useState("Loading...");
  const [currentStriker, setCurrentStriker] = useState(null);
  const [currentNonStriker, setCurrentNonStriker] = useState(null);
  const [currentBowler, setCurrentBowler] = useState(null);

  useEffect(() => {
    console.log("🔍 TeamLineup.jsx - Received props:", {
      matchId,
      token,
      hasMatchId: !!matchId,
    });
    console.log("🔍 TeamLineup.jsx - matchId type:", typeof matchId);
    console.log("🔍 TeamLineup.jsx - matchId value:", matchId);

    if (matchId && token) {
      fetchMatchDetails();
    }
  }, [matchId, token]);

  const fetchMatchDetails = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch match details");
      }

      const data = await response.json();
      setMatch(data.data.match);

      console.log("Full match data:", data.data.match);
      console.log("Team 1 data:", data.data.match.teams.team1);
      console.log("Team 2 data:", data.data.match.teams.team2);

      // Use all players from teams as available players (since this is direct match creation)
      const team1AllPlayers = data.data.match.teams.team1.players || [];
      const team2AllPlayers = data.data.match.teams.team2.players || [];

      console.log("Team 1 all players:", team1AllPlayers);
      console.log("Team 2 all players:", team2AllPlayers);

      // Set initial playing XI (first 11 players from all available players)
      setTeam1PlayingXI(team1AllPlayers.slice(0, 11));
      setTeam2PlayingXI(team2AllPlayers.slice(0, 11));

      // Set captains and wicket keepers if available
      if (data.data.match.teams.team1.captain) {
        setTeam1Captain(data.data.match.teams.team1.captain);
      }
      if (data.data.match.teams.team1.wicketKeeper) {
        setTeam1WicketKeeper(data.data.match.teams.team1.wicketKeeper);
      }
      if (data.data.match.teams.team2.captain) {
        setTeam2Captain(data.data.match.teams.team2.captain);
      }
      if (data.data.match.teams.team2.wicketKeeper) {
        setTeam2WicketKeeper(data.data.match.teams.team2.wicketKeeper);
      }

      setStatus("Team lineups loaded");
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const togglePlayerInXI = (teamId, player) => {
    if (teamId === 1) {
      setTeam1PlayingXI((prev) => {
        const isInXI = prev.find((p) => p.playerId === player.playerId);
        if (isInXI) {
          return prev.filter((p) => p.playerId !== player.playerId);
        } else if (prev.length < 11) {
          return [...prev, player];
        } else {
          alert("Maximum 11 players allowed in playing XI");
          return prev;
        }
      });
    } else {
      setTeam2PlayingXI((prev) => {
        const isInXI = prev.find((p) => p.playerId === player.playerId);
        if (isInXI) {
          return prev.filter((p) => p.playerId !== player.playerId);
        } else if (prev.length < 11) {
          return [...prev, player];
        } else {
          alert("Maximum 11 players allowed in playing XI");
          return prev;
        }
      });
    }
  };

  const updateCurrentPlayers = async () => {
    if (!currentStriker || !currentNonStriker || !currentBowler) {
      alert("Please select striker, non-striker and bowler");
      return;
    }

    try {
      setStatus("Updating current players...");

      const updateData = {
        currentBatsmen: {
          striker: currentStriker,
          nonStriker: currentNonStriker,
        },
        currentBowler: currentBowler,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}/current-players`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update current players");
      }

      setStatus("Current players updated successfully!");
      onLineupSet && onLineupSet();
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const saveLineups = async () => {
    try {
      setStatus("Saving lineups...");

      // Update team 1 lineup
      if (team1PlayingXI.length === 11) {
        const team1LineupData = {
          teamId: match.teams.team1.teamId,
          battingOrder: team1PlayingXI.map((player, index) => ({
            playerId: player.playerId,
            playerName: player.playerName,
            position: index + 1,
          })),
          bowlingOrder: team1PlayingXI.slice(0, 5).map((player, index) => ({
            playerId: player.playerId,
            playerName: player.playerName,
            position: index + 1,
          })),
        };

        // Add captain if selected
        if (team1Captain) {
          team1LineupData.captain = {
            playerId: team1Captain.playerId || team1Captain,
            playerName:
              team1Captain.playerName ||
              team1PlayingXI.find((p) => p.playerId === team1Captain)
                ?.playerName,
          };
        } else {
          // Default to first player as captain
          team1LineupData.captain = {
            playerId: team1PlayingXI[0].playerId,
            playerName: team1PlayingXI[0].playerName,
          };
        }

        // Add wicketKeeper if selected
        if (team1WicketKeeper) {
          team1LineupData.wicketKeeper = {
            playerId: team1WicketKeeper.playerId || team1WicketKeeper,
            playerName:
              team1WicketKeeper.playerName ||
              team1PlayingXI.find((p) => p.playerId === team1WicketKeeper)
                ?.playerName,
          };
        }

        console.log("Saving team 1 lineup:", team1LineupData);

        const team1Response = await fetch(
          `${API_BASE_URL}/api/live-matches/${matchId}/lineup`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(team1LineupData),
          }
        );

        if (!team1Response.ok) {
          const errorData = await team1Response.json();
          throw new Error(
            `Team 1 lineup save failed: ${errorData.message || "Unknown error"}`
          );
        }
      }

      // Update team 2 lineup
      if (team2PlayingXI.length === 11) {
        const team2LineupData = {
          teamId: match.teams.team2.teamId,
          battingOrder: team2PlayingXI.map((player, index) => ({
            playerId: player.playerId,
            playerName: player.playerName,
            position: index + 1,
          })),
          bowlingOrder: team2PlayingXI.slice(0, 5).map((player, index) => ({
            playerId: player.playerId,
            playerName: player.playerName,
            position: index + 1,
          })),
        };

        // Add captain if selected
        if (team2Captain) {
          team2LineupData.captain = {
            playerId: team2Captain.playerId || team2Captain,
            playerName:
              team2Captain.playerName ||
              team2PlayingXI.find((p) => p.playerId === team2Captain)
                ?.playerName,
          };
        } else {
          // Default to first player as captain
          team2LineupData.captain = {
            playerId: team2PlayingXI[0].playerId,
            playerName: team2PlayingXI[0].playerName,
          };
        }

        // Add wicketKeeper if selected
        if (team2WicketKeeper) {
          team2LineupData.wicketKeeper = {
            playerId: team2WicketKeeper.playerId || team2WicketKeeper,
            playerName:
              team2WicketKeeper.playerName ||
              team2PlayingXI.find((p) => p.playerId === team2WicketKeeper)
                ?.playerName,
          };
        }

        console.log("Saving team 2 lineup:", team2LineupData);

        const team2Response = await fetch(
          `${API_BASE_URL}/api/live-matches/${matchId}/lineup`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(team2LineupData),
          }
        );

        if (!team2Response.ok) {
          const errorData = await team2Response.json();
          throw new Error(
            `Team 2 lineup save failed: ${errorData.message || "Unknown error"}`
          );
        }
      }

      setStatus("Lineups saved successfully!");
    } catch (error) {
      console.error("Error saving lineups:", error);
      setStatus(`Error saving lineups: ${error.message}`);
    }
  };

  const getBattingTeamPlayers = () => {
    if (!match?.currentState?.battingTeam) return [];

    const battingTeamId = match.currentState.battingTeam.teamId;
    if (battingTeamId === match.teams.team1.teamId) {
      return team1PlayingXI;
    } else {
      return team2PlayingXI;
    }
  };

  const getBowlingTeamPlayers = () => {
    if (!match?.currentState?.bowlingTeam) return [];

    const bowlingTeamId = match.currentState.bowlingTeam.teamId;
    if (bowlingTeamId === match.teams.team1.teamId) {
      return team1PlayingXI;
    } else {
      return team2PlayingXI;
    }
  };

  if (!match) {
    return (
      <div style={{ padding: 20 }}>
        <h3>Team Lineup Management</h3>
        <p>Status: {status}</p>
      </div>
    );
  }

  const battingTeamPlayers = getBattingTeamPlayers();
  const bowlingTeamPlayers = getBowlingTeamPlayers();

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3>🏏 Team Lineup Management</h3>
        <button
          onClick={onBack}
          style={{
            padding: "8px 16px",
            background: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: 4,
          }}
        >
          Back
        </button>
      </div>

      <div
        style={{
          marginBottom: 20,
          padding: 15,
          background: "#e9ecef",
          borderRadius: 5,
        }}
      >
        <h4>
          {match.teams.team1.teamName} vs {match.teams.team2.teamName}
        </h4>
        <p>
          <strong>Status:</strong> {status}
        </p>
        <p>
          <strong>Match Status:</strong>{" "}
          {match.currentState?.status || "not-started"}
        </p>
      </div>

      {/* Team Lineups */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 30,
        }}
      >
        {/* Team 1 */}
        <div style={{ border: "1px solid #ddd", borderRadius: 5, padding: 15 }}>
          <h4>
            {match.teams.team1.teamName} Playing XI ({team1PlayingXI.length}/11)
          </h4>

          <div style={{ marginBottom: 15 }}>
            <h5>All Available Players (Click to add/remove from XI)</h5>
            <p style={{ fontSize: 12, color: "#666" }}>
              Debug: Found {(match.teams.team1.players || []).length} available
              players
            </p>
            <div
              style={{
                maxHeight: 200,
                overflowY: "auto",
                border: "1px solid #eee",
                padding: 10,
              }}
            >
              {(match.teams.team1.players || []).length === 0 ? (
                <p style={{ color: "#dc3545", fontStyle: "italic" }}>
                  No players found for this team
                </p>
              ) : (
                (match.teams.team1.players || []).map((player) => {
                  const isInXI = team1PlayingXI.find(
                    (p) => p.playerId === player.playerId
                  );
                  return (
                    <div
                      key={player.playerId}
                      onClick={() => togglePlayerInXI(1, player)}
                      style={{
                        padding: "5px 10px",
                        margin: "2px 0",
                        background: isInXI ? "#d4edda" : "#f8f9fa",
                        border: isInXI ? "2px solid #28a745" : "1px solid #ddd",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      {isInXI ? "✅" : "➕"} {player.playerName}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <h5>Playing XI</h5>
            <p style={{ fontSize: 12, color: "#666" }}>
              Debug: Playing XI has {team1PlayingXI.length} players
            </p>
            {team1PlayingXI.length === 0 ? (
              <p style={{ color: "#dc3545", fontStyle: "italic" }}>
                No players in Playing XI yet
              </p>
            ) : (
              team1PlayingXI.map((player, index) => (
                <div
                  key={player.playerId}
                  style={{ padding: "5px 0", borderBottom: "1px solid #eee" }}
                >
                  {index + 1}. {player.playerName}
                </div>
              ))
            )}
          </div>

          {/* Captain and Wicket Keeper Selection */}
          {team1PlayingXI.length > 0 && (
            <div style={{ marginTop: 15 }}>
              <h5>Team Roles</h5>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <label
                    style={{ display: "block", marginBottom: 5, fontSize: 12 }}
                  >
                    Captain
                  </label>
                  <select
                    value={team1Captain?.playerId || ""}
                    onChange={(e) => {
                      const player = team1PlayingXI.find(
                        (p) => p.playerId === e.target.value
                      );
                      setTeam1Captain(
                        player
                          ? {
                              playerId: player.playerId,
                              playerName: player.playerName,
                            }
                          : null
                      );
                    }}
                    style={{ width: "100%", padding: 5, fontSize: 12 }}
                  >
                    <option value="">Select Captain</option>
                    {team1PlayingXI.map((player) => (
                      <option key={player.playerId} value={player.playerId}>
                        {player.playerName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{ display: "block", marginBottom: 5, fontSize: 12 }}
                  >
                    Wicket Keeper
                  </label>
                  <select
                    value={team1WicketKeeper?.playerId || ""}
                    onChange={(e) => {
                      const player = team1PlayingXI.find(
                        (p) => p.playerId === e.target.value
                      );
                      setTeam1WicketKeeper(
                        player
                          ? {
                              playerId: player.playerId,
                              playerName: player.playerName,
                            }
                          : null
                      );
                    }}
                    style={{ width: "100%", padding: 5, fontSize: 12 }}
                  >
                    <option value="">Select Wicket Keeper</option>
                    {team1PlayingXI.map((player) => (
                      <option key={player.playerId} value={player.playerId}>
                        {player.playerName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div style={{ border: "1px solid #ddd", borderRadius: 5, padding: 15 }}>
          <h4>
            {match.teams.team2.teamName} Playing XI ({team2PlayingXI.length}/11)
          </h4>

          <div style={{ marginBottom: 15 }}>
            <h5>All Available Players (Click to add/remove from XI)</h5>
            <p style={{ fontSize: 12, color: "#666" }}>
              Debug: Found {(match.teams.team2.players || []).length} available
              players
            </p>
            <div
              style={{
                maxHeight: 200,
                overflowY: "auto",
                border: "1px solid #eee",
                padding: 10,
              }}
            >
              {(match.teams.team2.players || []).length === 0 ? (
                <p style={{ color: "#dc3545", fontStyle: "italic" }}>
                  No players found for this team
                </p>
              ) : (
                (match.teams.team2.players || []).map((player) => {
                  const isInXI = team2PlayingXI.find(
                    (p) => p.playerId === player.playerId
                  );
                  return (
                    <div
                      key={player.playerId}
                      onClick={() => togglePlayerInXI(2, player)}
                      style={{
                        padding: "5px 10px",
                        margin: "2px 0",
                        background: isInXI ? "#d4edda" : "#f8f9fa",
                        border: isInXI ? "2px solid #28a745" : "1px solid #ddd",
                        borderRadius: 3,
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                    >
                      {isInXI ? "✅" : "➕"} {player.playerName}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <h5>Playing XI</h5>
            <p style={{ fontSize: 12, color: "#666" }}>
              Debug: Playing XI has {team2PlayingXI.length} players
            </p>
            {team2PlayingXI.length === 0 ? (
              <p style={{ color: "#dc3545", fontStyle: "italic" }}>
                No players in Playing XI yet
              </p>
            ) : (
              team2PlayingXI.map((player, index) => (
                <div
                  key={player.playerId}
                  style={{ padding: "5px 0", borderBottom: "1px solid #eee" }}
                >
                  {index + 1}. {player.playerName}
                </div>
              ))
            )}
          </div>

          {/* Captain and Wicket Keeper Selection */}
          {team2PlayingXI.length > 0 && (
            <div style={{ marginTop: 15 }}>
              <h5>Team Roles</h5>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <label
                    style={{ display: "block", marginBottom: 5, fontSize: 12 }}
                  >
                    Captain
                  </label>
                  <select
                    value={team2Captain?.playerId || ""}
                    onChange={(e) => {
                      const player = team2PlayingXI.find(
                        (p) => p.playerId === e.target.value
                      );
                      setTeam2Captain(
                        player
                          ? {
                              playerId: player.playerId,
                              playerName: player.playerName,
                            }
                          : null
                      );
                    }}
                    style={{ width: "100%", padding: 5, fontSize: 12 }}
                  >
                    <option value="">Select Captain</option>
                    {team2PlayingXI.map((player) => (
                      <option key={player.playerId} value={player.playerId}>
                        {player.playerName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{ display: "block", marginBottom: 5, fontSize: 12 }}
                  >
                    Wicket Keeper
                  </label>
                  <select
                    value={team2WicketKeeper?.playerId || ""}
                    onChange={(e) => {
                      const player = team2PlayingXI.find(
                        (p) => p.playerId === e.target.value
                      );
                      setTeam2WicketKeeper(
                        player
                          ? {
                              playerId: player.playerId,
                              playerName: player.playerName,
                            }
                          : null
                      );
                    }}
                    style={{ width: "100%", padding: 5, fontSize: 12 }}
                  >
                    <option value="">Select Wicket Keeper</option>
                    {team2PlayingXI.map((player) => (
                      <option key={player.playerId} value={player.playerId}>
                        {player.playerName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Players Selection */}
      {match.currentState?.status === "in-progress" && (
        <div
          style={{
            marginBottom: 20,
            padding: 15,
            background: "#fff3cd",
            borderRadius: 5,
          }}
        >
          <h4>🎯 Current Players on Field</h4>
          <p>
            <strong>Batting Team:</strong>{" "}
            {match.currentState.battingTeam?.teamName}
          </p>
          <p>
            <strong>Bowling Team:</strong>{" "}
            {match.currentState.bowlingTeam?.teamName}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 15,
              marginTop: 15,
            }}
          >
            {/* Striker */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 5,
                  fontWeight: "bold",
                }}
              >
                Striker
              </label>
              <select
                value={currentStriker?.playerId || ""}
                onChange={(e) => {
                  const player = battingTeamPlayers.find(
                    (p) => p.playerId === e.target.value
                  );
                  setCurrentStriker(
                    player
                      ? {
                          playerId: player.playerId,
                          playerName: player.playerName,
                        }
                      : null
                  );
                }}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select Striker</option>
                {battingTeamPlayers.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-Striker */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 5,
                  fontWeight: "bold",
                }}
              >
                Non-Striker
              </label>
              <select
                value={currentNonStriker?.playerId || ""}
                onChange={(e) => {
                  const player = battingTeamPlayers.find(
                    (p) => p.playerId === e.target.value
                  );
                  setCurrentNonStriker(
                    player
                      ? {
                          playerId: player.playerId,
                          playerName: player.playerName,
                        }
                      : null
                  );
                }}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select Non-Striker</option>
                {battingTeamPlayers.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                  </option>
                ))}
              </select>
            </div>

            {/* Bowler */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 5,
                  fontWeight: "bold",
                }}
              >
                Current Bowler
              </label>
              <select
                value={currentBowler?.playerId || ""}
                onChange={(e) => {
                  const player = bowlingTeamPlayers.find(
                    (p) => p.playerId === e.target.value
                  );
                  setCurrentBowler(
                    player
                      ? {
                          playerId: player.playerId,
                          playerName: player.playerName,
                        }
                      : null
                  );
                }}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                }}
              >
                <option value="">Select Bowler</option>
                {bowlingTeamPlayers.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={updateCurrentPlayers}
            disabled={!currentStriker || !currentNonStriker || !currentBowler}
            style={{
              marginTop: 15,
              padding: "12px 24px",
              background:
                currentStriker && currentNonStriker && currentBowler
                  ? "#28a745"
                  : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor:
                currentStriker && currentNonStriker && currentBowler
                  ? "pointer"
                  : "not-allowed",
              fontWeight: "bold",
            }}
          >
            🎯 Set Current Players
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 15 }}>
        <button
          onClick={saveLineups}
          disabled={
            team1PlayingXI.length !== 11 || team2PlayingXI.length !== 11
          }
          style={{
            padding: "12px 24px",
            background:
              team1PlayingXI.length === 11 && team2PlayingXI.length === 11
                ? "#007bff"
                : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor:
              team1PlayingXI.length === 11 && team2PlayingXI.length === 11
                ? "pointer"
                : "not-allowed",
            fontWeight: "bold",
          }}
        >
          💾 Save Lineups
        </button>

        {onLineupSet && (
          <button
            onClick={onLineupSet}
            style={{
              padding: "12px 24px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ✅ Continue to Scoring
          </button>
        )}
      </div>
    </div>
  );
};

export default TeamLineup;
