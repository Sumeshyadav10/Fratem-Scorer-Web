import { useState, useEffect } from "react";
import API_BASE_URL from "../config/api";

const LineupSelection = ({ match, token, onComplete }) => {
  const [team1Selected, setTeam1Selected] = useState([]);
  const [team2Selected, setTeam2Selected] = useState([]);
  const [team1Captain, setTeam1Captain] = useState("");
  const [team2Captain, setTeam2Captain] = useState("");
  const [team1Keeper, setTeam1Keeper] = useState("");
  const [team2Keeper, setTeam2Keeper] = useState("");
  const [currentTeam, setCurrentTeam] = useState(1);
  const [status, setStatus] = useState("");

  const playersPerTeam = match.playersPerTeam || 11;
  const team1 = match.teams.team1;
  const team2 = match.teams.team2;

  useEffect(() => {
    // Don't auto-populate selected players - let users freely select
    // Only pre-populate captain and keeper if already set
    if (team1.captain?.playerId) {
      setTeam1Captain(team1.captain.playerId);
    }
    if (team2.captain?.playerId) {
      setTeam2Captain(team2.captain.playerId);
    }
    if (team1.wicketKeeper?.playerId) {
      setTeam1Keeper(team1.wicketKeeper.playerId);
    }
    if (team2.wicketKeeper?.playerId) {
      setTeam2Keeper(team2.wicketKeeper.playerId);
    }
  }, [team1, team2]);

  const togglePlayer = (playerId, teamNum) => {
    const setSelected = teamNum === 1 ? setTeam1Selected : setTeam2Selected;
    const selected = teamNum === 1 ? team1Selected : team2Selected;

    if (selected.includes(playerId)) {
      setSelected(selected.filter((id) => id !== playerId));
    } else {
      if (selected.length < playersPerTeam) {
        setSelected([...selected, playerId]);
      }
    }
  };

  const saveLineup = async (teamNum) => {
    try {
      const team = teamNum === 1 ? team1 : team2;
      const selectedIds = teamNum === 1 ? team1Selected : team2Selected;
      const captainId = teamNum === 1 ? team1Captain : team2Captain;
      const keeperId = teamNum === 1 ? team1Keeper : team2Keeper;

      // Validate captain and keeper are selected
      if (!captainId) {
        setStatus(`❌ Please select a captain for ${team.teamName}`);
        return;
      }
      if (!keeperId) {
        setStatus(`❌ Please select a wicket keeper for ${team.teamName}`);
        return;
      }

      setStatus(`Saving ${team.teamName} lineup...`);

      const selectedPlayers = team.players
        .filter((p) => selectedIds.includes(p.playerId))
        .map((p) => ({
          playerId: p.playerId,
          playerName: p.playerName,
        }));

      const captain = team.players.find((p) => p.playerId === captainId);
      const keeper = team.players.find((p) => p.playerId === keeperId);

      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${match.matchId}/selected-players`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teamId: team.teamId,
            selectedPlayers,
            captain: {
              playerId: captain.playerId,
              playerName: captain.playerName,
            },
            wicketKeeper: {
              playerId: keeper.playerId,
              playerName: keeper.playerName,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save lineup");
      }

      setStatus(`✅ ${team.teamName} lineup saved!`);

      if (teamNum === 1 && currentTeam === 1) {
        // Move to team 2
        setTimeout(() => {
          setCurrentTeam(2);
          setStatus("");
        }, 1000);
      } else if (teamNum === 2) {
        // Both teams done
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  const renderTeamSelection = (teamNum) => {
    const team = teamNum === 1 ? team1 : team2;
    const selected = teamNum === 1 ? team1Selected : team2Selected;
    const captain = teamNum === 1 ? team1Captain : team2Captain;
    const keeper = teamNum === 1 ? team1Keeper : team2Keeper;
    const setCaptain = teamNum === 1 ? setTeam1Captain : setTeam2Captain;
    const setKeeper = teamNum === 1 ? setTeam1Keeper : setTeam2Keeper;
    const setSelected = teamNum === 1 ? setTeam1Selected : setTeam2Selected;
    const isActive = currentTeam === teamNum;

    if (!isActive) return null;

    const selectedPlayersList = team.players.filter((p) =>
      selected.includes(p.playerId)
    );

    const clearAllSelections = () => {
      setSelected([]);
      setCaptain("");
      setKeeper("");
      setStatus("");
    };

    return (
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0, color: "#1e293b" }}>
            🏏 Select Playing XI for {team.teamName}
          </h3>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              {team.players?.length || 0} players available
            </span>
            {selected.length > 0 && (
              <button
                onClick={clearAllSelections}
                style={{
                  padding: "8px 16px",
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseOver={(e) => (e.target.style.background = "#dc2626")}
                onMouseOut={(e) => (e.target.style.background = "#ef4444")}
              >
                🗑️ Clear All
              </button>
            )}
          </div>
        </div>

        <div
          style={{
            background: "#f1f5f9",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <p style={{ margin: 0, fontSize: 14, color: "#475569" }}>
            <strong>Selected:</strong> {selected.length}/{playersPerTeam}{" "}
            players
          </p>
          <div style={{ marginTop: 8 }}>
            <div
              style={{
                height: 8,
                background: "#e2e8f0",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(selected.length / playersPerTeam) * 100}%`,
                  background:
                    selected.length === playersPerTeam
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {team.players.map((player) => {
            const isSelected = selected.includes(player.playerId);
            const canSelect = selected.length < playersPerTeam || isSelected;

            return (
              <div
                key={player.playerId}
                onClick={() =>
                  canSelect && togglePlayer(player.playerId, teamNum)
                }
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: `2px solid ${isSelected ? "#10b981" : "#e2e8f0"}`,
                  background: isSelected ? "#ecfdf5" : "white",
                  cursor: canSelect ? "pointer" : "not-allowed",
                  opacity: canSelect ? 1 : 0.5,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      border: `2px solid ${isSelected ? "#10b981" : "#cbd5e1"}`,
                      background: isSelected ? "#10b981" : "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: "white",
                      fontWeight: "bold",
                    }}
                  >
                    {isSelected && "✓"}
                  </div>
                  <span
                    style={{ fontSize: 14, fontWeight: 500, color: "#334155" }}
                  >
                    {player.playerName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview of Selected Players */}
        {selected.length > 0 && (
          <div
            style={{
              background: "#f8fafc",
              border: "2px solid #e2e8f0",
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: 15,
                color: "#334155",
                fontWeight: 600,
              }}
            >
              📋 Selected Playing XI Preview
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 8,
              }}
            >
              {selectedPlayersList.map((player, index) => (
                <div
                  key={player.playerId}
                  style={{
                    padding: "6px 10px",
                    background: "white",
                    borderRadius: 6,
                    fontSize: 13,
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    {index + 1}. {player.playerName}
                  </span>
                  <span style={{ fontSize: 12 }}>
                    {captain === player.playerId && "👑"}
                    {keeper === player.playerId && "🧤"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Captain and Wicket Keeper Selection */}
        {selected.length === playersPerTeam && (
          <div
            style={{
              background: "#fef3c7",
              border: "2px solid #fbbf24",
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: 15,
                color: "#92400e",
                fontWeight: 600,
              }}
            >
              👑 Select Team Roles
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  Captain
                </label>
                <select
                  value={captain}
                  onChange={(e) => setCaptain(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "2px solid #e2e8f0",
                    fontSize: 14,
                    background: "white",
                  }}
                >
                  <option value="">-- Select Captain --</option>
                  {selectedPlayersList.map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.playerName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#334155",
                  }}
                >
                  Wicket Keeper
                </label>
                <select
                  value={keeper}
                  onChange={(e) => setKeeper(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "2px solid #e2e8f0",
                    fontSize: 14,
                    background: "white",
                  }}
                >
                  <option value="">-- Select Keeper --</option>
                  {selectedPlayersList.map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.playerName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => saveLineup(teamNum)}
          disabled={selected.length !== playersPerTeam || !captain || !keeper}
          style={{
            width: "100%",
            padding: "14px 20px",
            background:
              selected.length === playersPerTeam && captain && keeper
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : "#cbd5e1",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor:
              selected.length === playersPerTeam && captain && keeper
                ? "pointer"
                : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          {selected.length !== playersPerTeam
            ? `⚠️ Select ${playersPerTeam - selected.length} more player${
                playersPerTeam - selected.length !== 1 ? "s" : ""
              }`
            : !captain
            ? "⚠️ Select Captain"
            : !keeper
            ? "⚠️ Select Wicket Keeper"
            : `✅ Confirm ${team.teamName} Lineup`}
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 20,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ margin: 0, color: "#1e293b" }}>
          👥 Team Lineup Selection
        </h2>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
          Select exactly {playersPerTeam} players from each team
        </p>
      </div>

      {/* Team Switcher Tabs */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          background: "#f1f5f9",
          padding: 8,
          borderRadius: 12,
        }}
      >
        <button
          onClick={() => setCurrentTeam(1)}
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 8,
            border: "none",
            background:
              currentTeam === 1
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "transparent",
            color: currentTeam === 1 ? "white" : "#64748b",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow:
              currentTeam === 1
                ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                : "none",
          }}
        >
          {team1Selected.length === playersPerTeam &&
          team1Captain &&
          team1Keeper
            ? "✅ "
            : ""}
          {team1.teamName}
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>
            {team1Selected.length}/{playersPerTeam} players
          </div>
        </button>
        <button
          onClick={() => setCurrentTeam(2)}
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 8,
            border: "none",
            background:
              currentTeam === 2
                ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                : "transparent",
            color: currentTeam === 2 ? "white" : "#64748b",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow:
              currentTeam === 2
                ? "0 4px 12px rgba(102, 126, 234, 0.3)"
                : "none",
          }}
        >
          {team2Selected.length === playersPerTeam &&
          team2Captain &&
          team2Keeper
            ? "✅ "
            : ""}
          {team2.teamName}
          <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>
            {team2Selected.length}/{playersPerTeam} players
          </div>
        </button>
      </div>

      {status && (
        <div
          style={{
            padding: 12,
            background: status.includes("✅") ? "#ecfdf5" : "#fef2f2",
            border: `2px solid ${
              status.includes("✅") ? "#10b981" : "#f87171"
            }`,
            borderRadius: 8,
            marginBottom: 16,
            textAlign: "center",
            fontWeight: 500,
          }}
        >
          {status}
        </div>
      )}

      {renderTeamSelection(currentTeam)}
    </div>
  );
};

export default LineupSelection;
