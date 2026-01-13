import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import GlobalErrorNotification from "../components/GlobalErrorNotification";
import API_BASE_URL from "../config/api";

// Player Selection Form Component
const PlayerSelectionForm = ({
  availableBatsmen,
  availableBowlers,
  match,
  onPlayersSelected,
  autoPopulateTeams = false, // New prop for second innings
  battingTeamOverride = null, // Override batting team (for super over)
  bowlingTeamOverride = null, // Override bowling team (for super over)
}) => {
  const [selectedBattingTeam, setSelectedBattingTeam] = useState("");
  const [selectedBowlingTeam, setSelectedBowlingTeam] = useState("");
  const [selectedStriker, setSelectedStriker] = useState("");
  const [selectedNonStriker, setSelectedNonStriker] = useState("");
  const [selectedBowler, setSelectedBowler] = useState("");

  // Auto-populate teams for second innings
  useEffect(() => {
    if (autoPopulateTeams) {
      // Prioritize overrides (for super over) over match currentState
      const battingTeamId =
        battingTeamOverride?.teamId || match?.currentState?.battingTeam?.teamId;
      const bowlingTeamId =
        bowlingTeamOverride?.teamId || match?.currentState?.bowlingTeam?.teamId;

      if (battingTeamId && bowlingTeamId) {
        setSelectedBattingTeam(battingTeamId);
        setSelectedBowlingTeam(bowlingTeamId);
      }
    }
  }, [autoPopulateTeams, match, battingTeamOverride, bowlingTeamOverride]);

  // Get players from selected teams (only playing XI from lineups)
  const getBattingTeamPlayers = () => {
    // Use override teamId if provided (for super over), otherwise use selected team
    const teamId = battingTeamOverride?.teamId || selectedBattingTeam;

    if (!teamId || !match) return [];

    const playersPerTeam = match.playersPerTeam || 11; // Use match-specific player count

    if (teamId === match.teams.team1.teamId) {
      // First check if selectedPlayers exists (lineup has been set)
      const selectedPlayers = match.teams.team1.selectedPlayers;
      if (selectedPlayers && selectedPlayers.length > 0) {
        return selectedPlayers;
      }

      // Fallback: Use batting order for batting team players
      const battingOrder = match.teams.team1.battingOrder;
      if (battingOrder && battingOrder.length > 0) {
        return battingOrder.map((orderPlayer) => {
          const fullPlayer = match.teams.team1.players.find(
            (p) => p.playerId === orderPlayer.playerId
          );
          return fullPlayer || orderPlayer;
        });
      }
      return match.teams.team1.players.slice(0, playersPerTeam) || [];
    } else if (teamId === match.teams.team2.teamId) {
      // First check if selectedPlayers exists (lineup has been set)
      const selectedPlayers = match.teams.team2.selectedPlayers;
      if (selectedPlayers && selectedPlayers.length > 0) {
        return selectedPlayers;
      }

      // Fallback: Use batting order for team2
      const battingOrder = match.teams.team2.battingOrder;
      if (battingOrder && battingOrder.length > 0) {
        return battingOrder.map((orderPlayer) => {
          const fullPlayer = match.teams.team2.players.find(
            (p) => p.playerId === orderPlayer.playerId
          );
          return fullPlayer || orderPlayer;
        });
      }
      return match.teams.team2.players.slice(0, playersPerTeam) || [];
    }

    return []; // Return empty if teamId doesn't match either team
  };

  const getBowlingTeamPlayers = () => {
    // Use override teamId if provided (for super over), otherwise use selected team
    const teamId = bowlingTeamOverride?.teamId || selectedBowlingTeam;

    if (!teamId || !match) return [];

    if (teamId === match.teams.team1.teamId) {
      // First check if selectedPlayers exists (lineup has been set) - show ALL selected players
      const selectedPlayers = match.teams.team1.selectedPlayers;
      if (selectedPlayers && selectedPlayers.length > 0) {
        return selectedPlayers; // Return all selected players, not limited to 5
      }

      // Fallback: Use bowling order for bowling team players
      const bowlingOrder = match.teams.team1.bowlingOrder;
      if (bowlingOrder && bowlingOrder.length > 0) {
        return bowlingOrder.map((orderPlayer) => {
          const fullPlayer = match.teams.team1.players.find(
            (p) => p.playerId === orderPlayer.playerId
          );
          return fullPlayer || orderPlayer;
        });
      }
      // Return all players from the team (no limit)
      return match.teams.team1.players || [];
    } else if (teamId === match.teams.team2.teamId) {
      // First check if selectedPlayers exists (lineup has been set) - show ALL selected players
      const selectedPlayers = match.teams.team2.selectedPlayers;
      if (selectedPlayers && selectedPlayers.length > 0) {
        return selectedPlayers; // Return all selected players, not limited to 5
      }

      // Fallback: Use bowling order for team2
      const bowlingOrder = match.teams.team2.bowlingOrder;
      if (bowlingOrder && bowlingOrder.length > 0) {
        return bowlingOrder.map((orderPlayer) => {
          const fullPlayer = match.teams.team2.players.find(
            (p) => p.playerId === orderPlayer.playerId
          );
          return fullPlayer || orderPlayer;
        });
      }
      // Return all players from the team (no limit)
      return match.teams.team2.players || [];
    }

    return []; // Return empty if teamId doesn't match either team
  };

  const battingTeamPlayers = getBattingTeamPlayers();
  const bowlingTeamPlayers = getBowlingTeamPlayers();

  // Helper function to check if a player is a wicket keeper
  const isWicketKeeper = (playerId) => {
    if (!match) return false;
    const team1Keeper = match.teams?.team1?.wicketKeeper?.playerId;
    const team2Keeper = match.teams?.team2?.wicketKeeper?.playerId;
    return playerId === team1Keeper || playerId === team2Keeper;
  };

  // Reset player selections when teams change
  const handleBattingTeamChange = (teamId) => {
    setSelectedBattingTeam(teamId);
    setSelectedStriker("");
    setSelectedNonStriker("");

    // Auto-set bowling team to the other team
    if (teamId === match.teams.team1.teamId) {
      setSelectedBowlingTeam(match.teams.team2.teamId);
    } else {
      setSelectedBowlingTeam(match.teams.team1.teamId);
    }
    setSelectedBowler("");
  };

  const handleSubmit = () => {
    if (!selectedBattingTeam || !selectedBowlingTeam) {
      alert("Please select batting and bowling teams");
      return;
    }

    if (!selectedStriker || !selectedNonStriker || !selectedBowler) {
      alert("Please select striker, non-striker and bowler");
      return;
    }

    if (selectedStriker === selectedNonStriker) {
      alert("Striker and Non-striker cannot be the same player");
      return;
    }

    const striker = (battingTeamPlayers || []).find(
      (p) => p.playerId === selectedStriker
    );
    const nonStriker = (battingTeamPlayers || []).find(
      (p) => p.playerId === selectedNonStriker
    );
    const bowler = (bowlingTeamPlayers || []).find(
      (p) => p.playerId === selectedBowler
    );

    onPlayersSelected(
      { playerId: striker.playerId, playerName: striker.playerName },
      { playerId: nonStriker.playerId, playerName: nonStriker.playerName },
      { playerId: bowler.playerId, playerName: bowler.playerName },
      selectedBattingTeam,
      selectedBowlingTeam
    );
  };

  const getBattingTeamName = () => {
    // Use override if provided (for super over)
    if (battingTeamOverride?.teamName) {
      return battingTeamOverride.teamName;
    }
    if (!selectedBattingTeam || !match) return "";
    return selectedBattingTeam === match.teams.team1.teamId
      ? match.teams.team1.teamName
      : match.teams.team2.teamName;
  };

  const getBowlingTeamName = () => {
    // Use override if provided (for super over)
    if (bowlingTeamOverride?.teamName) {
      return bowlingTeamOverride.teamName;
    }
    if (!selectedBowlingTeam || !match) return "";
    return selectedBowlingTeam === match.teams.team1.teamId
      ? match.teams.team1.teamName
      : match.teams.team2.teamName;
  };

  return (
    <div>
      {/* Team Selection - Hide if auto-populated */}
      {!autoPopulateTeams && (
        <div
          style={{
            marginBottom: 30,
            padding: 20,
            background: "#fff3cd",
            borderRadius: 5,
          }}
        >
          <h4>🏏 Select Teams</h4>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 10,
                  fontWeight: "bold",
                }}
              >
                Batting Team
              </label>
              <select
                value={selectedBattingTeam}
                onChange={(e) => handleBattingTeamChange(e.target.value)}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  fontSize: 16,
                }}
              >
                <option value="">-- Select Batting Team --</option>
                <option value={match.teams.team1.teamId}>
                  {match.teams.team1.teamName}
                </option>
                <option value={match.teams.team2.teamId}>
                  {match.teams.team2.teamName}
                </option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 10,
                  fontWeight: "bold",
                }}
              >
                Bowling Team
              </label>
              <select
                value={selectedBowlingTeam}
                disabled={true} // Auto-selected based on batting team
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  fontSize: 16,
                  background: "#f8f9fa",
                }}
              >
                <option value="">-- Auto Selected --</option>
                <option value={match.teams.team1.teamId}>
                  {match.teams.team1.teamName}
                </option>
                <option value={match.teams.team2.teamId}>
                  {match.teams.team2.teamName}
                </option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Show team info for second innings */}
      {autoPopulateTeams && selectedBattingTeam && selectedBowlingTeam && (
        <div
          style={{
            marginBottom: 20,
            padding: 15,
            background: "#d1ecf1",
            border: "1px solid #bee5eb",
            borderRadius: 5,
          }}
        >
          <h4 style={{ margin: "0 0 10px 0" }}>
            🔄 Second Innings - Teams Swapped
          </h4>
          <p style={{ margin: "5px 0" }}>
            <strong>Batting:</strong> {getBattingTeamName()}
          </p>
          <p style={{ margin: "5px 0" }}>
            <strong>Bowling:</strong> {getBowlingTeamName()}
          </p>
        </div>
      )}

      {/* Player Selection - Only show if teams are selected */}
      {selectedBattingTeam && selectedBowlingTeam && (
        <div style={{ marginBottom: 20 }}>
          <h4>👥 Select Current Players</h4>

          {/* Playing XI Info */}
          <div
            style={{
              background: "#e7f1ff",
              border: "1px solid #b8daff",
              borderRadius: 4,
              padding: 10,
              marginBottom: 15,
              fontSize: 14,
            }}
          >
            <strong>ℹ️ Playing XI Selection:</strong> Showing only players from
            team lineups - {getBattingTeamName()}:{" "}
            {(battingTeamPlayers || []).length}/{match.playersPerTeam || 11}{" "}
            batsmen, {getBowlingTeamName()}: {(bowlingTeamPlayers || []).length}
            /{Math.min(5, match.playersPerTeam || 11)} bowlers
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 20,
            }}
          >
            {/* Striker Selection */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 10,
                  fontWeight: "bold",
                }}
              >
                Striker ({getBattingTeamName()})
              </label>
              <select
                value={selectedStriker}
                onChange={(e) => setSelectedStriker(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                }}
              >
                <option value="">-- Select Striker --</option>
                {(battingTeamPlayers || []).map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                    {isWicketKeeper(player.playerId) && " 🧤 (WK)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Non-Striker Selection */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 10,
                  fontWeight: "bold",
                }}
              >
                Non-Striker ({getBattingTeamName()})
              </label>
              <select
                value={selectedNonStriker}
                onChange={(e) => setSelectedNonStriker(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                }}
              >
                <option value="">-- Select Non-Striker --</option>
                {(battingTeamPlayers || []).map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                    {isWicketKeeper(player.playerId) && " 🧤 WK"}
                  </option>
                ))}
              </select>
            </div>

            {/* Bowler Selection */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 10,
                  fontWeight: "bold",
                }}
              >
                Bowler ({getBowlingTeamName()})
              </label>
              <select
                value={selectedBowler}
                onChange={(e) => setSelectedBowler(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                }}
              >
                <option value="">-- Select Bowler --</option>
                {(bowlingTeamPlayers || []).map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                    {isWicketKeeper(player.playerId) && " 🧤 WK"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: "center", marginTop: 30 }}>
            <button
              onClick={handleSubmit}
              disabled={
                !selectedStriker || !selectedNonStriker || !selectedBowler
              }
              style={{
                padding: "15px 30px",
                background:
                  selectedStriker && selectedNonStriker && selectedBowler
                    ? "#28a745"
                    : "#6c757d",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor:
                  selectedStriker && selectedNonStriker && selectedBowler
                    ? "pointer"
                    : "not-allowed",
                fontWeight: "bold",
                fontSize: 18,
              }}
            >
              🎯 Set Players & Start Scoring
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ScorerKeypad = ({ matchId, token, userType, onBack }) => {
  const [match, setMatch] = useState(null);
  const [socket, setSocket] = useState(null);
  const [availableBatsmen, setAvailableBatsmen] = useState([]);
  const [availableBowlers, setAvailableBowlers] = useState([]);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);
  const [showBowlerSelection, setShowBowlerSelection] = useState(false);
  const [showBatsmanSelection, setShowBatsmanSelection] = useState(false);
  const [currentStriker, setCurrentStriker] = useState(null);
  const [currentNonStriker, setCurrentNonStriker] = useState(null);
  const [currentBowler, setCurrentBowler] = useState(null);

  // Ref to prevent multiple socket initializations
  const isInitializing = useRef(false);
  const socketRef = useRef(null);

  const [currentBall, setCurrentBall] = useState({
    innings: 1,
    over: 1,
    ball: 1,
    ballType: "legal",
    runs: 0,
    batsman: null,
    bowler: null,
    extras: 0,
    isWicket: false,
    wicketType: "",
    fielder: null,
    commentary: "",
  });
  const [score, setScore] = useState({
    runs: 0,
    wickets: 0,
    overs: 0,
    balls: 0,
    innings: 1,
    extras: { total: 0, wides: 0, noballs: 0, byes: 0, legbyes: 0 },
  });
  const [status, setStatus] = useState("Loading...");
  const [isConnected, setIsConnected] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState([]);
  // Recent points awarded (temporary, immediate feedback)
  const [recentPoints, setRecentPoints] = useState([]);

  // Global error notification system
  const [globalErrors, setGlobalErrors] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkRetryCount, setNetworkRetryCount] = useState(0);

  // Innings management states
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [showMatchComplete, setShowMatchComplete] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [targetScore, setTargetScore] = useState(0);
  const [recentBalls, setRecentBalls] = useState([]);
  const [currentBowlerStats, setCurrentBowlerStats] = useState(null);

  // New states for cricket scenarios
  const [showNewBatsmanSelection, setShowNewBatsmanSelection] = useState(false);
  const [showNewBowlerSelection, setShowNewBowlerSelection] = useState(false);
  const [showRunOutSelection, setShowRunOutSelection] = useState(false);
  const [showFielderSelection, setShowFielderSelection] = useState(false);
  const [showLastBallConfirmation, setShowLastBallConfirmation] =
    useState(false);
  const [pendingLastBall, setPendingLastBall] = useState(null);
  const [showWinningBallConfirmation, setShowWinningBallConfirmation] =
    useState(false);
  const [pendingWinningBall, setPendingWinningBall] = useState(null);
  const [outBatsman, setOutBatsman] = useState(null);
  const [pendingBallData, setPendingBallData] = useState(null);
  const [wicketBallData, setWicketBallData] = useState(null); // Store ball data for wicket scenarios

  // Super Over states
  const [isSuperOver, setIsSuperOver] = useState(false);
  const [superOverNumber, setSuperOverNumber] = useState(0);
  const [superOverInnings, setSuperOverInnings] = useState(1);
  const [superOverScore, setSuperOverScore] = useState({
    runs: 0,
    wickets: 0,
    balls: 0,
  });
  const [superOverTarget, setSuperOverTarget] = useState(0);
  const [showSuperOverPlayerSelection, setShowSuperOverPlayerSelection] =
    useState(false);
  const [showSuperOverInningsBreak, setShowSuperOverInningsBreak] =
    useState(false);
  const [superOverResult, setSuperOverResult] = useState(null);
  const [superOverBattingTeam, setSuperOverBattingTeam] = useState(null);
  const [superOverBowlingTeam, setSuperOverBowlingTeam] = useState(null);
  const [currentSuperOverData, setCurrentSuperOverData] = useState(null); // Store live super over data

  // Selection states for modals
  const [selectedRunOutBatsman, setSelectedRunOutBatsman] = useState("");
  const [selectedFielder, setSelectedFielder] = useState("");
  const [selectedAssistantFielder, setSelectedAssistantFielder] = useState("");
  const [selectedNewBowler, setSelectedNewBowler] = useState("");
  const [selectedNewBatsman, setSelectedNewBatsman] = useState("");

  // Undo functionality state
  const [canUndo, setCanUndo] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [undoMessage, setUndoMessage] = useState("");

  // Ball types for quick selection
  const ballTypes = [
    { value: "legal", label: "Legal Ball", color: "#28a745" },
    { value: "wide", label: "Wide", color: "#dc3545" },
    { value: "no-ball", label: "No Ball", color: "#fd7e14" },
    { value: "bye", label: "Bye", color: "#6f42c1" },
    { value: "leg-bye", label: "Leg Bye", color: "#20c997" },
  ];

  // Runs options
  const runsOptions = [0, 1, 2, 3, 4, 6];

  // Wicket types
  const wicketTypes = [
    "bowled",
    "caught",
    "lbw",
    "stumped",
    "run-out",
    "hit-wicket",
    "caught-and-bowled",
  ];

  // Helper function to check if a player is a wicket keeper
  const isWicketKeeper = (playerId) => {
    if (!match) return false;
    const team1Keeper = match.teams?.team1?.wicketKeeper?.playerId;
    const team2Keeper = match.teams?.team2?.wicketKeeper?.playerId;
    return playerId === team1Keeper || playerId === team2Keeper;
  };

  // Global error management functions
  const addGlobalError = (message, type = "error", retryAction = null) => {
    const newError = {
      id: Date.now() + Math.random(),
      message,
      type,
      retryable: !!retryAction,
      retryAction,
      timestamp: new Date(),
      title: getErrorTitle(type),
    };

    setGlobalErrors((prev) => [...prev, newError]);
    console.log("🚨 Global error added:", newError);
  };

  const getErrorTitle = (type) => {
    switch (type) {
      case "network":
        return "Connection Problem";
      case "validation":
        return "Input Error";
      case "api":
        return "Server Error";
      case "timeout":
        return "Request Timeout";
      case "critical":
        return "Critical Error";
      default:
        return "Cricket Scorer Error";
    }
  };

  const removeGlobalError = (errorId) => {
    setGlobalErrors((prev) => prev.filter((error) => error.id !== errorId));
  };

  const retryGlobalError = (error) => {
    console.log("🔄 Retrying error action:", error);
    if (error.retryAction) {
      error.retryAction();
    }
    removeGlobalError(error.id);
  };

  const clearAllErrors = () => {
    setGlobalErrors([]);
  };

  // Innings Management Functions
  const checkInningsCompletion = (currentScore) => {
    const maxOvers = match?.format?.overs || 20; // Default to T20 format
    const totalBalls = maxOvers * 6;
    const currentBalls = currentScore?.balls || 0;
    const currentInnings = currentScore?.innings || 1;
    const isAllOut = (currentScore?.wickets || 0) >= 10;
    const targetAchieved =
      targetScore > 0 && (currentScore?.runs || 0) >= targetScore;

    console.log("🏏 Checking innings completion:", {
      maxOvers,
      totalBalls,
      currentBalls,
      currentInnings,
      isAllOut,
      targetAchieved,
      targetScore,
      currentRuns: currentScore?.runs,
      ballsInOver: currentBalls % 6,
      oversCompleted: Math.floor(currentBalls / 6),
    });

    // Check if innings is complete
    if (currentInnings === 1) {
      // First innings: complete if 20 overs done or all out
      if (currentBalls >= totalBalls || isAllOut) {
        handleInningsChange(currentScore);
        return true;
      }
    } else {
      // Second innings: complete if 20 overs done, all out, OR target achieved
      if (currentBalls >= totalBalls || isAllOut || targetAchieved) {
        handleMatchCompletion(currentScore);
        return true;
      }
    }

    return false;
  };

  const handleInningsChange = async (firstInningsScore) => {
    try {
      console.log("🔄 Starting innings change process:", firstInningsScore);

      const target = (firstInningsScore.runs || 0) + 1;
      setTargetScore(target);

      setStatus("🏏 First innings complete! Preparing for second innings...");
      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "success",
          message: `📊 First innings: ${firstInningsScore.runs}/${
            firstInningsScore.wickets
          } (${Math.floor(firstInningsScore.balls / 6)}.${
            firstInningsScore.balls % 6
          } overs)`,
          time: new Date(),
        },
      ]);

      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "success",
          message: `🎯 Target: ${target} runs in ${match?.overs || 20} overs`,
          time: new Date(),
        },
      ]);

      setShowInningsBreak(true);
    } catch (error) {
      console.error("🚨 Error in innings change:", error);
      addGlobalError(
        `Failed to change innings: ${error.message}`,
        "critical",
        () => handleInningsChange(firstInningsScore)
      );
    }
  };

  const startSecondInnings = async () => {
    try {
      console.log("🏏 Starting second innings with target:", targetScore);

      // Calculate target if not already set (score + 1)
      const calculatedTarget =
        targetScore > 0 ? targetScore : (score?.runs || 0) + 1;

      console.log("🎯 Calculated target:", calculatedTarget);

      // API call to start second innings
      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}/innings-change`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newInnings: 2,
            targetScore: calculatedTarget,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to start second innings: ${
            errorData.message || "Server error"
          }`
        );
      }

      const responseData = await response.json();
      console.log("✅ Second innings started:", responseData);

      // Update match state
      if (responseData.data && responseData.data.match) {
        setMatch(responseData.data.match);

        // Reset score for second innings
        setScore({
          runs: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
          innings: 2,
          extras: { total: 0, wides: 0, noballs: 0, byes: 0, legbyes: 0 },
        });

        // Clear current players for new team selection
        setCurrentStriker(null);
        setCurrentNonStriker(null);
        setCurrentBowler(null);

        // Show player selection for swapped teams
        setShowPlayerSelection(true);
      }

      setShowInningsBreak(false);
      setStatus("🏏 Second innings started! Select new players.");

      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "success",
          message: "🎯 Second innings has begun! Teams have swapped.",
          time: new Date(),
        },
      ]);
    } catch (error) {
      console.error("🚨 Error starting second innings:", error);
      addGlobalError(
        `Failed to start second innings: ${error.message}`,
        "api",
        () => startSecondInnings()
      );
    }
  };

  const calculateMatchResult = (finalScore) => {
    console.log("🎯 Calculating match result with:", {
      finalScore,
      targetScore,
      match: match?.overs,
    });
    if (!match || !targetScore) return null;

    const team1Name = match.teams?.team1?.teamName || "Team 1";
    const team2Name = match.teams?.team2?.teamName || "Team 2";
    const maxOvers = match.overs || 20;
    const maxBalls = maxOvers * 6;
    const playersPerTeam = match.playersPerTeam || 11;

    // Determine which team batted first and second based on currentState
    const currentBattingTeamId = match.currentState?.battingTeam?.teamId;
    const isTeam1Batting = currentBattingTeamId === match.teams?.team1?.teamId;

    const secondInningsTeam = isTeam1Batting ? team1Name : team2Name;
    const firstInningsTeam = isTeam1Batting ? team2Name : team1Name;

    const chasingTeamRuns = finalScore.runs || 0;
    const chasingTeamWickets = finalScore.wickets || 0;
    const ballsFaced = finalScore.balls || 0;
    const target = targetScore;

    // Check for tie
    if (
      chasingTeamRuns === target - 1 &&
      (ballsFaced >= maxBalls || chasingTeamWickets >= playersPerTeam)
    ) {
      return {
        winner: "TIE",
        margin: "0 runs",
        description: "Match Tied",
        summary: `Both teams scored ${target - 1} runs. The match is tied!`,
        isTie: true,
      };
    }

    // Check if chasing team won (target achieved)
    if (chasingTeamRuns >= target) {
      const wicketsRemaining = playersPerTeam - chasingTeamWickets;
      const ballsRemaining = maxBalls - ballsFaced;
      return {
        winner: secondInningsTeam,
        margin: `${wicketsRemaining} wickets`,
        description: `${secondInningsTeam} won by ${wicketsRemaining} wickets`,
        summary: `${secondInningsTeam} successfully chased the target of ${target} runs with ${wicketsRemaining} wickets and ${ballsRemaining} balls remaining`,
        ballsRemaining,
      };
    }

    // Check if chasing team was all out or completed their overs
    const isAllOut = chasingTeamWickets >= playersPerTeam;
    const oversCompleted = ballsFaced >= maxBalls;

    if (isAllOut || oversCompleted) {
      // First innings team won (defended target)
      const margin = target - chasingTeamRuns - 1;
      const howLost = isAllOut ? "all out" : `completed ${maxOvers} overs`;

      return {
        winner: firstInningsTeam,
        margin: `${margin} runs`,
        description: `${firstInningsTeam} won by ${margin} runs`,
        summary: `${secondInningsTeam} were ${howLost} for ${chasingTeamRuns}/${chasingTeamWickets}. ${firstInningsTeam} defended their total of ${
          target - 1
        } runs`,
        howLost,
      };
    }

    // This shouldn't happen in normal circumstances
    return {
      winner: "UNKNOWN",
      margin: "Unknown",
      description: "Match result unclear",
      summary: "Unable to determine match result",
    };
  };

  const handleMatchCompletion = async (finalScore) => {
    try {
      console.log("🏆 Match completed! Calculating result:", finalScore);

      const result = calculateMatchResult(finalScore);
      setMatchResult(result);

      // API call to complete match
      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}/complete`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            finalScore,
            matchResult: result,
          }),
        }
      );

      const serverResp = await response.json().catch(() => null);
      if (!response.ok || !serverResp || !serverResp.success) {
        console.warn(
          "Failed to update match completion on server, but showing result locally"
        );
        // Show local result as fallback
        setMatchResult(result);
      } else {
        // Use server's authoritative result (fixes tie vs 0-run-win mismatch)
        const svcResult =
          serverResp.data?.result || serverResp.data?.match || result;
        // Normalize to expected client shape
        const normalized = {
          ...svcResult,
          isTie: svcResult?.winType === "tie" || svcResult?.isTie || false,
          description:
            svcResult?.matchSummary ||
            svcResult?.description ||
            svcResult?.summary ||
            "",
        };
        setMatchResult(normalized);
      }

      setShowMatchComplete(true);
      setStatus(
        `🏆 Match Complete! ${
          serverResp?.data?.result?.matchSummary ||
          result?.description ||
          "Match finished"
        }`
      );

      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "success",
          message: `🏆 ${
            serverResp?.data?.result?.matchSummary ||
            result?.description ||
            "Match completed"
          }`,
          time: new Date(),
        },
      ]);
    } catch (error) {
      console.error("🚨 Error completing match:", error);
      // Still show match complete even if API fails
      const result = calculateMatchResult(finalScore);
      setMatchResult(result);
      setShowMatchComplete(true);

      addGlobalError(
        `Match completed but failed to save result: ${error.message}`,
        "api",
        () => handleMatchCompletion(finalScore)
      );
    }
  };

  // Start Super Over for tied matches
  const startSuperOver = async () => {
    try {
      const canStartSuperOver =
        matchResult?.isTie ||
        match?.result?.status === "tied" ||
        matchResult?.winType === "tie" ||
        (matchResult?.description || "").toLowerCase().includes("tied") ||
        (matchResult?.summary || "").toLowerCase().includes("tied") ||
        superOverResult?.isTie;
      if (!canStartSuperOver) return;

      const superOverNum = (match?.superOvers?.length || 0) + 1;
      const confirm = window.confirm(
        `Start Super Over #${superOverNum}? You will need to select players for both teams.`
      );
      if (!confirm) return;

      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}/super-over`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to start Super Over");
      }

      // Update super over state
      setIsSuperOver(true);
      setSuperOverNumber(superOverNum);
      setSuperOverInnings(1);
      setSuperOverScore({ runs: 0, wickets: 0, balls: 0 });
      setSuperOverTarget(0);
      setSuperOverResult(null);

      // Set initial teams from response (1st innings)
      if (data.data?.battingTeam && data.data?.bowlingTeam) {
        setSuperOverBattingTeam({
          teamId: data.data.battingTeam.teamId,
          teamName: data.data.battingTeam.teamName,
        });
        setSuperOverBowlingTeam({
          teamId: data.data.bowlingTeam.teamId,
          teamName: data.data.bowlingTeam.teamName,
        });
      }

      // Refresh match and UI
      setShowMatchComplete(false);
      setStatus(`🔁 Super Over #${superOverNum} started - Select players`);
      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "info",
          message: `🔁 Super Over #${superOverNum} started`,
          time: new Date(),
        },
      ]);

      // Fetch latest match state and show player selection
      await initializeScorer();
      setShowPlayerSelection(true);
    } catch (err) {
      console.error("Error starting super over:", err);
      addGlobalError(`Failed to start Super Over: ${err.message}`, "api");
    }
  };

  // Record ball in Super Over
  const recordSuperOverBall = async (ballData) => {
    try {
      setStatus("Recording super over ball...");

      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}/super-over/ball`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(ballData),
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to record super over ball");
      }

      // Update super over score from response
      // Backend may return 'currentSuperOver' or 'superOver' depending on the endpoint
      const currentSO = data.data?.currentSuperOver || data.data?.superOver;

      // Store the current super over data for stats display
      if (currentSO) {
        setCurrentSuperOverData(currentSO);

        // Update bowler stats from super over data
        const currentInnings = superOverInnings === 1 ? "innings1" : "innings2";
        const bowler = currentSO[currentInnings]?.bowler;
        if (bowler && bowler.playerId) {
          const ballsBowled = bowler.balls || 0;
          const overs = Math.floor(ballsBowled / 6) + (ballsBowled % 6) / 10;
          setCurrentBowlerStats({
            playerId: bowler.playerId,
            playerName: bowler.playerName,
            balls: ballsBowled,
            runs: bowler.runs || 0,
            wickets: bowler.wickets || 0,
            overs:
              ballsBowled > 0
                ? `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`
                : "0.0",
            economyRate:
              overs > 0 ? ((bowler.runs || 0) / overs).toFixed(1) : "0.0",
          });
        }
      }

      let inningsData =
        superOverInnings === 1 ? currentSO?.innings1 : currentSO?.innings2;

      // Fallback: some responses include a currentScore object instead
      if (!inningsData && data.data?.currentScore) {
        inningsData = {
          runs: data.data.currentScore.runs || 0,
          wickets: data.data.currentScore.wickets || 0,
          balls: data.data.currentScore.balls || 0,
        };
      }

      if (inningsData) {
        setSuperOverScore({
          runs: inningsData.runs || 0,
          wickets: inningsData.wickets || 0,
          balls: inningsData.balls || 0,
        });
      }

      // Check if super over innings completed
      if (data.data?.inningsComplete) {
        if (superOverInnings === 1) {
          // First innings complete, show break modal
          const targetFromInnings = inningsData
            ? inningsData.runs + 1
            : data.data.currentScore?.runs + 1 || 0;
          console.log(
            "🔔 SuperOver innings complete - setting target:",
            targetFromInnings,
            { inningsData, currentScore: data.data.currentScore }
          );
          setSuperOverTarget(targetFromInnings);
          setShowSuperOverInningsBreak(true);
        } else {
          // Second innings complete, check result
          await handleSuperOverComplete(data.data);
        }
      }

      // Update match data
      if (data.data?.match) {
        setMatch(data.data.match);
      }

      // Check if wicket occurred - show new batsman selection
      if (ballData.wicket?.isWicket && !data.data?.inningsComplete) {
        const dismissedPlayer = ballData.wicket.dismissedPlayer;
        console.log(
          "🏏 Wicket in super over - need new batsman:",
          dismissedPlayer
        );
        setOutBatsman(dismissedPlayer);
        setShowNewBatsmanSelection(true);

        setStatus("Wicket! Select new batsman");
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "wicket",
            message: `🏏 WICKET! ${dismissedPlayer.playerName} is out`,
            time: new Date(),
          },
        ]);

        // Reset current ball state
        setCurrentBall((prev) => ({
          ...prev,
          runs: 0,
          ballType: "legal",
          isWicket: false,
          wicketType: "",
          fielder: null,
        }));

        return data;
      }

      // Check for strike rotation from backend response or handle manually
      const updatedMatch = { ...match };

      if (currentSO?.currentBatsmen) {
        // Use backend provided batsmen if available
        if (updatedMatch.currentState) {
          updatedMatch.currentState.currentBatsmen = {
            striker: currentSO.currentBatsmen.striker,
            nonStriker: currentSO.currentBatsmen.nonStriker,
          };
          console.log(
            "🔄 Strike updated from backend:",
            currentSO.currentBatsmen
          );
        }
      } else {
        // Manual strike rotation for odd runs or end of over
        const totalRuns = ballData.runs?.total || 0; // Use total runs, not batsman runs
        const isLegalBall =
          ballData.ballType === "legal" ||
          ballData.ballType === "bye" ||
          ballData.ballType === "leg-bye";
        const isOddRuns = totalRuns % 2 === 1;
        const noWicket = !ballData.wicket?.isWicket;

        // Get the current super over balls to check for end of over
        const currentBalls = inningsData?.balls || 0;
        const isEndOfOver = currentBalls % 6 === 0 && currentBalls > 0;

        if (updatedMatch.currentState?.currentBatsmen && noWicket) {
          const currentBatsmen = updatedMatch.currentState.currentBatsmen;
          let shouldRotate = false;

          // Rotate for odd runs on legal balls
          if (isLegalBall && isOddRuns) {
            shouldRotate = true;
            console.log("🔄 Rotating strike for odd runs:", totalRuns);
          }

          // Also rotate at end of over (even if 0 runs on last ball)
          if (isEndOfOver && isLegalBall) {
            shouldRotate = !shouldRotate; // Toggle if already rotated for odd runs
            console.log("🔄 End of over - rotating strike");
          }

          if (shouldRotate) {
            updatedMatch.currentState.currentBatsmen = {
              striker: currentBatsmen.nonStriker,
              nonStriker: currentBatsmen.striker,
            };
            console.log("🔄 Strike rotated:", {
              runs: totalRuns,
              endOfOver: isEndOfOver,
              newStriker: currentBatsmen.nonStriker.playerName,
              newNonStriker: currentBatsmen.striker.playerName,
            });
          }
        }
      }

      // Apply the updated match state
      setMatch(updatedMatch);

      // If strike was rotated, update backend to persist the change
      if (
        updatedMatch.currentState?.currentBatsmen &&
        updatedMatch.currentState.currentBatsmen.striker.playerId !==
          match.currentState?.currentBatsmen?.striker.playerId
      ) {
        console.log("💾 Persisting strike rotation to backend...");
        try {
          const updateResponse = await fetch(
            `${API_BASE_URL}/api/live-matches/${matchId}/current-players`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                currentBatsmen: {
                  striker: updatedMatch.currentState.currentBatsmen.striker,
                  nonStriker:
                    updatedMatch.currentState.currentBatsmen.nonStriker,
                },
                currentBowler: updatedMatch.currentState.currentBowler,
              }),
            }
          );

          if (updateResponse.ok) {
            console.log("✅ Strike rotation persisted to backend");
          } else {
            console.warn("⚠️ Failed to persist strike rotation to backend");
          }
        } catch (error) {
          console.error("❌ Error persisting strike rotation:", error);
        }
      }

      setStatus("Super over ball recorded");
      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "success",
          message: "🔁 Super over ball recorded",
          time: new Date(),
        },
      ]);

      // Reset current ball state
      setCurrentBall((prev) => ({
        ...prev,
        runs: 0,
        ballType: "legal",
        isWicket: false,
        wicketType: "",
        fielder: null,
      }));

      return data;
    } catch (err) {
      console.error("Error recording super over ball:", err);
      setStatus(`Error: ${err.message}`);
      addGlobalError(`Failed to record super over ball: ${err.message}`, "api");
      throw err;
    }
  };

  // Start Super Over Second Innings
  const startSuperOverSecondInnings = async () => {
    try {
      setStatus("Starting super over second innings...");

      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}/super-over/second-innings`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(
          data.message || "Failed to start super over second innings"
        );
      }

      // Update state
      setSuperOverInnings(2);
      setSuperOverScore({ runs: 0, wickets: 0, balls: 0 });

      // Swap teams for 2nd innings based on backend response
      if (data.data?.battingTeam && data.data?.bowlingTeam) {
        console.log("🔄 Swapping super over teams for 2nd innings:", {
          batting: data.data.battingTeam,
          bowling: data.data.bowlingTeam,
        });
        setSuperOverBattingTeam({
          teamId: data.data.battingTeam.teamId,
          teamName: data.data.battingTeam.teamName,
        });
        setSuperOverBowlingTeam({
          teamId: data.data.bowlingTeam.teamId,
          teamName: data.data.bowlingTeam.teamName,
        });
      }

      const currentSO = data.data?.currentSuperOver || data.data?.superOver;
      if (currentSO?.innings2?.target) {
        setSuperOverTarget(currentSO.innings2.target);
      } else if (data.data?.target) {
        setSuperOverTarget(data.data.target);
      }

      setShowSuperOverInningsBreak(false);
      setShowPlayerSelection(true);

      // Update match
      if (data.data?.match) {
        setMatch(data.data.match);
      }

      setStatus("🔁 Super Over 2nd Innings - Select players");
      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "info",
          message: "🔁 Super Over 2nd Innings started",
          time: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Error starting super over second innings:", err);
      addGlobalError(`Failed to start second innings: ${err.message}`, "api");
    }
  };

  // Handle Super Over Complete
  const handleSuperOverComplete = async (data) => {
    const result = data.superOverResult || data.result;

    if (result?.isTie) {
      // Super over tied, offer another super over
      setSuperOverResult({ ...result, isTie: true });
      setStatus("🔁 Super Over Tied! Start another Super Over?");
      setShowMatchComplete(true);
    } else if (result?.winner) {
      // Super over has a winner
      setSuperOverResult(result);
      setMatchResult({
        ...result,
        winType: "super-over",
        description:
          result.summary || `${result.winner.teamName} won by Super Over`,
      });
      setStatus(`🏆 ${result.winner.teamName} wins by Super Over!`);
      setShowMatchComplete(true);
    }

    // Refresh match data
    await initializeScorer();
  };

  // Handle Super Over Player Selection
  const handleSuperOverPlayersSelected = async (
    striker,
    nonStriker,
    bowler,
    battingTeamId,
    bowlingTeamId
  ) => {
    try {
      setStatus("Setting super over players...");

      // Update current players via the existing API
      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}/current-players`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentBatsmen: {
              striker: striker,
              nonStriker: nonStriker,
            },
            currentBowler: bowler,
          }),
        }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to set super over players");
      }

      // Update local state
      setCurrentStriker(striker);
      setCurrentNonStriker(nonStriker);
      setCurrentBowler(bowler);

      setShowPlayerSelection(false);

      setStatus(
        `🔁 Super Over ${
          superOverInnings === 1 ? "1st" : "2nd"
        } Innings - Ready to score`
      );
      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "success",
          message: `🏏 Super over players set: ${striker.playerName}, ${nonStriker.playerName} vs ${bowler.playerName}`,
          time: new Date(),
        },
      ]);

      // Refresh match
      await initializeScorer();
    } catch (err) {
      console.error("Error setting super over players:", err);
      addGlobalError(`Failed to set players: ${err.message}`, "api");
    }
  };

  useEffect(() => {
    if (matchId && token) {
      initializeScorer();
    }

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log("🧹 Cleaning up socket connection");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      isInitializing.current = false;
    };
  }, [matchId, token]); // Don't add socket to deps - it would cause infinite loop

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log("🌐 Network connection restored");
      setIsOnline(true);
      setNetworkRetryCount(0);
      setStatus("🌐 Connection restored");

      // Clear network-related errors
      setGlobalErrors((prev) =>
        prev.filter((error) => error.type !== "network")
      );

      // Auto-retry initialization if we were offline
      if (matchId && token && !match) {
        console.log("🔄 Auto-retrying initialization after reconnection...");
        setTimeout(() => {
          initializeScorer();
        }, 1000);
      }
    };

    const handleOffline = () => {
      console.log("📵 Network connection lost");
      setIsOnline(false);
      setStatus(
        "📵 Offline - Changes will be saved when connection is restored"
      );

      addGlobalError(
        "You are currently offline. Cricket scoring will resume when your connection is restored.",
        "network",
        null
      );
    };

    // Add network status listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial network status
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [matchId, token, match]);

  // Debug: Log when match state changes
  useEffect(() => {
    if (match?.currentState?.currentBatsmen) {
      console.log("🎯 Match state updated in component:", {
        striker: {
          id: match.currentState.currentBatsmen.striker?.playerId,
          name: match.currentState.currentBatsmen.striker?.playerName,
        },
        nonStriker: {
          id: match.currentState.currentBatsmen.nonStriker?.playerId,
          name: match.currentState.currentBatsmen.nonStriker?.playerName,
        },
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  }, [
    match?.currentState?.currentBatsmen?.striker?.playerId,
    match?.currentState?.currentBatsmen?.nonStriker?.playerId,
  ]);

  // Update canUndo state based on score
  useEffect(() => {
    // Can undo if there are balls bowled and match is in progress
    let hasBalls = false;

    if (isSuperOver && currentSuperOverData) {
      // For super over, check if current innings has balls
      const currentInnings =
        superOverInnings === 1
          ? currentSuperOverData.innings1
          : currentSuperOverData.innings2;
      hasBalls = currentInnings?.balls > 0;
    } else {
      // For regular match, check score.balls
      hasBalls = score.balls > 0;
    }

    const isInProgress = match?.currentState?.status === "in-progress";
    setCanUndo(hasBalls && isInProgress && !isUndoing);
  }, [
    score.balls,
    match?.currentState?.status,
    isUndoing,
    isSuperOver,
    currentSuperOverData,
    superOverInnings,
  ]);

  const initializeScorer = async () => {
    // Prevent multiple simultaneous initializations
    if (isInitializing.current) {
      console.log("⏳ Already initializing, skipping duplicate call");
      return;
    }

    isInitializing.current = true;

    try {
      // Get match details
      const matchResponse = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!matchResponse.ok) {
        throw new Error("Failed to fetch match details");
      }

      const matchData = await matchResponse.json();
      setMatch(matchData.data.match);

      // Check for Super Over state
      const superOverState = matchData.data.match?.superOverState;
      if (superOverState?.isActive) {
        setIsSuperOver(true);
        setSuperOverNumber(superOverState.currentSuperOverNumber || 1);
        setSuperOverInnings(superOverState.currentInnings || 1);

        // Get current super over data
        const superOvers = matchData.data.match?.superOvers || [];
        const currentSO = superOvers.find(
          (so) => so.superOverNumber === superOverState.currentSuperOverNumber
        );

        if (currentSO) {
          const inningsData =
            superOverState.currentInnings === 1
              ? currentSO.innings1
              : currentSO.innings2;
          setSuperOverScore({
            runs: inningsData?.runs || 0,
            wickets: inningsData?.wickets || 0,
            balls: inningsData?.balls || 0,
          });

          if (
            superOverState.currentInnings === 2 &&
            currentSO.innings2?.target
          ) {
            setSuperOverTarget(currentSO.innings2.target);
          }
        }

        // Check if we need player selection for super over
        const hasPlayers =
          matchData.data.match.currentState?.currentBatsmen?.striker &&
          matchData.data.match.currentState?.currentBowler;
        if (!hasPlayers) {
          setShowPlayerSelection(true);
        }
      } else {
        setIsSuperOver(false);
        setSuperOverNumber(0);
        setSuperOverInnings(1);
        setSuperOverScore({ runs: 0, wickets: 0, balls: 0 });
        setSuperOverTarget(0);
      }

      // If match already completed on backend, set normalized matchResult so UI shows correct modal/button
      if (matchData.data.match?.currentState?.status === "completed") {
        const svcResult = matchData.data.match.result || {};
        const normalized = {
          ...svcResult,
          isTie:
            svcResult?.winType === "tie" ||
            svcResult?.status === "tied" ||
            false,
          description:
            svcResult?.matchSummary ||
            svcResult?.description ||
            svcResult?.summary ||
            "",
        };
        setMatchResult(normalized);
        setShowMatchComplete(true);
      }

      // Use the backend's dynamic current score directly
      const backendScore = matchData.data.currentScore;
      let initialScore;

      if (backendScore) {
        // Backend already calculated the correct current innings score
        initialScore = {
          runs: backendScore.runs || 0,
          wickets: backendScore.wickets || 0,
          overs: backendScore.overs || 0,
          balls: backendScore.balls || 0,
          innings: backendScore.innings || 1,
          extras: backendScore.extras || {
            total: 0,
            wides: 0,
            noballs: 0,
            byes: 0,
            legbyes: 0,
          },
        };

        // Set target score for second innings
        if (
          backendScore.innings === 2 &&
          matchData.data.match.currentState?.target
        ) {
          setTargetScore(matchData.data.match.currentState.target);
        } else if (backendScore.innings === 1) {
          setTargetScore(0); // No target in first innings
        }

        // Set initial bowler stats
        if (matchData.data.currentBowlerStats) {
          setCurrentBowlerStats(matchData.data.currentBowlerStats);
          console.log(
            "Initialized bowler stats:",
            matchData.data.currentBowlerStats
          );
        }
      } else {
        // Fallback for new matches
        initialScore = {
          runs: 0,
          wickets: 0,
          overs: 0,
          balls: 0,
          innings: 1,
          extras: { total: 0, wides: 0, noballs: 0, byes: 0, legbyes: 0 },
        };
      }

      setScore(initialScore);
      console.log("Initialized score from backend:", initialScore);

      // Set available players for selection
      const battingTeam = matchData.data.match.currentState?.battingTeam;
      const bowlingTeam = matchData.data.match.currentState?.bowlingTeam;

      if (battingTeam && bowlingTeam) {
        // Match has started - use specific team players
        const battingTeamPlayers =
          battingTeam.teamId === matchData.data.match.teams.team1.teamId
            ? matchData.data.match.teams.team1.players || []
            : matchData.data.match.teams.team2.players || [];

        const bowlingTeamPlayers =
          bowlingTeam.teamId === matchData.data.match.teams.team1.teamId
            ? matchData.data.match.teams.team1.players || []
            : matchData.data.match.teams.team2.players || [];

        setAvailableBatsmen(battingTeamPlayers);
        setAvailableBowlers(bowlingTeamPlayers);
      } else {
        // Match not started yet - use all players from both teams for selection
        const allTeam1Players = matchData.data.match.teams.team1.players || [];
        const allTeam2Players = matchData.data.match.teams.team2.players || [];

        // For now, let's use team1 for batting and team2 for bowling as default
        // User can select any player, we'll handle team assignment when match starts
        setAvailableBatsmen([...allTeam1Players, ...allTeam2Players]);
        setAvailableBowlers([...allTeam1Players, ...allTeam2Players]);

        console.log(
          "Match not started, available batsmen:",
          allTeam1Players.concat(allTeam2Players)
        );
        console.log(
          "Match not started, available bowlers:",
          allTeam1Players.concat(allTeam2Players)
        );
      }

      // Check if current players are set
      const hasCurrentPlayers =
        matchData.data.match.currentState?.currentBatsmen?.striker &&
        matchData.data.match.currentState?.currentBowler;
      setShowPlayerSelection(!hasCurrentPlayers);

      // Auto-populate current players if they exist
      if (matchData.data.match.currentState?.currentBatsmen) {
        setCurrentStriker(
          matchData.data.match.currentState.currentBatsmen.striker
        );
        setCurrentNonStriker(
          matchData.data.match.currentState.currentBatsmen.nonStriker
        );
      }

      if (matchData.data.match.currentState?.currentBowler) {
        setCurrentBowler(matchData.data.match.currentState.currentBowler);
      }

      // Disconnect existing socket if any
      if (socketRef.current) {
        console.log("🔌 Disconnecting existing socket before creating new one");
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      // Log token info for debugging (without exposing full token)
      console.log("🔑 Token Debug Info:", {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenStart: token?.substring(0, 20) + "...",
        tokenType: typeof token,
        apiBaseUrl: API_BASE_URL,
      });

      // Initialize Socket.IO connection
      const socketConnection = io(API_BASE_URL, {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });

      // Handle connection errors (authentication, network, etc.)
      socketConnection.on("connect_error", (error) => {
        console.error("🚨 WebSocket Connection Error:", {
          message: error.message,
          description: error.description,
          context: error.context,
          type: error.type,
          timestamp: new Date().toISOString(),
        });

        setIsConnected(false);
        setStatus(`Connection failed: ${error.message}`);
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "error",
            message: `❌ Connection error: ${error.message}`,
            time: new Date(),
          },
        ]);

        // If authentication fails, show specific message
        if (error.message.includes("Authentication")) {
          console.error(
            "🔒 Authentication failed - Token may be invalid or expired"
          );
          setLiveUpdates((prev) => [
            ...prev,
            {
              type: "error",
              message:
                "Authentication failed. Please refresh your login token.",
              time: new Date(),
            },
          ]);
        }
      });

      socketConnection.on("connect", () => {
        console.log("✅ Socket connected successfully:", socketConnection.id);
        setIsConnected(true);
        setStatus("Connected - Ready for scoring");
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "system",
            message: "Connected to live scoring server",
            time: new Date(),
          },
        ]);

        // Join match room
        socketConnection.emit("join_match", { matchId });
      });

      socketConnection.on("connection_established", (data) => {
        console.log("🎉 Connection established event received:", data);
        setIsConnected(true);
        setStatus("Connected - Ready for scoring");
      });

      socketConnection.on("disconnect", (reason) => {
        console.log("⚠️ Socket disconnected. Reason:", reason);
        setIsConnected(false);
        setStatus("Disconnected");
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "system",
            message: `Disconnected from server (${reason})`,
            time: new Date(),
          },
        ]);

        // Auto-reconnect if not a deliberate disconnect
        if (reason === "io server disconnect") {
          console.log("🔄 Server disconnected us, attempting to reconnect...");
          setTimeout(() => {
            socketConnection.connect();
          }, 1000);
        }
      });

      socketConnection.on("session_replaced", (data) => {
        console.log("🔄 Session replaced:", data);
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "warning",
            message: "Your session was replaced by another device/tab",
            time: new Date(),
          },
        ]);
      });

      socketConnection.on("score_update", (update) => {
        // Now the score is directly in update.score
        const actualScore = update.score;
        if (actualScore) {
          setScore(actualScore);
          setStatus(
            `Score updated: ${actualScore.runs}/${actualScore.wickets}`
          );
          setLiveUpdates((prev) => [
            ...prev,
            {
              type: "score",
              message: `Score: ${actualScore.runs}/${
                actualScore.wickets
              } (${Math.floor(actualScore.balls / 6)}.${
                actualScore.balls % 6
              })`,
              time: new Date(),
            },
          ]);
        }

        // No need to refresh - score_update already contains latest data
      });

      socketConnection.on("ball_event", (ballData) => {
        // When a new ball is recorded or an event occurs, refresh recent balls
        fetchRecentBalls();

        const totalRuns = ballData.runs?.total || 0;
        const batsmanRuns = ballData.runs?.batsman || 0;
        const extras = ballData.runs?.extras || 0;

        let runMessage = "";
        if (totalRuns === 0) {
          runMessage = "Dot ball";
        } else if (extras > 0 && batsmanRuns === 0) {
          runMessage = `${totalRuns} extras`;
        } else if (extras > 0) {
          runMessage = `${totalRuns} runs (${batsmanRuns} + ${extras} extras)`;
        } else {
          runMessage = `${totalRuns} runs`;
        }

        setStatus(`Ball recorded: ${runMessage}`);
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "ball",
            message: ballData.commentary || runMessage,
            time: new Date(),
          },
        ]);

        // Reset current ball form
        setCurrentBall((prev) => ({
          ...prev,
          runs: 0,
          isWicket: false,
          wicketType: "",
          commentary: "",
          ball: prev.ball + 1,
        }));

        // No need to refresh - ball recording response already has updated stats
      });

      socketConnection.on("match_state_change", (data) => {
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "match",
            message: `Match status: ${data.status}`,
            time: new Date(),
          },
        ]);
      });

      // Listen for undo events
      socketConnection.on("ball_undone", (data) => {
        console.log("🔙 Received undo event:", data);

        // Refresh recent balls to reflect undo
        fetchRecentBalls();

        if (data.newScore) {
          const revertedScore = {
            runs: data.newScore.runs || 0,
            wickets: data.newScore.wickets || 0,
            overs: data.newScore.overs || 0,
            balls: data.newScore.balls || 0,
            innings: data.newScore.innings || score.innings,
            extras: data.newScore.extras || {
              total: 0,
              wides: 0,
              noballs: 0,
              byes: 0,
              legbyes: 0,
            },
          };
          setScore(revertedScore);
        }

        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "undo",
            message: data.message || "Last ball undone",
            time: new Date(),
          },
        ]);

        // No need to refresh - undo event contains reverted state
      });

      socketRef.current = socketConnection;
      setSocket(socketConnection);

      // Fetch recent balls initially
      fetchRecentBalls();
    } catch (error) {
      console.error("🚨 Error initializing scorer:", {
        error: error.message,
        stack: error.stack,
        matchId,
        timestamp: new Date().toISOString(),
      });

      // Handle specific error types
      if (error.message.includes("Failed to fetch match details")) {
        setStatus(
          "❌ Could not load match details. Please check your connection and try refreshing."
        );
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "error",
            message:
              "🔴 Failed to load match details. Please refresh the page or check your connection.",
            time: new Date(),
          },
        ]);
      } else if (
        error.name === "TypeError" &&
        error.message.includes("fetch")
      ) {
        setStatus("❌ Network error. Please check your internet connection.");
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "error",
            message:
              "🌐 Network error. Please check your internet connection and try again.",
            time: new Date(),
          },
        ]);
      } else {
        setStatus(`❌ Initialization error: ${error.message}`);
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "error",
            message: `⚠️ Failed to initialize scorer: ${error.message}`,
            time: new Date(),
          },
        ]);
      }

      // Automatic retry after 5 seconds for network errors
      if (error.name === "TypeError" || error.message.includes("fetch")) {
        setTimeout(() => {
          console.log("🔄 Auto-retrying scorer initialization...");
          setStatus("🔄 Retrying connection...");
          isInitializing.current = false; // Reset flag before retry
          initializeScorer();
        }, 5000);
      }
    } finally {
      // Reset initialization flag
      setTimeout(() => {
        isInitializing.current = false;
      }, 1000);
    }
  };

  // Fetch current over balls API helper
  const fetchRecentBalls = async () => {
    try {
      if (!match?.matchId) return;
      const resp = await fetch(
        `${API_BASE_URL}/api/live-matches/${encodeURIComponent(
          match.matchId
        )}/current-over`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await resp.json();
      if (data && data.success) {
        setRecentBalls(data.balls || []);
      }
    } catch (err) {
      console.error("Failed to fetch current over balls:", err.message || err);
    }
  };

  // Handle player selection
  const updateCurrentPlayers = async (
    striker,
    nonStriker,
    bowler,
    battingTeamId,
    bowlingTeamId
  ) => {
    try {
      setStatus("Updating current players and teams...");

      // Refresh match data to get current status
      const refreshResponse = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const currentMatch = refreshData.data.match;
        setMatch(currentMatch);

        // Only start the match if it hasn't been started yet
        if (currentMatch.currentState.status === "not-started") {
          console.log(
            "Starting match with teams:",
            battingTeamId,
            bowlingTeamId
          );

          // Start the match with the selected teams
          const startMatchResponse = await fetch(
            `${API_BASE_URL}/api/live-matches/${matchId}/start`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                tossWinner:
                  battingTeamId === currentMatch.teams.team1.teamId
                    ? "team1"
                    : "team2",
                tossDecision: "bat", // Since batting team is already selected
                // Don't send empty batting/bowling orders - let the backend use existing lineups
              }),
            }
          );

          if (!startMatchResponse.ok) {
            const errorData = await startMatchResponse.json();
            // If match already started, that's okay - continue with setting players
            if (!errorData.message?.includes("already been started")) {
              throw new Error(
                `Failed to start match: ${errorData.message || "Unknown error"}`
              );
            }
          }
        } else {
          console.log(
            "Match already started, status:",
            currentMatch.currentState.status
          );
        }
      }

      // Then update current players
      const response = await fetch(
        `${API_BASE_URL}/api/live-matches/${matchId}/current-players`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentBatsmen: {
              striker: striker,
              nonStriker: nonStriker,
            },
            currentBowler: bowler,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to update current players: ${
            errorData.message || "Unknown error"
          }`
        );
      }

      // Update local state
      setCurrentStriker(striker);
      setCurrentNonStriker(nonStriker);
      setCurrentBowler(bowler);
      setCurrentBall((prev) => ({
        ...prev,
        batsman: striker,
        bowler: bowler,
      }));
      setShowPlayerSelection(false);
      setStatus("Players set - Ready for scoring");

      // Refresh match data
      setTimeout(() => {
        initializeScorer();
      }, 1000);
    } catch (error) {
      console.error("🚨 Error updating current players:", {
        error: error.message,
        stack: error.stack,
        players: { striker, nonStriker, bowler },
        teams: { battingTeamId, bowlingTeamId },
        timestamp: new Date().toISOString(),
      });

      // Handle specific error types
      if (error.message.includes("fetch")) {
        setStatus("❌ Network error while updating players. Please try again.");
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "error",
            message:
              "🌐 Network error while updating players. Please check your connection.",
            time: new Date(),
          },
        ]);
      } else if (
        error.message.includes("400") ||
        error.message.includes("validation")
      ) {
        setStatus("❌ Invalid player selection. Please check your choices.");
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "error",
            message:
              "⚠️ Invalid player selection. Please verify striker, non-striker, and bowler are correctly chosen.",
            time: new Date(),
          },
        ]);
      } else {
        setStatus(`❌ Player update error: ${error.message}`);
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "error",
            message: `🔴 Failed to update players: ${error.message}`,
            time: new Date(),
          },
        ]);
      }

      // Auto-retry mechanism for network errors
      if (error.message.includes("fetch") || error.name === "TypeError") {
        console.log("🔄 Auto-retrying player update in 2 seconds...");
        setTimeout(() => {
          console.log("🔄 Retrying player update...");
          setStatus("🔄 Retrying player update...");
          updateCurrentPlayers(
            striker,
            nonStriker,
            bowler,
            battingTeamId,
            bowlingTeamId
          );
        }, 2000);
      }
    }
  };

  // Function to handle the actual ball recording API call
  const processBallRecording = async (
    currentBatsmen,
    currentBowler,
    ballDataOverride = null
  ) => {
    const startTime = Date.now();
    let retryCount = 0;
    const maxRetries = 3;

    // Validate inputs
    try {
      if (
        !currentBatsmen ||
        !currentBatsmen.striker ||
        !currentBatsmen.nonStriker
      ) {
        throw new Error(
          "❌ Invalid batsmen data - striker and non-striker are required"
        );
      }

      if (!currentBowler || !currentBowler.playerId) {
        throw new Error(
          "❌ Invalid bowler data - bowler information is required"
        );
      }

      if (!matchId || !token) {
        throw new Error("❌ Missing match ID or authentication token");
      }

      console.log("🏏 Starting ball recording process...", {
        matchId,
        ballType: ballDataOverride?.ballType || currentBall.ballType,
        striker: currentBatsmen.striker?.playerName,
        bowler: currentBowler?.playerName,
      });
    } catch (validationError) {
      console.error("🚨 Validation Error:", validationError.message);
      setStatus(`Validation Error: ${validationError.message}`);
      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "error",
          message: `❌ ${validationError.message}`,
          time: new Date(),
        },
      ]);
      return;
    }

    // Ball recording with retry logic
    while (retryCount <= maxRetries) {
      try {
        // Check if we're offline
        if (!isOnline) {
          throw new Error(
            "You are currently offline. Please check your internet connection."
          );
        }

        const ballToRecord = ballDataOverride || currentBall;
        const ballData = {
          // Ball identification
          innings: ballToRecord.innings,
          over: ballToRecord.over,
          ball: ballToRecord.ball,

          // Ball details
          ballType: ballToRecord.ballType,
          legalDelivery: ballToRecord.ballType === "legal",

          // Players
          batsman: {
            playerId: currentBatsmen.striker.playerId,
            playerName: currentBatsmen.striker.playerName,
            isStriker: true,
          },
          nonStriker: {
            playerId: currentBatsmen.nonStriker.playerId,
            playerName: currentBatsmen.nonStriker.playerName,
          },
          bowler: {
            playerId: currentBowler.playerId,
            playerName: currentBowler.playerName,
          },

          // Scoring - Fixed according to cricket rules
          runs: {
            // Calculate total, batsman, and extras according to proper cricket rules
            ...(function () {
              const ballType = ballToRecord.ballType;
              const runsInput = ballToRecord.runs || 0;
              const extrasInput = ballToRecord.extras || 0;

              switch (ballType) {
                case "wide":
                  // Wide: Team gets 1 auto + any additional runs, ALL go to extras, batsman gets 0
                  const wideTotal = 1 + runsInput;
                  return {
                    total: wideTotal,
                    batsman: 0, // Batsman gets nothing on wide
                    extras: wideTotal, // All runs count as wide extras
                  };

                case "no-ball":
                  // No-ball: Team gets 1 auto + batsman runs, only 1 auto counts as extra
                  const noBallTotal = 1 + runsInput;
                  return {
                    total: noBallTotal,
                    batsman: runsInput, // Batsman gets the runs they scored
                    extras: 1, // Only the auto run counts as no-ball extra
                  };

                case "bye":
                  // Bye: All runs are extras (byes), batsman gets 0
                  return {
                    total: runsInput,
                    batsman: 0,
                    extras: runsInput, // All runs are bye extras
                  };

                case "leg-bye":
                  // Leg-bye: All runs are extras (leg-byes), batsman gets 0
                  return {
                    total: runsInput,
                    batsman: 0,
                    extras: runsInput, // All runs are leg-bye extras
                  };

                case "legal":
                default:
                  // Legal ball: All runs to batsman, no extras
                  return {
                    total: runsInput,
                    batsman: runsInput,
                    extras: 0,
                  };
              }
            })(),
            boundaries: {
              four:
                ballToRecord.runs === 4 && ballToRecord.ballType === "legal",
              six: ballToRecord.runs === 6 && ballToRecord.ballType === "legal",
            },
          },

          // Wicket information
          wicket: ballToRecord.isWicket
            ? {
                isWicket: true,
                wicketType: ballToRecord.wicketType,
                dismissedPlayer: ballToRecord.wicket?.dismissedPlayer || {
                  playerId: currentBatsmen.striker.playerId,
                  playerName: currentBatsmen.striker.playerName,
                },
                fielder: ballToRecord.fielder
                  ? {
                      playerId: ballToRecord.fielder.playerId,
                      playerName: ballToRecord.fielder.playerName,
                    }
                  : null,
                assistFielder: ballToRecord.assistantFielder
                  ? {
                      playerId: ballToRecord.assistantFielder.playerId,
                      playerName: ballToRecord.assistantFielder.playerName,
                    }
                  : null,
              }
            : { isWicket: false },

          // Commentary
          commentary: ballToRecord.commentary || "",
        };

        // Debug the scoring calculation according to your table
        console.log("🏏 FRONTEND SCORING CALCULATION DEBUG:", {
          "=== INPUT DATA ===": {
            ballType: ballToRecord.ballType,
            inputRuns: ballToRecord.runs,
            inputExtras: ballToRecord.extras,
          },
          "=== CALCULATED ACCORDING TO CRICKET RULES TABLE ===": {
            teamScore: `+${ballData.runs.total}`,
            extras: `+${ballData.runs.extras} (${ballToRecord.ballType} extras)`,
            batsmanScore: `+${ballData.runs.batsman}`,
            breakdown:
              ballToRecord.ballType === "wide"
                ? `Wide: 1 auto + ${ballToRecord.runs} additional = ${ballData.runs.total} total (all as wide extras)`
                : ballToRecord.ballType === "no-ball"
                ? `No-ball: 1 auto + ${ballToRecord.runs} batsman = ${ballData.runs.total} total (only 1 auto as extra)`
                : ballToRecord.ballType === "bye"
                ? `Bye: ${ballToRecord.runs} running = ${ballData.runs.total} total (all as bye extras)`
                : ballToRecord.ballType === "leg-bye"
                ? `Leg-bye: ${ballToRecord.runs} running = ${ballData.runs.total} total (all as leg-bye extras)`
                : `Legal: ${ballToRecord.runs} runs to batsman = ${ballData.runs.total} total`,
          },
          "=== VERIFICATION AGAINST YOUR TABLE ===": {
            matchesWideRule:
              ballToRecord.ballType === "wide"
                ? `✅ Wide+${ballToRecord.runs} = Team+${ballData.runs.total}, Extras+${ballData.runs.extras}, Batsman+${ballData.runs.batsman}`
                : "N/A",
            matchesNoBallRule:
              ballToRecord.ballType === "no-ball"
                ? `✅ No-ball+${ballToRecord.runs} = Team+${ballData.runs.total}, Extras+${ballData.runs.extras}, Batsman+${ballData.runs.batsman}`
                : "N/A",
            matchesLegalRule:
              ballToRecord.ballType === "legal"
                ? `✅ Legal ${ballToRecord.runs} = Team+${ballData.runs.total}, Extras+${ballData.runs.extras}, Batsman+${ballData.runs.batsman}`
                : "N/A",
            matchesByeRule:
              ballToRecord.ballType === "bye"
                ? `✅ Bye+${ballToRecord.runs} = Team+${ballData.runs.total}, Extras+${ballData.runs.extras}, Batsman+${ballData.runs.batsman}`
                : "N/A",
          },
        });

        console.log("Ball data being sent:", ballData);

        // Set loading state
        setStatus("Recording ball...");

        // API call with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(
          `${API_BASE_URL}/api/live-matches/${matchId}/ball`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(ballData),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`;
          throw new Error(`API Error: ${errorMessage}`);
        }

        const responseData = await response.json();
        console.log("🏏 Ball recorded successfully! Response:", {
          success: responseData.success,
          commentary: responseData.data?.ball?.commentary,
          strikeRotation: {
            oldStriker: ballData.batsman.playerName,
            newStriker:
              responseData.data?.currentState?.currentBatsmen?.striker
                ?.playerName,
            rotated:
              ballData.batsman.playerId !==
              responseData.data?.currentState?.currentBatsmen?.striker
                ?.playerId,
          },
          overInfo: {
            ballsInOver: responseData.data?.score?.balls % 6,
            wasLegalBall:
              ballData.ballType === "legal" ||
              ballData.ballType === "bye" ||
              ballData.ballType === "leg-bye",
            overCompleted:
              responseData.data?.score?.balls % 6 === 0 &&
              (ballData.ballType === "legal" ||
                ballData.ballType === "bye" ||
                ballData.ballType === "leg-bye"),
          },
        });

        // Update match state from the optimized response
        if (responseData.data) {
          const data = responseData.data;

          // Debug: Log the optimized response structure
          console.log("🔍 Backend returned optimized data:", {
            strikerInResponse: {
              id: data.currentState?.currentBatsmen?.striker?.playerId,
              name: data.currentState?.currentBatsmen?.striker?.playerName,
            },
            nonStrikerInResponse: {
              id: data.currentState?.currentBatsmen?.nonStriker?.playerId,
              name: data.currentState?.currentBatsmen?.nonStriker?.playerName,
            },
            updatedPlayersCount: Object.keys(data.updatedPlayers || {}).filter(
              (k) => data.updatedPlayers[k] !== null
            ).length,
          });

          // Update match state incrementally (only changed parts)
          setMatch((prevMatch) => {
            const updatedMatch = { ...prevMatch };

            // Update current state
            if (data.currentState) {
              updatedMatch.currentState = {
                ...updatedMatch.currentState,
                ...data.currentState,
              };
            }

            // Update match status if match is completed
            if (data.inningsStatus?.matchCompleted) {
              updatedMatch.currentState = {
                ...updatedMatch.currentState,
                status: "completed",
                result: data.inningsStatus.matchResult,
              };
              if (!updatedMatch.timing) {
                updatedMatch.timing = {};
              }
              updatedMatch.timing.endTime = new Date();
              updatedMatch.completedAt = new Date();
            }

            // Update only the affected players
            if (data.updatedPlayers) {
              console.log(
                "🔄 Updating player stats from ball response:",
                data.updatedPlayers
              );

              // Helper function to find and update player in either team
              const updatePlayerInMatch = (playerId, playerData) => {
                if (!playerId || !playerData) return;

                // Try to find in team1
                let playerIndex = updatedMatch.teams.team1.players.findIndex(
                  (p) => p.playerId.toString() === playerId.toString()
                );

                if (playerIndex !== -1) {
                  // Found in team1, update it
                  console.log(
                    `✅ Updating ${playerData.playerName} stats in team1:`,
                    {
                      batting: playerData.batting,
                      bowling: playerData.bowling,
                    }
                  );
                  updatedMatch.teams.team1.players[playerIndex] = {
                    ...updatedMatch.teams.team1.players[playerIndex],
                    ...playerData,
                  };
                } else {
                  // Try to find in team2
                  playerIndex = updatedMatch.teams.team2.players.findIndex(
                    (p) => p.playerId.toString() === playerId.toString()
                  );

                  if (playerIndex !== -1) {
                    // Found in team2, update it
                    console.log(
                      `✅ Updating ${playerData.playerName} stats in team2:`,
                      {
                        batting: playerData.batting,
                        bowling: playerData.bowling,
                      }
                    );
                    updatedMatch.teams.team2.players[playerIndex] = {
                      ...updatedMatch.teams.team2.players[playerIndex],
                      ...playerData,
                    };
                  } else {
                    console.warn(
                      `⚠️ Player ${playerData.playerName} (${playerId}) not found in either team!`
                    );
                  }
                }
              };

              // Update striker
              if (data.updatedPlayers.striker) {
                updatePlayerInMatch(
                  data.updatedPlayers.striker.playerId,
                  data.updatedPlayers.striker
                );
              }

              // Update non-striker
              if (data.updatedPlayers.nonStriker) {
                updatePlayerInMatch(
                  data.updatedPlayers.nonStriker.playerId,
                  data.updatedPlayers.nonStriker
                );
              }

              // Update bowler
              if (data.updatedPlayers.bowler) {
                updatePlayerInMatch(
                  data.updatedPlayers.bowler.playerId,
                  data.updatedPlayers.bowler
                );
              }

              // Update fielder if applicable
              if (data.updatedPlayers.fielder) {
                updatePlayerInMatch(
                  data.updatedPlayers.fielder.playerId,
                  data.updatedPlayers.fielder
                );
              }
            }

            // Update score in match object
            if (data.score) {
              const currentInnings = data.currentState?.currentInnings || 1;
              if (currentInnings === 1) {
                updatedMatch.score.innings1 = {
                  ...updatedMatch.score.innings1,
                  runs: data.score.runs,
                  wickets: data.score.wickets,
                  overs: data.score.overs,
                  balls: data.score.balls,
                  runRate: data.score.runRate,
                  extras: data.score.extras,
                };
              } else {
                updatedMatch.score.innings2 = {
                  ...updatedMatch.score.innings2,
                  runs: data.score.runs,
                  wickets: data.score.wickets,
                  overs: data.score.overs,
                  balls: data.score.balls,
                  runRate: data.score.runRate,
                  extras: data.score.extras,
                };
              }
            }

            // Update partnerships
            if (data.currentPartnership) {
              const partnershipIndex = updatedMatch.partnerships?.findIndex(
                (p) =>
                  p.isActive && p.innings === data.currentState.currentInnings
              );
              if (partnershipIndex !== -1) {
                updatedMatch.partnerships[partnershipIndex] =
                  data.currentPartnership;
              } else if (updatedMatch.partnerships) {
                updatedMatch.partnerships.push(data.currentPartnership);
              }
            }

            // Update fall of wickets
            if (data.lastWicket) {
              if (!updatedMatch.fallOfWickets) {
                updatedMatch.fallOfWickets = [];
              }
              updatedMatch.fallOfWickets.push(data.lastWicket);
            }

            return updatedMatch;
          });

          // Update current batsmen (important for strike rotation)
          if (data.currentState && data.currentState.currentBatsmen) {
            console.log("🔄 Updating batsmen from backend response:", {
              oldStriker:
                match?.currentState?.currentBatsmen?.striker?.playerName,
              oldNonStriker:
                match?.currentState?.currentBatsmen?.nonStriker?.playerName,
              newStriker: data.currentState.currentBatsmen.striker?.playerName,
              newNonStriker:
                data.currentState.currentBatsmen.nonStriker?.playerName,
              rotationHappened:
                match?.currentState?.currentBatsmen?.striker?.playerId !==
                data.currentState.currentBatsmen.striker?.playerId,
            });

            setCurrentStriker(data.currentState.currentBatsmen.striker);
            setCurrentNonStriker(data.currentState.currentBatsmen.nonStriker);

            // Update current bowler if available
            if (data.currentState.currentBowler) {
              setCurrentBowler(data.currentState.currentBowler);
            }
          }

          // Update current bowler stats from the response
          if (data.updatedPlayers && data.updatedPlayers.bowler) {
            console.log("🎳 Updating bowler stats in real-time:", {
              bowlerName: data.updatedPlayers.bowler.playerName,
              bowlingStats: data.updatedPlayers.bowler.bowling,
            });

            setCurrentBowlerStats({
              playerId: data.updatedPlayers.bowler.playerId,
              playerName: data.updatedPlayers.bowler.playerName,
              balls: data.updatedPlayers.bowler.bowling?.balls || 0,
              runs: data.updatedPlayers.bowler.bowling?.runs || 0,
              wickets: data.updatedPlayers.bowler.bowling?.wickets || 0,
              overs: data.updatedPlayers.bowler.bowling?.overs || 0,
              economyRate: data.updatedPlayers.bowler.bowling?.economyRate || 0,
            });
          }

          // Update score from the response
          if (data.score) {
            setScore(data.score);
          }

          // Handle innings status from backend
          if (data.inningsStatus) {
            const {
              inningsComplete,
              requiresInningsTransition,
              requiresMatchCompletion,
              matchCompleted,
              matchResult,
              isLastBallOfInnings,
              ballsRemaining,
              oversRemaining,
              target,
              targetRemaining,
            } = data.inningsStatus;

            console.log("🏏 Innings Status:", {
              inningsComplete,
              requiresInningsTransition,
              requiresMatchCompletion,
              matchCompleted,
              isLastBallOfInnings,
              ballsRemaining,
              oversRemaining,
            });

            // Show target information for second innings
            if (target && targetRemaining !== undefined) {
              const message = `Target: ${target} runs | Need ${Math.max(
                0,
                targetRemaining
              )} runs in ${ballsRemaining} balls`;
              setStatus(message);
              setLiveUpdates((prev) => [
                ...prev,
                {
                  type: "info",
                  message: `🎯 ${message}`,
                  time: new Date(),
                },
              ]);
            }

            // Handle match completion
            if (matchCompleted || requiresMatchCompletion) {
              console.log("🏆 MATCH COMPLETED!");

              // Set match result from backend
              if (matchResult) {
                setMatchResult(matchResult);
              } else {
                // Calculate result if not provided
                const result = calculateMatchResult(data.score || score);
                setMatchResult(result);
              }

              setStatus("🏆 MATCH COMPLETED!");
              setShowMatchComplete(true);
              return;
            }

            // Handle innings completion
            if (inningsComplete) {
              console.log("🏁 INNINGS COMPLETED!");

              if (requiresMatchCompletion) {
                // Match completed - show match complete dialog
                console.log("🏆 MATCH COMPLETED!");
                setStatus("🏆 MATCH COMPLETED!");
                setShowMatchComplete(true);
                return;
              } else if (requiresInningsTransition) {
                // First innings completed - show innings break
                console.log(
                  "🔄 First innings completed - transitioning to second innings"
                );

                // Calculate and set target for second innings
                const calculatedTarget = target || (score?.runs || 0) + 1;
                console.log(
                  "🎯 Setting target for second innings:",
                  calculatedTarget
                );
                setTargetScore(calculatedTarget);

                setStatus(
                  "🏁 First innings completed! Preparing for second innings..."
                );
                setShowInningsBreak(true);
                return;
              } else {
                // Innings complete but no automatic transition (e.g., manual control needed)
                setStatus("🏁 Innings completed!");
                return;
              }
            }
          }

          // Update live updates feed with proper commentary
          const commentary =
            data.ball?.commentary || `${ballData.runs.total} runs scored`;
          setLiveUpdates((prev) => [
            ...prev,
            {
              type: "success",
              message: commentary,
              time: new Date(),
            },
          ]);

          // If stumping occurred, display immediate points awarded info
          if (
            ballData.wicket &&
            ballData.wicket.isWicket &&
            (ballData.wicket.wicketType || data.ball?.wicket?.wicketType) ===
              "stumped"
          ) {
            const keeperName =
              data.ball?.wicket?.fielder?.playerName ||
              ballData.fielder?.playerName ||
              "Wicket Keeper";
            const bowlerName =
              data.updatedPlayers?.bowler?.playerName ||
              ballData.bowler?.playerName ||
              "Bowler";

            setLiveUpdates((prev) => [
              ...prev,
              {
                type: "info",
                message: `✅ Stumping credited: ${keeperName} (WK) +1 pt, ${bowlerName} +1 pt`,
                time: new Date(),
              },
            ]);

            // Update local status banner as well
            setStatus(
              `Stumping: ${keeperName} (WK) +1 pt, ${bowlerName} +1 pt`
            );

            // Add to recentPoints for quick frontend reflection
            try {
              const keeperId =
                data.updatedPlayers?.fielder?.playerId ||
                ballData.wicket?.fielder?.playerId ||
                null;
              const bowlerId =
                data.updatedPlayers?.bowler?.playerId ||
                ballData.bowler?.playerId ||
                null;
              const keeperPoints =
                data.updatedPlayers?.fielder?.pointsAwarded?.stumpingBonus || 1;
              const bowlerPoints =
                data.updatedPlayers?.bowler?.pointsAwarded?.stumpingBonus || 1;

              const entries = [];
              if (keeperId) {
                entries.push({
                  playerId: keeperId,
                  playerName: keeperName,
                  points: keeperPoints,
                  reason: "Stumping",
                });
              }
              if (bowlerId) {
                entries.push({
                  playerId: bowlerId,
                  playerName: bowlerName,
                  points: bowlerPoints,
                  reason: "Stumping",
                });
              }

              if (entries.length) {
                setRecentPoints((prev) => [
                  ...entries,
                  ...prev.slice(0, 9), // keep last 10
                ]);
              }
            } catch (err) {
              console.warn("Could not record recent points:", err.message);
            }
          }

          // Check for over completion (need new bowler selection)
          if (data.score) {
            const ballsInOver = data.score.balls % 6;
            const wasLegalBall =
              ballData.ballType === "legal" ||
              ballData.ballType === "bye" ||
              ballData.ballType === "leg-bye";

            console.log("🏏 Over completion check:", {
              totalBalls: data.score.balls,
              ballsInOver,
              wasLegalBall,
              ballType: ballData.ballType,
              shouldShowModal: ballsInOver === 0 && wasLegalBall,
            });

            if (ballsInOver === 0 && wasLegalBall) {
              // Over completed, show new bowler selection
              console.log("✅ Over completed! Showing bowler selection modal");
              setShowNewBowlerSelection(true);
            }
          }

          // Check for wicket (need new batsman selection)
          if (ballData.wicket && ballData.wicket.isWicket) {
            const dismissedPlayer =
              ballData.wicket.dismissedPlayer ||
              (ballData.wicket.wicketType === "run-out"
                ? null
                : data.currentState?.currentBatsmen?.striker);
            if (dismissedPlayer) {
              console.log(
                "🏏 WICKET DETECTED! Showing batsman replacement modal:",
                {
                  wicketType: ballData.wicket.wicketType,
                  dismissedPlayer: dismissedPlayer.playerName,
                  runsScored: ballData.runs?.batsman || 0,
                  willRotateStrike:
                    ballData.wicket.wicketType === "run-out" &&
                    ballData.runs?.batsman % 2 === 1,
                }
              );

              setOutBatsman(dismissedPlayer);
              setWicketBallData(ballData); // Store ball data for strike rotation logic
              setShowNewBatsmanSelection(true);
            }
          }

          setStatus("Ball recorded successfully");
        }

        // Reset only the ball form for next delivery
        resetCurrentBall();

        // Success - break out of retry loop
        const duration = Date.now() - startTime;
        console.log(
          `✅ Ball recording completed successfully in ${duration}ms`
        );
        return;
      } catch (error) {
        retryCount++;
        console.error(
          `🚨 Ball Recording Error (Attempt ${retryCount}/${maxRetries + 1}):`,
          {
            error: error.message,
            stack: error.stack,
            matchId,
            retryCount,
            timestamp: new Date().toISOString(),
          }
        );

        // Handle specific error types
        if (error.name === "AbortError") {
          setStatus(
            "❌ Request timeout - Server is taking too long to respond"
          );
          addGlobalError(
            "The server is taking too long to respond. Please check your connection and try again.",
            "timeout",
            () =>
              processBallRecording(
                currentBatsmen,
                currentBowler,
                ballDataOverride
              )
          );
        } else if (error.message.includes("fetch")) {
          setStatus("❌ Network error - Please check your connection");
          addGlobalError(
            "Unable to connect to the server. Please check your internet connection.",
            "network",
            () =>
              processBallRecording(
                currentBatsmen,
                currentBowler,
                ballDataOverride
              )
          );
        } else if (error.message.includes("API Error")) {
          setStatus(`❌ Server error: ${error.message}`);
          addGlobalError(
            `Server responded with an error: ${error.message}`,
            "api",
            () =>
              processBallRecording(
                currentBatsmen,
                currentBowler,
                ballDataOverride
              )
          );
        } else {
          setStatus(`❌ Unexpected error: ${error.message}`);
          addGlobalError(
            `An unexpected error occurred: ${error.message}`,
            "critical",
            () =>
              processBallRecording(
                currentBatsmen,
                currentBowler,
                ballDataOverride
              )
          );
        }

        // If we've exhausted retries, stop trying
        if (retryCount > maxRetries) {
          console.error("🚨 Ball recording failed after all retry attempts");
          setLiveUpdates((prev) => [
            ...prev,
            {
              type: "error",
              message:
                "❌ Ball recording failed after multiple attempts. Please try recording the ball again.",
              time: new Date(),
            },
          ]);
          break;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        console.log(`⏳ Retrying in ${delay}ms...`);
        setStatus(`⏳ Retrying... (${retryCount}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const recordBall = async () => {
    if (!match || !socket) {
      setStatus("Not connected to match");
      return;
    }

    try {
      setStatus("Recording ball...");

      // Check if match is started and has players set
      if (match.currentState?.status !== "in-progress") {
        setStatus("Error: Match is not in progress. Start the match first!");
        return;
      }

      // SUPER OVER MODE - Use different ball limit (6 balls)
      if (isSuperOver) {
        const superOverMaxBalls = 6;
        const currentSuperOverBalls = superOverScore.balls || 0;

        if (currentSuperOverBalls >= superOverMaxBalls) {
          setStatus("⚠️ Super Over innings complete!");
          return;
        }

        // Get current batsman and bowler from match state
        const currentBatsmen = match.currentState?.currentBatsmen;
        const currentBowlerData = match.currentState?.currentBowler;

        if (!currentBatsmen?.striker || !currentBatsmen?.nonStriker) {
          setStatus("Error: No batsmen set for super over!");
          setShowSuperOverPlayerSelection(true);
          return;
        }

        if (!currentBowlerData) {
          setStatus("Error: No bowler set for super over!");
          setShowSuperOverPlayerSelection(true);
          return;
        }

        // Build super over ball data
        const ballType = currentBall.ballType || "legal";
        const runsInput = currentBall.runs || 0;

        // Calculate runs based on ball type
        let totalRuns = runsInput;
        let batsmanRuns = runsInput;
        let extrasRuns = 0;

        if (ballType === "wide" || ballType === "no-ball") {
          totalRuns = 1 + runsInput;
          extrasRuns = ballType === "wide" ? totalRuns : 1;
          batsmanRuns = ballType === "wide" ? 0 : runsInput;
        } else if (ballType === "bye" || ballType === "leg-bye") {
          batsmanRuns = 0;
          extrasRuns = runsInput;
        }

        const superOverBallData = {
          ballType: ballType,
          runs: {
            total: totalRuns,
            batsman: batsmanRuns,
            extras: extrasRuns,
            boundaries: {
              four: runsInput === 4 && ballType === "legal",
              six: runsInput === 6 && ballType === "legal",
            },
          },
          batsman: {
            playerId: currentBatsmen.striker.playerId,
            playerName: currentBatsmen.striker.playerName,
          },
          nonStriker: {
            playerId: currentBatsmen.nonStriker.playerId,
            playerName: currentBatsmen.nonStriker.playerName,
          },
          bowler: {
            playerId: currentBowlerData.playerId,
            playerName: currentBowlerData.playerName,
          },
          wicket: currentBall.isWicket
            ? {
                isWicket: true,
                wicketType: currentBall.wicketType,
                dismissedPlayer: currentBall.wicket?.dismissedPlayer || {
                  playerId: currentBatsmen.striker.playerId,
                  playerName: currentBatsmen.striker.playerName,
                },
                fielder: currentBall.fielder || null,
              }
            : { isWicket: false },
        };

        // Handle wicket special cases for super over
        if (
          currentBall.isWicket &&
          currentBall.wicketType === "run-out" &&
          !currentBall.wicket?.dismissedPlayer
        ) {
          setShowRunOutSelection(true);
          setPendingBallData({
            currentBatsmen,
            currentBowler: currentBowlerData,
            isSuperOver: true,
          });
          return;
        }

        if (
          currentBall.isWicket &&
          currentBall.wicketType === "caught" &&
          !currentBall.fielder
        ) {
          setShowFielderSelection(true);
          setPendingBallData({
            currentBatsmen,
            currentBowler: currentBowlerData,
            isSuperOver: true,
          });
          return;
        }

        // Record the super over ball
        await recordSuperOverBall(superOverBallData);
        return;
      }

      // NORMAL MATCH MODE
      // Get match overs limit (dynamic based on match configuration)
      const maxOvers = match.overs || 20;
      const maxBalls = maxOvers * 6;

      // Check if current innings has already completed max overs
      const currentBalls = score.balls || 0;
      const currentOvers = Math.floor(currentBalls / 6);
      const ballsInCurrentOver = currentBalls % 6;

      if (currentBalls >= maxBalls) {
        const message = `⚠️ INNINGS COMPLETED! ${maxOvers} overs limit reached (${currentOvers}.${ballsInCurrentOver} overs, ${currentBalls} balls)`;
        setStatus(message);
        addGlobalError(
          `Cannot bowl more than ${maxOvers} overs in an innings. The current innings is already completed.`,
          "validation",
          () => {
            console.log("🏁 Innings completed - transition required");
          }
        );
        return;
      }

      // Check if this is the last ball of innings or second-last ball (show warning)
      const ballType = currentBall.ballType || "legal";
      const isLegalDelivery =
        ballType === "legal" || ballType === "bye" || ballType === "leg-bye";
      const isLastBallOfInnings =
        isLegalDelivery && currentBalls === maxBalls - 1;
      const isSecondLastBall = isLegalDelivery && currentBalls === maxBalls - 2;

      // Get current batsman and bowler from match state
      const currentBatsmen = match.currentState?.currentBatsmen;
      const currentBowler = match.currentState?.currentBowler;

      if (!currentBatsmen?.striker || !currentBatsmen?.nonStriker) {
        setStatus(
          "Error: No batsmen set. Make sure match is started properly!"
        );
        return;
      }

      if (!currentBowler) {
        setStatus("Error: No bowler set. Make sure match is started properly!");
        return;
      }

      // Special handling for wickets - PRIORITIZE FIELDER SELECTION BEFORE LAST BALL CHECK
      if (currentBall.isWicket) {
        // For run-out, ask which batsman got out
        if (currentBall.wicketType === "run-out") {
          setShowRunOutSelection(true);
          setPendingBallData({
            currentBatsmen,
            currentBowler,
            isLastBallOfInnings,
          });
          return;
        }

        // For caught, ask for fielder if not already set - MUST BE DONE BEFORE LAST BALL CONFIRMATION
        if (currentBall.wicketType === "caught" && !currentBall.fielder) {
          setShowFielderSelection(true);
          setPendingBallData({
            currentBatsmen,
            currentBowler,
            isLastBallOfInnings,
          });
          return;
        }

        // For stumped, auto-assign the wicket to the wicket-keeper (don't prompt a catch modal)
        if (currentBall.wicketType === "stumped" && !currentBall.fielder) {
          try {
            const bowlingTeamId = match.currentState.bowlingTeam?.teamId;
            const bowlingTeam =
              match.teams.team1.teamId === bowlingTeamId
                ? match.teams.team1
                : match.teams.team2;

            // Prefer the designated wicketKeeper object on team if available
            const keeper = bowlingTeam?.wicketKeeper
              ? bowlingTeam.wicketKeeper
              : (bowlingTeam?.players || []).find((p) =>
                  isWicketKeeper(p.playerId)
                );

            if (keeper) {
              // Auto-assign fielder as keeper for stumping
              const autoFielder = {
                playerId: keeper.playerId,
                playerName: keeper.playerName,
              };
              setCurrentBall((prev) => ({
                ...prev,
                fielder: autoFielder,
                autoAssignedFielder: true,
              }));
              setStatus(`Auto-assigned wicket to keeper: ${keeper.playerName}`);
              // continue to process ball (no modal)
            } else {
              // If no keeper found, fall back to asking for fielder
              setShowFielderSelection(true);
              setPendingBallData({
                currentBatsmen,
                currentBowler,
                isLastBallOfInnings,
              });
              return;
            }
          } catch (err) {
            console.warn(
              "Failed to auto-assign keeper for stumping:",
              err.message
            );
            setShowFielderSelection(true);
            setPendingBallData({
              currentBatsmen,
              currentBowler,
              isLastBallOfInnings,
            });
            return;
          }
        }
      }

      // Check for winning ball in second innings BEFORE last ball confirmation
      if (match.currentState?.currentInnings === 2) {
        const target =
          match.currentState?.target || match.score?.innings2?.target || 0;
        const currentRuns = score.runs || 0;
        const runsToAdd = currentBall.runs || 0;
        const totalRunsAfterBall = currentRuns + runsToAdd;

        console.log("🎯 Checking winning ball scenario:", {
          currentInnings: match.currentState.currentInnings,
          target,
          currentRuns,
          runsToAdd,
          totalRunsAfterBall,
          willWin: totalRunsAfterBall >= target,
        });

        // If this ball will win the match, ask for confirmation
        if (target > 0 && totalRunsAfterBall >= target) {
          console.log("🏆 WINNING BALL DETECTED - Showing confirmation");
          setStatus(
            `🎯 This ball will achieve the target! Confirm winning ball.`
          );
          setPendingWinningBall({
            currentBatsmen,
            currentBowler,
            isLastBallOfInnings,
          });
          setShowWinningBallConfirmation(true);
          return;
        }
      }

      // AFTER wicket and winning ball handling, check for last ball confirmation
      // Show confirmation dialog for last ball of innings
      if (isLastBallOfInnings) {
        console.log(
          "🏁 This is the last ball of the innings - showing confirmation"
        );
        setStatus(
          `⚠️ FINAL BALL of ${maxOvers} overs - Confirm to complete innings`
        );
        setPendingLastBall({ currentBatsmen, currentBowler });
        setShowLastBallConfirmation(true);
        return;
      }

      // Show warning for second-last ball
      if (isSecondLastBall) {
        console.log("⚠️ Second-last ball of the innings");
        setStatus(
          `⚠️ Only 1 ball remaining after this in ${maxOvers} over innings`
        );
      } else if (isLegalDelivery && currentBalls >= maxBalls - 6) {
        // Warning for last over
        const ballsLeft = maxBalls - currentBalls;
        setStatus(`⚠️ Last over - ${ballsLeft} balls remaining`);
      }

      // Proceed with normal ball recording
      await processBallRecording(currentBatsmen, currentBowler);
    } catch (error) {
      setStatus(`Error recording ball: ${error.message}`);
      setLiveUpdates((prev) => [
        ...prev,
        { type: "error", message: `Error: ${error.message}`, time: new Date() },
      ]);
    }
  };

  // Wicket handling functions
  const handleRunOutSelection = (selectedBatsmanId) => {
    if (!pendingBallData) return;

    const selectedBatsman =
      selectedBatsmanId === pendingBallData.currentBatsmen.striker.playerId
        ? pendingBallData.currentBatsmen.striker
        : pendingBallData.currentBatsmen.nonStriker;

    // Set the dismissed player for run-out
    setCurrentBall((prev) => ({
      ...prev,
      wicket: {
        ...prev.wicket,
        dismissedPlayer: selectedBatsman,
      },
    }));

    setShowRunOutSelection(false);

    // Continue with ball recording
    processBallRecording(
      pendingBallData.currentBatsmen,
      pendingBallData.currentBowler
    );
    setPendingBallData(null);
  };

  const handleFielderSelection = (fielderId) => {
    if (!match || !pendingBallData) return;

    // Find fielder from bowling team
    const bowlingTeamId = match.currentState.bowlingTeam.teamId;
    const bowlingTeam =
      match.teams.team1.teamId === bowlingTeamId
        ? match.teams.team1
        : match.teams.team2;
    const fielder = bowlingTeam.players.find((p) => p.playerId === fielderId);

    if (!fielder) return;

    setCurrentBall((prev) => ({
      ...prev,
      fielder: fielder,
    }));

    setShowFielderSelection(false);

    // Continue with ball recording
    processBallRecording(
      pendingBallData.currentBatsmen,
      pendingBallData.currentBowler
    );
    setPendingBallData(null);
  };

  const handleNewBatsmanSelection = async (newBatsmanId) => {
    try {
      console.log("🏏 Starting new batsman selection process:", {
        newBatsmanId,
      });

      if (!match) {
        throw new Error("Match data not available");
      }

      if (!newBatsmanId) {
        throw new Error("No batsman selected");
      }

      const battingTeamId = match.currentState?.battingTeam?.teamId;
      if (!battingTeamId) {
        throw new Error("Batting team information not available");
      }

      const battingTeam =
        match.teams?.team1?.teamId === battingTeamId
          ? match.teams.team1
          : match.teams.team2;
      if (!battingTeam || !battingTeam.players) {
        throw new Error("Batting team players not available");
      }

      const newBatsman = battingTeam.players.find(
        (p) => p.playerId === newBatsmanId
      );
      if (!newBatsman) {
        throw new Error("Selected batsman not found in team");
      }

      // Update current batsmen - replace the out batsman
      const currentBatsmen = match.currentState?.currentBatsmen;
      if (
        !currentBatsmen ||
        !currentBatsmen.striker ||
        !currentBatsmen.nonStriker
      ) {
        throw new Error("Current batsmen information not available");
      }

      let updatedBatsmen;

      if (
        outBatsman &&
        outBatsman.playerId === currentBatsmen.striker.playerId
      ) {
        // Striker was out, replace striker
        updatedBatsmen = {
          striker: newBatsman,
          nonStriker: currentBatsmen.nonStriker,
        };
      } else {
        // Non-striker was out (run-out case), replace non-striker
        updatedBatsmen = {
          striker: currentBatsmen.striker,
          nonStriker: newBatsman,
        };
      }

      // Handle strike rotation for run-outs where runs were scored
      if (wicketBallData && wicketBallData.wicket?.wicketType === "run-out") {
        const runsScored = wicketBallData.runs?.batsman || 0;
        const isOddRuns = runsScored % 2 === 1;

        // If odd runs were scored during the run-out, rotate strike
        if (isOddRuns) {
          console.log(`🔄 Run-out with ${runsScored} runs: Rotating strike`);
          updatedBatsmen = {
            striker: updatedBatsmen.nonStriker,
            nonStriker: updatedBatsmen.striker,
          };
        }
      }

      console.log("🏏 Updating batsmen after wicket:", {
        outPlayer: outBatsman?.playerName,
        newBatsman: newBatsman.playerName,
        finalStriker: updatedBatsmen.striker.playerName,
        finalNonStriker: updatedBatsmen.nonStriker.playerName,
        strikeRotated:
          wicketBallData?.wicket?.wicketType === "run-out" &&
          wicketBallData?.runs?.batsman % 2 === 1,
      });

      // Check if we're in super over mode
      if (isSuperOver) {
        // For super over, update via regular current-players endpoint
        console.log("🔁 Updating super over players after wicket");

        const response = await fetch(
          `${API_BASE_URL}/api/live-matches/${matchId}/current-players`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              currentBatsmen: {
                striker: updatedBatsmen.striker,
                nonStriker: updatedBatsmen.nonStriker,
              },
              currentBowler: match.currentState.currentBowler,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            `Failed to update super over players: ${
              errorData.message || "Unknown error"
            }`
          );
        }

        const data = await response.json();

        // Update match state with new batsmen
        const updatedMatch = { ...match };
        if (updatedMatch.currentState) {
          updatedMatch.currentState.currentBatsmen = updatedBatsmen;
          setMatch(updatedMatch);
        }

        // Refresh match data to get updated super over state
        await refreshMatchData();
      } else {
        // Regular match - use normal update
        updateCurrentPlayers(
          updatedBatsmen.striker,
          updatedBatsmen.nonStriker,
          match.currentState.currentBowler,
          match.currentState.battingTeam.teamId,
          match.currentState.bowlingTeam.teamId
        );
      }

      setShowNewBatsmanSelection(false);
      setOutBatsman(null);
      setWicketBallData(null); // Clear the stored ball data

      setStatus(`✅ New batsman ${newBatsman.playerName} added successfully`);
      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "success",
          message: `🏏 ${newBatsman.playerName} is now at the crease`,
          time: new Date(),
        },
      ]);
    } catch (error) {
      console.error("🚨 Error in batsman selection:", {
        error: error.message,
        stack: error.stack,
        newBatsmanId,
        outBatsman: outBatsman?.playerName,
        timestamp: new Date().toISOString(),
      });

      setStatus(`❌ Batsman selection failed: ${error.message}`);
      setLiveUpdates((prev) => [
        ...prev,
        {
          type: "error",
          message: `🔴 Failed to add new batsman: ${error.message}`,
          time: new Date(),
        },
      ]);

      // Don't close modal on error - user can try again
    }
  };

  const handleNewBowlerSelection = (newBowlerId) => {
    if (!match) return;

    const bowlingTeamId = match.currentState.bowlingTeam.teamId;
    const bowlingTeam =
      match.teams.team1.teamId === bowlingTeamId
        ? match.teams.team1
        : match.teams.team2;
    const newBowler = bowlingTeam.players.find(
      (p) => p.playerId === newBowlerId
    );

    if (!newBowler) return;

    // Update the current bowler
    updateCurrentPlayers(
      match.currentState.currentBatsmen.striker,
      match.currentState.currentBatsmen.nonStriker,
      newBowler,
      match.currentState.battingTeam.teamId,
      match.currentState.bowlingTeam.teamId
    );

    setShowNewBowlerSelection(false);
  };

  // Function to refresh match data
  const refreshMatchData = async () => {
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

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.match) {
          // Only update if we have valid data
          setMatch(data.data.match);

          // Use the backend's dynamic current score directly
          const backendScore = data.data.currentScore;
          const backendBowlerStats = data.data.currentBowlerStats;

          if (backendScore) {
            // Backend already calculated the correct current innings score
            const newScore = {
              runs: backendScore.runs || 0,
              wickets: backendScore.wickets || 0,
              overs: backendScore.overs || 0,
              balls: backendScore.balls || 0,
              innings: backendScore.innings || 1,
              extras: backendScore.extras || {
                total: 0,
                wides: 0,
                noballs: 0,
                byes: 0,
                legbyes: 0,
              },
            };

            setScore(newScore);

            // Update current bowler stats if available
            if (backendBowlerStats) {
              console.log(
                "🎳 Updated bowler stats from backend:",
                backendBowlerStats
              );
              // Store bowler stats in component state for display
              setCurrentBowlerStats(backendBowlerStats);
            }

            // Update target score for second innings
            if (
              backendScore.innings === 2 &&
              data.data.match.currentState?.target
            ) {
              setTargetScore(data.data.match.currentState.target);
            } else if (backendScore.innings === 1) {
              setTargetScore(0); // No target in first innings
            }

            console.log(
              `Match data refreshed - Innings ${backendScore.innings}:`,
              newScore
            );
            if (backendScore.innings === 2) {
              console.log(
                `Target set to: ${
                  data.data.match.currentState?.target || "Not set"
                }`
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing match data:", error);
      // Don't update state on error to prevent crashes
    }
  };

  // Undo last ball function
  const undoLastBall = async () => {
    if (!match || !socket || !canUndo || isUndoing) {
      return;
    }

    try {
      setIsUndoing(true);
      setStatus("Undoing last ball...");
      setUndoMessage("");

      console.log("🔙 Attempting to undo last ball for match:", matchId);

      // Determine endpoint based on whether we're in super over
      const endpoint = isSuperOver
        ? `${API_BASE_URL}/api/live-matches/${matchId}/super-over/undo-ball`
        : `${API_BASE_URL}/api/live-matches/${matchId}/undo-ball`;

      console.log("🔙 Using endpoint:", endpoint, "isSuperOver:", isSuperOver);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ Ball undone successfully:", data.data);

        // Update local state with the reverted score
        if (isSuperOver) {
          // For super over, update currentSuperOverData
          if (data.data.superOver) {
            setCurrentSuperOverData(data.data.superOver);
          }
          // Update score with super over data
          if (data.data.currentScore) {
            setScore({
              runs: data.data.currentScore.runs || 0,
              wickets: data.data.currentScore.wickets || 0,
              overs: 0, // Super over doesn't use overs
              balls: data.data.currentScore.balls || 0,
              innings: data.data.innings || superOverInnings,
              extras: data.data.currentScore.extras || {
                total: 0,
                wides: 0,
                noballs: 0,
                byes: 0,
                legbyes: 0,
              },
            });
          }
        } else {
          // Regular match undo
          if (data.data.currentScore) {
            const revertedScore = {
              runs: data.data.currentScore.runs || 0,
              wickets: data.data.currentScore.wickets || 0,
              overs: data.data.currentScore.overs || 0,
              balls: data.data.currentScore.balls || 0,
              innings: data.data.currentScore.innings || score.innings,
              extras: data.data.currentScore.extras || {
                total: 0,
                wides: 0,
                noballs: 0,
                byes: 0,
                legbyes: 0,
              },
            };
            setScore(revertedScore);
          }
        }

        // Refresh match data to get updated player stats
        await refreshMatchData();

        // Show success message
        const undoneMessage = `✅ Undo successful! Reverted: ${
          data.data.undoneBall?.ballType || "ball"
        } - ${data.data.undoneBall?.runs?.total || 0} runs`;
        setUndoMessage(undoneMessage);
        setStatus(undoneMessage);

        // Add success notification
        addGlobalError(undoneMessage, "success");

        // Clear undo message after 5 seconds
        setTimeout(() => {
          setUndoMessage("");
        }, 5000);

        // Add to live updates
        setLiveUpdates((prev) => [
          ...prev,
          {
            type: "undo",
            message: `Last ball undone`,
            time: new Date(),
          },
        ]);
      } else {
        const errorMsg = data.message || "Failed to undo last ball";
        console.error("❌ Undo failed:", errorMsg);
        setStatus(`Error: ${errorMsg}`);
        addGlobalError(errorMsg, "error");
      }
    } catch (error) {
      console.error("❌ Error undoing ball:", error);
      const errorMsg = `Error undoing ball: ${error.message}`;
      setStatus(errorMsg);
      addGlobalError(errorMsg, "error");
    } finally {
      setIsUndoing(false);
    }
  };

  const quickScore = (runs) => {
    setCurrentBall((prev) => {
      const ballType = prev.ballType;

      // Handle runs according to cricket rules in your table
      switch (ballType) {
        case "wide":
          // Wide: runs input represents additional runs taken by batsmen
          // Final state: runs = additional runs, extras = 1 (auto extra, additional calculated in total)
          return {
            ...prev,
            runs, // Additional runs taken by batsmen
            extras: 1, // Only store the auto run, total calculation handles the rest
          };

        case "no-ball":
          // No-ball: runs input represents what batsman scored (e.g., 6 for six)
          // Final state: runs = batsman runs, extras = 1 (auto extra only)
          return {
            ...prev,
            runs, // Batsman runs
            extras: 1, // Only the auto run counts as extra
          };

        case "bye":
          // Bye: All runs are extras, batsman gets 0
          return {
            ...prev,
            runs, // Store input runs for total calculation
            extras: 0, // Will be calculated properly in ball recording
          };

        case "leg-bye":
          // Leg-bye: All runs are extras, batsman gets 0
          return {
            ...prev,
            runs, // Store input runs for total calculation
            extras: 0, // Will be calculated properly in ball recording
          };

        case "legal":
        default:
          // Legal ball: All runs go to batsman
          return {
            ...prev,
            runs,
            extras: 0,
          };
      }
    });
  };

  const setBallType = (type) => {
    setCurrentBall((prev) => {
      const newBall = { ...prev, ballType: type };

      // Initialize extras and runs based on ball type according to cricket rules
      switch (type) {
        case "wide":
          // Wide: 1 automatic run, any additional runs stored separately
          newBall.extras = 1; // Auto run
          newBall.runs = prev.runs || 0; // Keep additional runs if any
          break;

        case "no-ball":
          // No-ball: 1 automatic run only, batsman runs separate
          newBall.extras = 1; // Auto run only
          newBall.runs = prev.runs || 0; // Keep batsman runs if any
          break;

        case "bye":
        case "leg-bye":
          // Bye/Leg-bye: All runs are extras, but we store them in runs for calculation
          newBall.extras = 0; // Will be calculated during ball recording
          newBall.runs = prev.runs || 0; // Keep runs for proper calculation
          break;

        case "legal":
        default:
          newBall.extras = 0;
          newBall.runs = prev.runs || 0; // Keep existing runs for batsman
          break;
      }

      return newBall;
    });
  };

  const toggleWicket = () => {
    setCurrentBall((prev) => ({
      ...prev,
      isWicket: !prev.isWicket,
      wicketType: !prev.isWicket ? "bowled" : "",
    }));
  };

  // Reset current ball state for next delivery
  const resetCurrentBall = () => {
    const totalBalls = score.balls || 0;
    // Calculate next ball: if we have bowled 10 balls, next will be over 2, ball 5
    const nextBallNumber = totalBalls + 1;
    const currentOver = Math.floor((nextBallNumber - 1) / 6) + 1;
    const currentBallInOver = ((nextBallNumber - 1) % 6) + 1;

    setCurrentBall({
      innings: match?.currentState?.currentInnings || 1,
      over: currentOver,
      ball: currentBallInOver,
      ballType: "legal",
      runs: 0,
      batsman: match?.currentState?.currentBatsmen?.striker || null,
      bowler: match?.currentState?.currentBowler || null,
      extras: 0,
      isWicket: false,
      wicketType: "",
      fielder: null,
      commentary: "",
    });
  };

  // Helper functions to get player statistics
  const getPlayerBattingStats = (playerId) => {
    if (!match || !playerId) {
      return { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0 };
    }

    // If in super over, use live super over data from currentSuperOverData
    if (isSuperOver && currentSuperOverData) {
      // Determine which innings to check based on current super over innings
      const currentInnings = superOverInnings === 1 ? "innings1" : "innings2";
      const batsmen = currentSuperOverData[currentInnings]?.batsmen || [];

      const superOverBatsman = batsmen.find((b) => b.playerId === playerId);

      if (superOverBatsman) {
        return {
          runs: superOverBatsman.runs || 0,
          ballsFaced: superOverBatsman.balls || 0,
          fours: superOverBatsman.fours || 0,
          sixes: superOverBatsman.sixes || 0,
          strikeRate:
            superOverBatsman.balls > 0
              ? (
                  (superOverBatsman.runs / superOverBatsman.balls) *
                  100
                ).toFixed(1)
              : 0,
        };
      }

      // Player not found in super over stats - return zeros (don't fall back to regular match)
      return { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0 };
    }

    // Find player in current batting team (regular match stats)
    const battingTeam = match.currentState?.battingTeam;
    if (!battingTeam)
      return { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0 };

    const teamKey =
      battingTeam.teamId === match.teams.team1.teamId ? "team1" : "team2";
    const player = match.teams[teamKey]?.players?.find(
      (p) => p.playerId === playerId
    );

    if (!player || !player.batting) {
      return { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, strikeRate: 0 };
    }

    const stats = player.batting;
    return {
      runs: stats.runs || 0,
      ballsFaced: stats.ballsFaced || 0,
      fours: stats.fours || 0,
      sixes: stats.sixes || 0,
      strikeRate: stats.strikeRate || 0,
    };
  };

  const getPlayerBowlingStats = (playerId) => {
    if (!match || !playerId) {
      return { balls: 0, runs: 0, wickets: 0, economyRate: 0 };
    }

    // If in super over, use live super over data from currentSuperOverData
    if (isSuperOver && currentSuperOverData) {
      // Determine which innings to check based on current super over innings
      const currentInnings = superOverInnings === 1 ? "innings1" : "innings2";
      const bowler = currentSuperOverData[currentInnings]?.bowler;

      if (bowler && bowler.playerId === playerId) {
        const overs = Math.floor(bowler.balls / 6) + (bowler.balls % 6) / 10;
        const economyRate = overs > 0 ? (bowler.runs / overs).toFixed(1) : 0;

        return {
          balls: bowler.balls || 0,
          runs: bowler.runs || 0,
          wickets: bowler.wickets || 0,
          economyRate: economyRate,
        };
      }

      // Bowler not found in super over stats - return zeros (don't fall back to regular match)
      return { balls: 0, runs: 0, wickets: 0, economyRate: 0 };
    }

    // Find player in current bowling team (regular match stats)
    const bowlingTeam = match.currentState?.bowlingTeam;
    if (!bowlingTeam) return { balls: 0, runs: 0, wickets: 0, economyRate: 0 };

    const teamKey =
      bowlingTeam.teamId === match.teams.team1.teamId ? "team1" : "team2";
    const player = match.teams[teamKey]?.players?.find(
      (p) => p.playerId === playerId
    );

    if (!player || !player.bowling) {
      return { balls: 0, runs: 0, wickets: 0, economyRate: 0 };
    }

    const stats = player.bowling;
    return {
      balls: stats.balls || 0,
      runs: stats.runs || 0,
      wickets: stats.wickets || 0,
      economyRate: stats.economyRate || 0,
    };
  };

  if (!match) {
    return (
      <div className="scorer-keypad">
        <h3>Cricket Scorer Keypad</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <p>Status: {status}</p>
          {!isOnline && (
            <span
              style={{
                backgroundColor: "#dc3545",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              📵 OFFLINE
            </span>
          )}
          {isOnline && (
            <span
              style={{
                backgroundColor: "#28a745",
                color: "white",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              🌐 ONLINE
            </span>
          )}
        </div>
      </div>
    );
  }

  // Player Selection Component
  if (showPlayerSelection) {
    // Check if this is for super over
    const isSuperOverSelection = isSuperOver && superOverNumber > 0;
    const selectionHandler = isSuperOverSelection
      ? handleSuperOverPlayersSelected
      : updateCurrentPlayers;

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
          <h3>
            {isSuperOverSelection
              ? `🔁 Super Over #${superOverNumber} - ${
                  superOverInnings === 1 ? "1st" : "2nd"
                } Innings`
              : "🎯 Select Current Players"}
          </h3>
          <button
            onClick={() => {
              if (isSuperOverSelection) {
                setShowPlayerSelection(false);
              } else {
                onBack();
              }
            }}
            style={{
              padding: "8px 16px",
              background: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 4,
            }}
          >
            {isSuperOverSelection ? "Cancel" : "Back"}
          </button>
        </div>

        {isSuperOverSelection && (
          <div
            style={{
              marginBottom: 20,
              textAlign: "center",
              padding: "15px",
              background: "#fff3e0",
              borderRadius: "8px",
              border: "2px solid #ff8c00",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "#e65100",
                fontWeight: "bold",
              }}
            >
              {superOverInnings === 1
                ? `Select 2 batsmen and 1 bowler for ${
                    superOverBattingTeam?.teamName ||
                    match?.currentState?.battingTeam?.teamName ||
                    "batting team"
                  }`
                : `Select 2 batsmen and 1 bowler for ${
                    superOverBattingTeam?.teamName ||
                    match?.currentState?.battingTeam?.teamName ||
                    "batting team"
                  } (Target: ${superOverTarget})`}
            </p>
          </div>
        )}

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
            <strong>Batting Team:</strong>{" "}
            {isSuperOverSelection && superOverBattingTeam?.teamName
              ? superOverBattingTeam.teamName
              : match.currentState?.battingTeam?.teamName}
          </p>
          <p>
            <strong>Bowling Team:</strong>{" "}
            {isSuperOverSelection && superOverBowlingTeam?.teamName
              ? superOverBowlingTeam.teamName
              : match.currentState?.bowlingTeam?.teamName}
          </p>
        </div>

        <PlayerSelectionForm
          availableBatsmen={availableBatsmen}
          availableBowlers={availableBowlers}
          match={match}
          onPlayersSelected={selectionHandler}
          autoPopulateTeams={
            isSuperOverSelection || match?.currentState?.currentInnings === 2
          }
          battingTeamOverride={
            isSuperOverSelection ? superOverBattingTeam : null
          }
          bowlingTeamOverride={
            isSuperOverSelection ? superOverBowlingTeam : null
          }
        />
      </div>
    );
  }

  return (
    <div
      className="scorer-keypad"
      style={{ padding: 20, fontFamily: "Arial, sans-serif" }}
    >
      <div
        style={{
          marginBottom: 20,
          padding: 15,
          background: isConnected ? "#d4edda" : "#f8d7da",
          borderRadius: 5,
        }}
      >
        <h3>Cricket Scorer Keypad</h3>
        <p>
          <strong>Status:</strong> {status}
        </p>
        <p>
          <strong>Connection:</strong>{" "}
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </p>
      </div>

      {/* Innings Indicator - Prominent Display */}
      <div
        style={{
          marginBottom: 20,
          padding: "15px 20px",
          background:
            match?.currentState?.currentInnings === 2
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          borderRadius: 8,
          boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
          border: "2px solid rgba(255,255,255,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: "white",
                fontSize: "24px",
                fontWeight: "bold",
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {match?.currentState?.currentInnings === 2
                ? "2️⃣ SECOND INNINGS"
                : "1️⃣ FIRST INNINGS"}
            </h2>
            <p
              style={{
                margin: "5px 0 0 0",
                color: "rgba(255,255,255,0.95)",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              {match?.currentState?.battingTeam?.teamName || "Unknown Team"}{" "}
              batting •{" "}
              {match?.currentState?.bowlingTeam?.teamName || "Unknown Team"}{" "}
              bowling
            </p>
          </div>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.25)",
              padding: "10px 20px",
              borderRadius: 6,
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              INNINGS
            </div>
            <div
              style={{
                color: "white",
                fontSize: "32px",
                fontWeight: "bold",
                textAlign: "center",
                lineHeight: 1,
                textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {match?.currentState?.currentInnings || 1}
            </div>
          </div>
        </div>
      </div>

      {/* Match Info */}
      <div
        style={{
          marginBottom: 20,
          padding: 15,
          background: "#e9ecef",
          borderRadius: 5,
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
            <h4 style={{ margin: 0 }}>
              {match.teams?.team1?.teamName} vs {match.teams?.team2?.teamName}
            </h4>
            <p style={{ margin: "2px 0", fontSize: "12px", color: "#6c757d" }}>
              {match.matchType || "T20"} • {match.overs} overs
              {match.matchFormat && (
                <span
                  style={{
                    marginLeft: "8px",
                    fontWeight: "bold",
                    color: "#007bff",
                  }}
                >
                  •{" "}
                  {match.matchFormat === "overarm"
                    ? "⚾ Overarm"
                    : match.matchFormat === "leather-ball"
                    ? "🏏 Leather Ball"
                    : match.matchFormat === "underarm"
                    ? "🥎 Underarm"
                    : match.matchFormat}
                </span>
              )}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {!isOnline && (
              <span
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                📵 OFFLINE
              </span>
            )}
            {isOnline && (
              <span
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                🌐 ONLINE
              </span>
            )}
            {isConnected && (
              <span
                style={{
                  backgroundColor: "#17a2b8",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                🔗 LIVE
              </span>
            )}
          </div>
        </div>
        <p>
          <strong>Current Score:</strong> {score.runs}/{score.wickets} (
          {Math.floor(score.balls / 6)}.{score.balls % 6} overs)
        </p>

        {/* SUPER OVER SCORE DISPLAY */}
        {isSuperOver && (
          <div
            style={{
              background: "linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)",
              color: "white",
              padding: "15px",
              borderRadius: "10px",
              marginTop: "10px",
              marginBottom: "10px",
              boxShadow: "0 4px 12px rgba(255, 140, 0, 0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: "14px", opacity: 0.9 }}>
                  🔁 Super Over #{superOverNumber} -{" "}
                  {superOverInnings === 1 ? "1st" : "2nd"} Innings
                </span>
                <div
                  style={{
                    fontSize: "28px",
                    fontWeight: "bold",
                    marginTop: "5px",
                  }}
                >
                  {superOverScore.runs}/{superOverScore.wickets}
                  <span
                    style={{
                      fontSize: "16px",
                      marginLeft: "8px",
                      opacity: 0.9,
                    }}
                  >
                    ({superOverScore.balls}/6 balls)
                  </span>
                </div>
              </div>
              {superOverInnings === 2 && superOverTarget > 0 && (
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "12px", opacity: 0.9 }}>Target</span>
                  <div style={{ fontSize: "24px", fontWeight: "bold" }}>
                    {superOverTarget}
                  </div>
                  <span style={{ fontSize: "12px" }}>
                    Need: {Math.max(0, superOverTarget - superOverScore.runs)}
                  </span>
                </div>
              )}
            </div>
            <div style={{ marginTop: "10px", fontSize: "12px", opacity: 0.9 }}>
              Balls remaining: {6 - superOverScore.balls}
            </div>
          </div>
        )}

        {/* Show target for second innings */}
        {match?.currentState?.currentInnings === 2 && targetScore > 0 && (
          <p
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#0066cc",
              margin: "10px 0",
              padding: "10px",
              background: "#e7f3ff",
              borderRadius: "5px",
              border: "2px solid #0066cc",
            }}
          >
            🎯 Target: {targetScore} runs | Need:{" "}
            {Math.max(0, targetScore - score.runs)} runs to win
          </p>
        )}

        <p>
          <strong>Current Ball:</strong> Over {Math.floor(score.balls / 6)},
          Ball {score.balls % 6 || 6}
        </p>

        {/* Current Over Balls */}
        <div style={{ marginTop: 8 }}>
          <strong>Current Over:</strong>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            {recentBalls && recentBalls.length > 0 ? (
              recentBalls.map((b) => {
                // Determine solid background color based on ball type
                let bgColor = "#757575"; // default gray for regular balls
                let textColor = "#fff"; // white text
                let bottomLabel = ""; // Extra type or empty

                if (b.isWicket) {
                  bgColor = "#d32f2f"; // solid red for wickets
                  bottomLabel = "Wicket";
                } else if (b.runs?.total === 6) {
                  bgColor = "#1976d2"; // solid blue for six
                } else if (b.runs?.total === 4) {
                  bgColor = "#388e3c"; // solid green for four
                } else if (b.extras === "wide") {
                  bgColor = "#f57c00"; // solid orange for wide
                  bottomLabel = "Wide";
                } else if (b.extras === "no-ball") {
                  bgColor = "#7b1fa2"; // solid purple for no-ball
                  bottomLabel = "No Ball";
                } else if (b.extras === "bye") {
                  bgColor = "#5d4037"; // solid brown for bye
                  bottomLabel = "Bye";
                } else if (b.extras === "leg-bye") {
                  bgColor = "#5d4037"; // solid brown for leg-bye
                  bottomLabel = "Leg Bye";
                } else if (b.runs?.total === 0 && !b.isWicket) {
                  bgColor = "#616161"; // solid dark gray for dot balls
                  bottomLabel = "Dot";
                }

                return (
                  <div
                    key={b.ballId}
                    style={{
                      border: "none",
                      background: bgColor,
                      padding: "8px 10px",
                      borderRadius: 6,
                      fontSize: 13,
                      minWidth: 70,
                      textAlign: "center",
                      color: textColor,
                    }}
                  >
                    <div style={{ fontSize: 11, opacity: 0.9 }}>
                      {b.displayOver}
                    </div>
                    <div
                      style={{
                        fontWeight: "bold",
                        marginTop: 4,
                        fontSize: 20,
                      }}
                    >
                      {b.isWicket ? "W" : b.runs?.total ?? "0"}
                    </div>
                    <div style={{ fontSize: 10, marginTop: 4, opacity: 0.9 }}>
                      {bottomLabel || "-"}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: "#666", fontSize: 13 }}>
                No balls in current over yet
              </div>
            )}
          </div>
        </div>

        {/* Run rates - show CRR always, RRR when chasing */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            gap: 20,
            marginTop: 8,
          }}
        >
          <div style={{ fontSize: 14, color: "#333" }}>
            <strong>CRR:</strong>{" "}
            {score.runRate !== undefined && score.runRate !== null
              ? Number(score.runRate).toFixed(2)
              : score.balls > 0
              ? (score.runs / (score.balls / 6)).toFixed(2)
              : "0.00"}
          </div>

          <div style={{ fontSize: 14, color: "#333" }}>
            <strong>RRR:</strong>{" "}
            {match?.currentState?.currentInnings === 2 && targetScore > 0
              ? score.balls >= (match?.overs || 20) * 6
                ? "0.00"
                : (
                    (targetScore - score.runs) /
                    (((match?.overs || 20) * 6 - score.balls) / 6)
                  ).toFixed(2)
              : "N/A"}
          </div>
        </div>

        {/* Overs Limit Warning */}
        {(() => {
          const currentBalls = score.balls || 0;
          const currentOvers = Math.floor(currentBalls / 6);
          const ballsInCurrentOver = currentBalls % 6;
          const maxOvers = match?.overs || 20;
          const maxBalls = maxOvers * 6;
          const ballsRemaining = maxBalls - currentBalls;

          if (currentBalls >= maxBalls) {
            // Innings completed
            return (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  background:
                    "linear-gradient(135deg, #ffebee 0%, #fce4ec 100%)",
                  borderRadius: 6,
                  border: "2px solid #d32f2f",
                }}
              >
                <h5 style={{ margin: "0 0 8px 0", color: "#d32f2f" }}>
                  🏁 INNINGS COMPLETED
                </h5>
                <p style={{ margin: 0, fontSize: "14px", color: "#c62828" }}>
                  <strong>
                    {maxOvers} {maxOvers === 1 ? "over" : "overs"} completed (
                    {currentOvers}.{ballsInCurrentOver} overs, {currentBalls}{" "}
                    balls)
                  </strong>
                  <br />
                  No more balls can be bowled in this innings.
                </p>
              </div>
            );
          } else if (currentBalls >= maxBalls - 6) {
            // Last over
            return (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  background:
                    "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
                  borderRadius: 6,
                  border: "2px solid #f57c00",
                }}
              >
                <h5 style={{ margin: "0 0 8px 0", color: "#f57c00" }}>
                  ⚠️ FINAL OVER
                </h5>
                <p style={{ margin: 0, fontSize: "14px", color: "#ef6c00" }}>
                  <strong>Last over in progress!</strong> Only {ballsRemaining}{" "}
                  {ballsRemaining === 1 ? "ball" : "balls"} remaining.
                  <br />
                  Innings will end after {ballsRemaining} more legal{" "}
                  {ballsRemaining === 1 ? "delivery" : "deliveries"}.
                </p>
              </div>
            );
          } else if (currentBalls >= maxBalls - 12) {
            // Second last over
            return (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  background:
                    "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
                  borderRadius: 6,
                  border: "2px solid #8e24aa",
                }}
              >
                <h5 style={{ margin: "0 0 8px 0", color: "#8e24aa" }}>
                  ⏰ APPROACHING {maxOvers} {maxOvers === 1 ? "OVER" : "OVERS"}
                </h5>
                <p style={{ margin: 0, fontSize: "14px", color: "#7b1fa2" }}>
                  <strong>
                    {ballsRemaining} {ballsRemaining === 1 ? "ball" : "balls"}{" "}
                    remaining
                  </strong>{" "}
                  before
                  {maxOvers}-over limit.
                  <br />
                  Current: {currentOvers}.{ballsInCurrentOver} overs
                </p>
              </div>
            );
          }
          return null;
        })()}

        {/* Target Tracking for Second Innings */}
        {targetScore > 0 && score.innings === 2 && (
          <div
            style={{
              marginTop: 10,
              padding: 12,
              background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)",
              borderRadius: 6,
              border: "2px solid #2196f3",
            }}
          >
            <h5 style={{ margin: "0 0 8px 0", color: "#1976d2" }}>
              🎯 Chase Information
            </h5>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
              }}
            >
              <div>
                <strong>Target: {targetScore}</strong>
                <br />
                <span
                  style={{
                    color: score.runs >= targetScore ? "#28a745" : "#dc3545",
                  }}
                >
                  Need: {Math.max(0, targetScore - score.runs)} runs
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <strong>
                  Balls Left: {(match?.overs || 20) * 6 - score.balls}
                </strong>
                <br />
                <span style={{ color: "#666" }}>
                  <strong>CRR:</strong>{" "}
                  {score.runRate !== undefined && score.runRate !== null
                    ? Number(score.runRate).toFixed(2)
                    : score.balls > 0
                    ? (score.runs / (score.balls / 6)).toFixed(2)
                    : "0.00"}
                  {"  "}
                  <strong>RRR:</strong>{" "}
                  {score.balls >= (match?.overs || 20) * 6
                    ? "0.00"
                    : (
                        (targetScore - score.runs) /
                        (((match?.overs || 20) * 6 - score.balls) / 6)
                      ).toFixed(2)}
                </span>
              </div>
            </div>
            {score.runs >= targetScore && (
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background:
                    "linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)",
                  borderRadius: 6,
                  color: "#155724",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: "2px solid #28a745",
                }}
              >
                🎉{" "}
                {match?.currentState?.battingTeam?.teamName || "Batting Team"}{" "}
                WON! 🎉
                <br />
                <span style={{ fontSize: "14px", fontWeight: "normal" }}>
                  Won by {(match?.playersPerTeam || 11) - score.wickets} wickets
                  with {(match?.overs || 20) * 6 - score.balls} balls remaining
                </span>
              </div>
            )}
          </div>
        )}

        {/* Extras Display */}
        <div
          style={{
            marginTop: 10,
            padding: 8,
            background: "#fff3cd",
            borderRadius: 3,
          }}
        >
          <p style={{ margin: 0, fontSize: "14px" }}>
            <strong>Extras:</strong> {score.extras?.total || 0}
            {(score.extras?.wides || 0) > 0 && ` (W: ${score.extras.wides})`}
            {(score.extras?.noballs || 0) > 0 &&
              ` (NB: ${score.extras.noballs})`}
            {(score.extras?.byes || 0) > 0 && ` (B: ${score.extras.byes})`}
            {(score.extras?.legbyes || 0) > 0 &&
              ` (LB: ${score.extras.legbyes})`}
          </p>
        </div>

        {/* Current Players */}
        <div
          style={{
            marginTop: 10,
            padding: 10,
            background: "#fff3cd",
            borderRadius: 3,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            <h5 style={{ margin: 0 }}>Current Players</h5>
            <button
              onClick={() => setShowPlayerSelection(true)}
              style={{
                padding: "4px 8px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Change
            </button>
          </div>
          {match.currentState?.currentBatsmen ? (
            <div>
              <p>
                <strong>Striker:</strong>{" "}
                {match.currentState.currentBatsmen.striker?.playerName ||
                  "Not set"}
              </p>
              <p>
                <strong>Non-Striker:</strong>{" "}
                {match.currentState.currentBatsmen.nonStriker?.playerName ||
                  "Not set"}
              </p>
            </div>
          ) : (
            <p style={{ color: "#dc3545" }}>
              No batsmen set - Start match first!
            </p>
          )}

          {match.currentState?.currentBowler ? (
            <p>
              <strong>Bowler:</strong>{" "}
              {match.currentState.currentBowler.playerName}
            </p>
          ) : (
            <p style={{ color: "#dc3545" }}>
              No bowler set - Start match first!
            </p>
          )}
        </div>

        {/* Player Statistics */}
        <div
          style={{
            marginTop: 15,
            padding: 10,
            background: "#f8f9fa",
            borderRadius: 3,
            border: "1px solid #dee2e6",
          }}
        >
          <h5 style={{ margin: "0 0 10px 0", color: "#495057" }}>
            📊 Player Statistics
          </h5>

          {/* Current Batsmen Stats */}
          <div style={{ marginBottom: 15 }}>
            <h6 style={{ margin: "0 0 5px 0", color: "#28a745" }}>
              🏏 Current Batsmen
            </h6>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              {/* Striker Stats */}
              {match.currentState?.currentBatsmen?.striker && (
                <div
                  style={{
                    padding: 8,
                    background: "#fff",
                    borderRadius: 3,
                    border: "1px solid #e3f2fd",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "bold",
                      fontSize: 14,
                      color: "#1976d2",
                    }}
                  >
                    ⭐ {match.currentState.currentBatsmen.striker.playerName}{" "}
                    (Striker)
                  </p>
                  {(() => {
                    const playerStats = getPlayerBattingStats(
                      match.currentState.currentBatsmen.striker.playerId
                    );
                    return (
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        <p style={{ margin: "2px 0" }}>
                          Runs: <strong>{playerStats.runs}</strong>
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          Balls: <strong>{playerStats.ballsFaced}</strong>
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          4s: <strong>{playerStats.fours}</strong> | 6s:{" "}
                          <strong>{playerStats.sixes}</strong>
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          SR:{" "}
                          <strong>
                            {playerStats.ballsFaced > 0
                              ? (
                                  (playerStats.runs / playerStats.ballsFaced) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                          </strong>
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Non-Striker Stats */}
              {match.currentState?.currentBatsmen?.nonStriker && (
                <div
                  style={{
                    padding: 8,
                    background: "#fff",
                    borderRadius: 3,
                    border: "1px solid #e8f5e8",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "bold",
                      fontSize: 14,
                      color: "#388e3c",
                    }}
                  >
                    {match.currentState.currentBatsmen.nonStriker.playerName}{" "}
                    (Non-Striker)
                  </p>
                  {(() => {
                    const playerStats = getPlayerBattingStats(
                      match.currentState.currentBatsmen.nonStriker.playerId
                    );
                    return (
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        <p style={{ margin: "2px 0" }}>
                          Runs: <strong>{playerStats.runs}</strong>
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          Balls: <strong>{playerStats.ballsFaced}</strong>
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          4s: <strong>{playerStats.fours}</strong> | 6s:{" "}
                          <strong>{playerStats.sixes}</strong>
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          SR:{" "}
                          <strong>
                            {playerStats.ballsFaced > 0
                              ? (
                                  (playerStats.runs / playerStats.ballsFaced) *
                                  100
                                ).toFixed(1)
                              : "0.0"}
                          </strong>
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Current Bowler Stats */}
          {match.currentState?.currentBowler && (
            <div>
              <h6 style={{ margin: "0 0 5px 0", color: "#dc3545" }}>
                ⚡ Current Bowler
              </h6>
              <div
                style={{
                  padding: 8,
                  background: "#fff",
                  borderRadius: 3,
                  border: "1px solid #ffebee",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontWeight: "bold",
                    fontSize: 14,
                    color: "#d32f2f",
                  }}
                >
                  🎳 {match.currentState.currentBowler.playerName}
                </p>
                {(() => {
                  // Use backend bowler stats if available, otherwise fall back to local calculation
                  let bowlerStats;
                  if (
                    currentBowlerStats &&
                    currentBowlerStats.playerId ===
                      match.currentState.currentBowler.playerId
                  ) {
                    // Use stats from backend
                    bowlerStats = {
                      balls: currentBowlerStats.balls,
                      runs: currentBowlerStats.runs,
                      wickets: currentBowlerStats.wickets,
                      overs: currentBowlerStats.overs,
                      economyRate: currentBowlerStats.economyRate,
                    };
                  } else {
                    // Fall back to local calculation
                    const localStats = getPlayerBowlingStats(
                      match.currentState.currentBowler.playerId
                    );
                    const ballsBowled = localStats.balls || 0;
                    const runsConceded = localStats.runs || 0;
                    bowlerStats = {
                      balls: ballsBowled,
                      runs: runsConceded,
                      wickets: localStats.wickets || 0,
                      overs:
                        ballsBowled > 0
                          ? `${Math.floor(ballsBowled / 6)}.${ballsBowled % 6}`
                          : "0.0",
                      economyRate:
                        ballsBowled > 0
                          ? (runsConceded / (ballsBowled / 6) || 0).toFixed(1)
                          : "0.0",
                    };
                  }

                  // Only log if there's an issue with stats not updating
                  if (
                    bowlerStats.balls === 0 &&
                    bowlerStats.runs === 0 &&
                    bowlerStats.wickets === 0
                  ) {
                    console.log("⚠️ Bowler stats showing zeros:", {
                      bowlerId: match.currentState.currentBowler.playerId,
                      bowlerName: match.currentState.currentBowler.playerName,
                      backendStats: currentBowlerStats,
                      localStats: bowlerStats,
                    });
                  }

                  return (
                    <div
                      style={{
                        fontSize: 12,
                        marginTop: 4,
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}
                    >
                      <div>
                        <p style={{ margin: "2px 0" }}>
                          Overs: <strong>{bowlerStats.overs}</strong>
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          Runs: <strong>{bowlerStats.runs}</strong>
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: "2px 0" }}>
                          Wickets: <strong>{bowlerStats.wickets}</strong>
                        </p>
                        <p style={{ margin: "2px 0" }}>
                          Econ: <strong>{bowlerStats.economyRate}</strong>
                        </p>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#666",
                          gridColumn: "span 2",
                          marginTop: 4,
                        }}
                      >
                        DEBUG: balls={bowlerStats.balls}, runs=
                        {bowlerStats.runs}, wickets={bowlerStats.wickets}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Runs */}
      <div style={{ marginBottom: 20 }}>
        <h5>Quick Runs</h5>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {runsOptions.map((runs) => (
            <button
              key={runs}
              onClick={() => quickScore(runs)}
              style={{
                padding: "15px 20px",
                fontSize: "18px",
                fontWeight: "bold",
                border: "none",
                borderRadius: 5,
                background: currentBall.runs === runs ? "#007bff" : "#6c757d",
                color: "white",
                cursor: "pointer",
                minWidth: "60px",
              }}
            >
              {runs}
            </button>
          ))}
        </div>
      </div>

      {/* Ball Type */}
      <div style={{ marginBottom: 20 }}>
        <h5>Ball Type</h5>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {ballTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setBallType(type.value)}
              style={{
                padding: "10px 15px",
                border: "none",
                borderRadius: 5,
                background:
                  currentBall.ballType === type.value ? type.color : "#e9ecef",
                color: currentBall.ballType === type.value ? "white" : "black",
                cursor: "pointer",
              }}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wicket Control */}
      <div style={{ marginBottom: 20 }}>
        <h5>Wicket</h5>
        <button
          onClick={toggleWicket}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: 5,
            background: currentBall.isWicket ? "#dc3545" : "#28a745",
            color: "white",
            cursor: "pointer",
            marginRight: 10,
          }}
        >
          {currentBall.isWicket ? "WICKET! ❌" : "No Wicket ✅"}
        </button>

        {currentBall.isWicket && (
          <select
            value={currentBall.wicketType}
            onChange={(e) =>
              setCurrentBall((prev) => ({
                ...prev,
                wicketType: e.target.value,
              }))
            }
            style={{ padding: "10px", marginLeft: 10 }}
          >
            {wicketTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Commentary */}
      <div style={{ marginBottom: 20 }}>
        <h5>Commentary</h5>
        <textarea
          value={currentBall.commentary}
          onChange={(e) =>
            setCurrentBall((prev) => ({ ...prev, commentary: e.target.value }))
          }
          placeholder="Add commentary for this ball..."
          style={{
            width: "100%",
            height: 60,
            padding: 10,
            borderRadius: 5,
            border: "1px solid #ccc",
          }}
        />
      </div>

      {/* Current Ball Preview */}
      <div
        style={{
          marginBottom: 20,
          padding: 15,
          background: "#fff3cd",
          borderRadius: 5,
          border: "2px solid #ffc107",
        }}
      >
        <h5 style={{ marginTop: 0, color: "#856404" }}>📋 Ball Preview</h5>
        <p>
          <strong>Ball Type:</strong> {currentBall.ballType.toUpperCase()}
        </p>
        <p>
          <strong>Batsman Runs:</strong>{" "}
          {currentBall.ballType === "legal"
            ? currentBall.runs
            : currentBall.ballType === "bye" ||
              currentBall.ballType === "leg-bye"
            ? currentBall.runs
            : 0}
        </p>
        <p>
          <strong>Extras:</strong> {currentBall.extras}
          {currentBall.ballType === "wide" && " (Wide)"}
          {currentBall.ballType === "no-ball" && " (No Ball)"}
          {currentBall.ballType === "bye" && " (Byes)"}
          {currentBall.ballType === "leg-bye" && " (Leg Byes)"}
        </p>
        <p>
          <strong>Total Runs This Ball:</strong>{" "}
          {currentBall.runs + currentBall.extras}
        </p>
        <p>
          <strong>Wicket:</strong>{" "}
          {currentBall.isWicket ? `Yes (${currentBall.wicketType})` : "No"}
        </p>
        {currentBall.commentary && (
          <p>
            <strong>Commentary:</strong> {currentBall.commentary}
          </p>
        )}
      </div>

      {/* Record Ball Button */}
      {(() => {
        const currentBalls = score.balls || 0;
        const maxBalls = (match?.overs || 20) * 6;
        const inningsCompleted = currentBalls >= maxBalls;
        const matchCompleted =
          match?.currentState?.status === "completed" ||
          (match?.currentState?.currentInnings === 2 &&
            targetScore > 0 &&
            score.runs >= targetScore);
        const isDisabled = !isConnected || inningsCompleted || matchCompleted;

        return (
          <button
            onClick={recordBall}
            disabled={isDisabled}
            style={{
              width: "100%",
              padding: "20px",
              fontSize: "20px",
              fontWeight: "bold",
              border: "none",
              borderRadius: 5,
              background: matchCompleted
                ? "#28a745"
                : inningsCompleted
                ? "#d32f2f"
                : isConnected
                ? "#28a745"
                : "#6c757d",
              color: "white",
              cursor: isDisabled ? "not-allowed" : "pointer",
              opacity: isDisabled ? 0.7 : 1,
            }}
          >
            {matchCompleted
              ? "🏆 MATCH COMPLETED"
              : inningsCompleted
              ? "🏁 INNINGS COMPLETED"
              : "🏏 RECORD BALL"}
          </button>
        );
      })()}

      {/* Undo Button */}
      <div style={{ marginTop: 15 }}>
        <button
          onClick={undoLastBall}
          disabled={
            !canUndo || isUndoing || match?.currentState?.status === "completed"
          }
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "18px",
            fontWeight: "bold",
            border: "2px solid #ff9800",
            borderRadius: 5,
            background:
              canUndo &&
              !isUndoing &&
              match?.currentState?.status !== "completed"
                ? "#fff3e0"
                : "#e0e0e0",
            color:
              canUndo &&
              !isUndoing &&
              match?.currentState?.status !== "completed"
                ? "#f57c00"
                : "#9e9e9e",
            cursor:
              canUndo &&
              !isUndoing &&
              match?.currentState?.status !== "completed"
                ? "pointer"
                : "not-allowed",
            opacity:
              canUndo &&
              !isUndoing &&
              match?.currentState?.status !== "completed"
                ? 1
                : 0.6,
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
          title={
            match?.currentState?.status === "completed"
              ? "Match completed - Cannot undo"
              : !canUndo
              ? "No balls to undo"
              : "Undo the last ball recorded"
          }
        >
          <span style={{ fontSize: "24px" }}>↶</span>
          <span>{isUndoing ? "UNDOING..." : "UNDO LAST BALL"}</span>
        </button>
        {undoMessage && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              background: undoMessage.includes("✅") ? "#d4edda" : "#f8d7da",
              color: undoMessage.includes("✅") ? "#155724" : "#721c24",
              borderRadius: 5,
              fontSize: "14px",
              textAlign: "center",
              border: `1px solid ${
                undoMessage.includes("✅") ? "#c3e6cb" : "#f5c6cb"
              }`,
            }}
          >
            {undoMessage}
          </div>
        )}
      </div>

      {/* Live Updates */}
      <div
        style={{
          marginTop: 20,
          padding: 15,
          background: "#f8f9fa",
          borderRadius: 5,
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        <h5>Live Updates</h5>
        {liveUpdates.length === 0 ? (
          <p style={{ fontSize: 12, color: "#666" }}>
            Real-time match updates will appear here...
          </p>
        ) : (
          <div>
            {liveUpdates
              .slice(-10)
              .reverse()
              .map((update, index) => (
                <div
                  key={index}
                  style={{
                    padding: "5px 0",
                    borderBottom: "1px solid #e9ecef",
                    fontSize: 12,
                    color:
                      update.type === "error"
                        ? "#dc3545"
                        : update.type === "system"
                        ? "#6c757d"
                        : "#000",
                  }}
                >
                  <span style={{ fontWeight: "bold", marginRight: 5 }}>
                    {update.time.toLocaleTimeString()}:
                  </span>
                  {update.message}
                </div>
              ))}

            {/* Recent points awarded (quick feedback) */}
            {recentPoints.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 8 }}>
                <h6 style={{ margin: "6px 0", fontSize: 13 }}>Recent Points</h6>
                {recentPoints.slice(0, 10).map((p, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#0b6efd" }}>
                    +{p.points} pts — <strong>{p.playerName}</strong> (
                    {p.reason})
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cricket Scenario Modals */}

      {/* New Batsman Selection Modal */}
      {showNewBatsmanSelection && (
        <div
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking outside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 30,
              borderRadius: 10,
              minWidth: 400,
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "#dc3545" }}>
              🏏 New Batsman Required
            </h3>
            <p>
              Select the new batsman to replace{" "}
              <strong>{outBatsman?.playerName}</strong>:
            </p>

            {/* Show run-out and strike rotation info if applicable */}
            {wicketBallData &&
              wicketBallData.wicket?.wicketType === "run-out" && (
                <div
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: 15,
                    borderRadius: 5,
                    marginBottom: 15,
                    border: "1px solid #dee2e6",
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, color: "#6c757d" }}>
                    <strong>Run-out scenario:</strong>{" "}
                    {wicketBallData.runs?.batsman || 0} runs were taken.
                    {wicketBallData.runs?.batsman % 2 === 1 && (
                      <span style={{ color: "#007bff" }}>
                        {" "}
                        Strike will rotate after new batsman arrives.
                      </span>
                    )}
                  </p>
                </div>
              )}

            <select
              value={selectedNewBatsman}
              onChange={(e) => setSelectedNewBatsman(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "2px solid #ddd",
                borderRadius: 6,
                marginBottom: 20,
              }}
            >
              <option value="">-- Select New Batsman --</option>
              {(() => {
                if (!match || !match.currentState || !match.teams) return [];
                const battingTeamId = match.currentState.battingTeam?.teamId;
                if (!battingTeamId) return [];
                const battingTeam =
                  match.teams.team1.teamId === battingTeamId
                    ? match.teams.team1
                    : match.teams.team2;

                // Use selectedPlayers if available, otherwise fall back to all players
                const selectedPlayersList =
                  battingTeam?.selectedPlayers?.length > 0
                    ? battingTeam.selectedPlayers
                    : battingTeam?.players || [];

                // Get full player data from players array (which has batting stats)
                const fullPlayers = battingTeam?.players || [];

                return selectedPlayersList
                  .map((selectedPlayer) => {
                    // Find the full player data to get batting stats
                    const fullPlayer = fullPlayers.find(
                      (p) =>
                        p.playerId.toString() ===
                        selectedPlayer.playerId.toString()
                    );
                    return fullPlayer || selectedPlayer;
                  })
                  .filter(
                    (player) =>
                      // Exclude players who are already out
                      !player.batting?.isOut &&
                      // Exclude current batsmen
                      player.playerId !==
                        match.currentState.currentBatsmen?.striker?.playerId &&
                      player.playerId !==
                        match.currentState.currentBatsmen?.nonStriker?.playerId
                  )
                  .map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.playerName}
                      {isWicketKeeper(player.playerId) && " 🧤 WK"}
                    </option>
                  ));
              })()}
            </select>

            {/* Removed Cancel button - user must select a batsman */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => {
                  try {
                    if (selectedNewBatsman) {
                      // Call the proper handler to update batsmen
                      handleNewBatsmanSelection(selectedNewBatsman);
                      setSelectedNewBatsman("");
                    } else {
                      setStatus("❌ Please select a batsman first");
                    }
                  } catch (error) {
                    console.error("🚨 Error in batsman modal confirm:", error);
                    setStatus(`❌ Modal error: ${error.message}`);
                  }
                }}
                disabled={!selectedNewBatsman}
                style={{
                  padding: "10px 20px",
                  backgroundColor: selectedNewBatsman ? "#28a745" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                  cursor: selectedNewBatsman ? "pointer" : "not-allowed",
                }}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fielder Selection Modal (for caught dismissals) */}
      {showFielderSelection && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 30,
              borderRadius: 10,
              minWidth: 400,
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "#dc3545" }}>
              {wicketBallData?.wicket?.wicketType === "stumped"
                ? "🏏 Stumped!"
                : "🏏 Caught Out!"}
            </h3>
            <p>
              {wicketBallData?.wicket?.wicketType === "stumped"
                ? "Select the wicket-keeper who completed the stumping:"
                : "Select the fielder who took the catch:"}
            </p>

            <select
              value={selectedFielder}
              onChange={(e) => setSelectedFielder(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "2px solid #ddd",
                borderRadius: 6,
                marginBottom: 20,
              }}
            >
              <option value="">-- Select Fielder --</option>
              {(() => {
                if (!match || !match.currentState || !match.teams) return [];
                const bowlingTeamId = match.currentState.bowlingTeam?.teamId;
                if (!bowlingTeamId) return [];
                const bowlingTeam =
                  match.teams.team1.teamId === bowlingTeamId
                    ? match.teams.team1
                    : match.teams.team2;

                // Use selectedPlayers if available, otherwise fall back to all players
                const players =
                  bowlingTeam?.selectedPlayers?.length > 0
                    ? bowlingTeam.selectedPlayers
                    : bowlingTeam?.players || [];

                return players.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                    {isWicketKeeper(player.playerId) && " 🧤 WK"}
                  </option>
                ));
              })()}
            </select>

            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => {
                  setShowFielderSelection(false);
                  setSelectedFielder("");
                  setPendingBallData(null);
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (selectedFielder && pendingBallData) {
                    try {
                      // Get fielder from bowling team
                      let fielder = null;
                      if (match) {
                        const bowlingTeamId =
                          match.currentState.bowlingTeam.teamId;
                        const bowlingTeam =
                          match.teams.team1.teamId === bowlingTeamId
                            ? match.teams.team1
                            : match.teams.team2;
                        fielder = (bowlingTeam.players || []).find(
                          (p) => p.playerId === selectedFielder
                        );
                      }

                      console.log("🏏 Processing caught out:", {
                        batsman:
                          pendingBallData.currentBatsmen.striker?.playerName,
                        fielder: fielder?.playerName,
                      });

                      // Create updated ball data with fielder
                      const updatedBallData = {
                        ...currentBall,
                        fielder,
                      };

                      setCurrentBall(updatedBallData);
                      setShowFielderSelection(false);
                      setSelectedFielder("");

                      // Use updated ball data directly
                      await processBallRecording(
                        pendingBallData.currentBatsmen,
                        pendingBallData.currentBowler,
                        updatedBallData
                      );
                      setPendingBallData(null);
                    } catch (error) {
                      console.error("🚨 Error processing caught out:", {
                        error: error.message,
                        stack: error.stack,
                        selectedFielder,
                        pendingBallData,
                        timestamp: new Date().toISOString(),
                      });

                      setStatus(`❌ Catch processing failed: ${error.message}`);
                      setLiveUpdates((prev) => [
                        ...prev,
                        {
                          type: "error",
                          message: `🔴 Failed to process catch: ${error.message}`,
                          time: new Date(),
                        },
                      ]);

                      // Keep modal open so user can try again
                      setShowFielderSelection(false);
                      setPendingBallData(null);
                    }
                  }
                }}
                disabled={!selectedFielder}
                style={{
                  padding: "10px 20px",
                  backgroundColor: selectedFielder ? "#28a745" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                  cursor: selectedFielder ? "pointer" : "not-allowed",
                }}
              >
                Confirm Catch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Out Selection Modal */}
      {showRunOutSelection && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 30,
              borderRadius: 10,
              minWidth: 400,
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "#dc3545" }}>
              🏏 Run Out!
            </h3>
            <p>Which batsman got run out?</p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 10 }}>
                <input
                  type="radio"
                  name="runOutBatsman"
                  value="striker"
                  checked={selectedRunOutBatsman === "striker"}
                  onChange={(e) => setSelectedRunOutBatsman(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                {pendingBallData?.currentBatsmen?.striker?.playerName ||
                  "Striker"}{" "}
                (Striker)
              </label>
              <label style={{ display: "block" }}>
                <input
                  type="radio"
                  name="runOutBatsman"
                  value="nonStriker"
                  checked={selectedRunOutBatsman === "nonStriker"}
                  onChange={(e) => setSelectedRunOutBatsman(e.target.value)}
                  style={{ marginRight: 8 }}
                />
                {pendingBallData?.currentBatsmen?.nonStriker?.playerName ||
                  "Non-Striker"}{" "}
                (Non-Striker)
              </label>
            </div>

            <p>Select the fielder who ran out the batsman:</p>
            <select
              value={selectedFielder}
              onChange={(e) => setSelectedFielder(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "2px solid #ddd",
                borderRadius: 6,
                marginBottom: 15,
              }}
            >
              <option value="">-- Select Fielder --</option>
              {(() => {
                if (!match || !match.currentState || !match.teams) return [];
                const bowlingTeamId = match.currentState.bowlingTeam?.teamId;
                if (!bowlingTeamId) return [];
                const bowlingTeam =
                  match.teams.team1.teamId === bowlingTeamId
                    ? match.teams.team1
                    : match.teams.team2;

                // Use selectedPlayers if available, otherwise fall back to all players
                const players =
                  bowlingTeam?.selectedPlayers?.length > 0
                    ? bowlingTeam.selectedPlayers
                    : bowlingTeam?.players || [];

                return players.map((player) => (
                  <option key={player.playerId} value={player.playerId}>
                    {player.playerName}
                    {isWicketKeeper(player.playerId) && " 🧤 WK"}
                  </option>
                ));
              })()}
            </select>

            <p>Select the assistant fielder (optional):</p>
            <select
              value={selectedAssistantFielder}
              onChange={(e) => setSelectedAssistantFielder(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "2px solid #ddd",
                borderRadius: 6,
                marginBottom: 20,
              }}
            >
              <option value="">-- No Assistant Fielder --</option>
              {(() => {
                if (!match || !match.currentState || !match.teams) return [];
                const bowlingTeamId = match.currentState.bowlingTeam?.teamId;
                if (!bowlingTeamId) return [];
                const bowlingTeam =
                  match.teams.team1.teamId === bowlingTeamId
                    ? match.teams.team1
                    : match.teams.team2;

                // Use selectedPlayers if available, otherwise fall back to all players
                const players =
                  bowlingTeam?.selectedPlayers?.length > 0
                    ? bowlingTeam.selectedPlayers
                    : bowlingTeam?.players || [];

                return players
                  .filter((p) => p.playerId !== selectedFielder)
                  .map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.playerName}
                      {isWicketKeeper(player.playerId) && " 🧤 WK"}
                    </option>
                  ));
              })()}
            </select>

            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => {
                  setShowRunOutSelection(false);
                  setSelectedRunOutBatsman("");
                  setSelectedFielder("");
                  setSelectedAssistantFielder("");
                  setPendingBallData(null);
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (
                    selectedRunOutBatsman &&
                    selectedFielder &&
                    pendingBallData
                  ) {
                    try {
                      // Get fielder from bowling team
                      let fielder = null;
                      let assistantFielder = null;

                      if (match) {
                        const bowlingTeamId =
                          match.currentState.bowlingTeam.teamId;
                        const bowlingTeam =
                          match.teams.team1.teamId === bowlingTeamId
                            ? match.teams.team1
                            : match.teams.team2;
                        fielder = (bowlingTeam.players || []).find(
                          (p) => p.playerId === selectedFielder
                        );

                        // Get assistant fielder if selected
                        if (selectedAssistantFielder) {
                          assistantFielder = (bowlingTeam.players || []).find(
                            (p) => p.playerId === selectedAssistantFielder
                          );
                        }
                      }

                      const dismissedPlayer =
                        selectedRunOutBatsman === "striker"
                          ? pendingBallData.currentBatsmen.striker
                          : pendingBallData.currentBatsmen.nonStriker;

                      console.log("🏃 Processing run-out:", {
                        dismissedPlayer: dismissedPlayer?.playerName,
                        fielder: fielder?.playerName,
                        assistantFielder: assistantFielder?.playerName,
                      });

                      // Update current ball state with run-out details
                      const updatedBallData = {
                        ...currentBall,
                        fielder,
                        assistantFielder,
                        wicket: {
                          ...currentBall.wicket,
                          dismissedPlayer,
                          fielder,
                          assistantFielder,
                        },
                      };

                      // Update state
                      setCurrentBall(updatedBallData);
                      setShowRunOutSelection(false);
                      setSelectedRunOutBatsman("");
                      setSelectedFielder("");
                      setSelectedAssistantFielder("");

                      // Use the updated ball data directly instead of waiting for state update
                      await processBallRecording(
                        pendingBallData.currentBatsmen,
                        pendingBallData.currentBowler,
                        updatedBallData
                      );
                      setPendingBallData(null);
                    } catch (error) {
                      console.error("❌ Error processing run-out:", error);
                      setStatus(`Error processing run-out: ${error.message}`);
                      setShowRunOutSelection(false);
                      setPendingBallData(null);
                    }
                  }
                }}
                disabled={!selectedRunOutBatsman || !selectedFielder}
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    selectedRunOutBatsman && selectedFielder
                      ? "#28a745"
                      : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                  cursor:
                    selectedRunOutBatsman && selectedFielder
                      ? "pointer"
                      : "not-allowed",
                }}
              >
                Confirm Run Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Last Ball Confirmation Modal */}
      {showLastBallConfirmation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 40,
              borderRadius: 12,
              minWidth: 450,
              maxWidth: 600,
              boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
              border: "3px solid #dc3545",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px 0",
                color: "#dc3545",
                textAlign: "center",
              }}
            >
              ⚠️ FINAL BALL WARNING
            </h2>

            <div
              style={{
                backgroundColor: "#fff3cd",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "2px solid #ffc107",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                This is the LAST BALL of the innings!
              </p>
              <p style={{ margin: "0", fontSize: "14px", color: "#856404" }}>
                Once recorded, this action CANNOT be undone.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "15px",
                borderRadius: "6px",
                marginBottom: "25px",
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Current Score:</strong> {score?.runs}/{score?.wickets}{" "}
                in {Math.floor((score?.balls || 0) / 6)}.
                {(score?.balls || 0) % 6} overs
              </p>
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Ball Type:</strong>{" "}
                {currentBall.ballType?.toUpperCase() || "LEGAL"}
              </p>
              <p style={{ margin: "0", fontSize: "14px" }}>
                <strong>Runs:</strong> {currentBall.runs || 0}
                {currentBall.isWicket && (
                  <span style={{ color: "#dc3545", marginLeft: "10px" }}>
                    + WICKET
                  </span>
                )}
              </p>
            </div>

            <p
              style={{
                textAlign: "center",
                fontSize: "15px",
                fontWeight: "bold",
                marginBottom: "25px",
                color: "#495057",
              }}
            >
              Are you sure you want to record this ball?
            </p>

            <div
              style={{
                display: "flex",
                gap: 15,
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => {
                  setShowLastBallConfirmation(false);
                  setPendingLastBall(null);
                  setStatus("Last ball recording cancelled");
                }}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                ❌ Cancel
              </button>
              <button
                onClick={async () => {
                  setShowLastBallConfirmation(false);
                  setStatus("Recording final ball of innings...");
                  // Proceed with ball recording
                  if (pendingLastBall) {
                    await processBallRecording(
                      pendingLastBall.currentBatsmen,
                      pendingLastBall.currentBowler
                    );
                  }
                  setPendingLastBall(null);
                }}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                ✅ Confirm & Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winning Ball Confirmation Modal */}
      {showWinningBallConfirmation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 2100,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 40,
              borderRadius: 12,
              minWidth: 500,
              maxWidth: 650,
              boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
              border: "4px solid #28a745",
            }}
          >
            <h2
              style={{
                margin: "0 0 20px 0",
                color: "#28a745",
                textAlign: "center",
                fontSize: "28px",
              }}
            >
              🏆 WINNING BALL!
            </h2>

            <div
              style={{
                backgroundColor: "#d4edda",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "2px solid #28a745",
              }}
            >
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#155724",
                }}
              >
                🎯 This ball will WIN THE MATCH!
              </p>
              <p style={{ margin: "0", fontSize: "14px", color: "#155724" }}>
                The target will be achieved with this ball. Please confirm to
                record.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "15px",
                borderRadius: "6px",
                marginBottom: "25px",
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Current Score:</strong> {score?.runs}/{score?.wickets}
              </p>
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Target:</strong>{" "}
                {match?.currentState?.target ||
                  match?.score?.innings2?.target ||
                  0}
              </p>
              <p style={{ margin: "0 0 8px 0", fontSize: "14px" }}>
                <strong>Runs to Add:</strong> {currentBall.runs || 0}
              </p>
              <p style={{ margin: "0", fontSize: "14px" }}>
                <strong>Final Score:</strong>{" "}
                {(score?.runs || 0) + (currentBall.runs || 0)}/
                {score?.wickets || 0}
                <span
                  style={{
                    color: "#28a745",
                    marginLeft: "10px",
                    fontWeight: "bold",
                  }}
                >
                  ✓ TARGET ACHIEVED
                </span>
              </p>
            </div>

            <p
              style={{
                textAlign: "center",
                fontSize: "15px",
                fontWeight: "bold",
                marginBottom: "25px",
                color: "#495057",
              }}
            >
              Confirm this is the winning ball?
            </p>

            <div
              style={{
                display: "flex",
                gap: 15,
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => {
                  setShowWinningBallConfirmation(false);
                  setPendingWinningBall(null);
                  setStatus("Winning ball recording cancelled");
                }}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                ❌ Cancel
              </button>
              <button
                onClick={async () => {
                  setShowWinningBallConfirmation(false);
                  setStatus("🏆 Recording winning ball...");
                  // Proceed with ball recording
                  if (pendingWinningBall) {
                    await processBallRecording(
                      pendingWinningBall.currentBatsmen,
                      pendingWinningBall.currentBowler
                    );
                  }
                  setPendingWinningBall(null);
                }}
                style={{
                  padding: "12px 30px",
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                }}
              >
                🏆 Confirm & Win!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Bowler Selection Modal */}
      {showNewBowlerSelection && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 30,
              borderRadius: 10,
              minWidth: 400,
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 20px 0", color: "#28a745" }}>
              🏏 Over Completed!
            </h3>
            <p>Select the new bowler for the next over:</p>

            <select
              value={selectedNewBowler}
              onChange={(e) => setSelectedNewBowler(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                fontSize: 16,
                border: "2px solid #ddd",
                borderRadius: 6,
                marginBottom: 20,
              }}
            >
              <option value="">-- Select New Bowler --</option>
              {match && match.currentState?.bowlingTeam
                ? (() => {
                    const bowlingTeamId = match.currentState.bowlingTeam.teamId;
                    const bowlingTeam =
                      match.teams.team1.teamId === bowlingTeamId
                        ? match.teams.team1
                        : match.teams.team2;

                    // Use selectedPlayers if available, otherwise fall back to bowlingOrder or all players
                    let bowlingPlayers;
                    if (
                      bowlingTeam.selectedPlayers &&
                      bowlingTeam.selectedPlayers.length > 0
                    ) {
                      bowlingPlayers = bowlingTeam.selectedPlayers;
                    } else if (
                      bowlingTeam.bowlingOrder &&
                      bowlingTeam.bowlingOrder.length > 0
                    ) {
                      bowlingPlayers = bowlingTeam.bowlingOrder.map(
                        (orderPlayer) => {
                          const fullPlayer = bowlingTeam.players.find(
                            (p) => p.playerId === orderPlayer.playerId
                          );
                          return fullPlayer || orderPlayer;
                        }
                      );
                    } else {
                      bowlingPlayers = bowlingTeam.players || [];
                    }

                    return bowlingPlayers
                      .filter(
                        (player) =>
                          player.playerId !==
                          match?.currentState?.currentBowler?.playerId
                      ) // Can't bowl consecutive overs
                      .map((player) => (
                        <option key={player.playerId} value={player.playerId}>
                          {player.playerName}
                          {isWicketKeeper(player.playerId) && " 🧤 WK"}
                        </option>
                      ));
                  })()
                : []}
            </select>

            <div
              style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => {
                  setShowNewBowlerSelection(false);
                  setSelectedNewBowler("");
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (selectedNewBowler && match) {
                    // Find the new bowler player object
                    const bowlingTeamId = match.currentState.bowlingTeam.teamId;
                    const bowlingTeam =
                      match.teams.team1.teamId === bowlingTeamId
                        ? match.teams.team1
                        : match.teams.team2;
                    const newBowler = bowlingTeam.players.find(
                      (p) => p.playerId === selectedNewBowler
                    );

                    if (newBowler) {
                      // Update the current players with new bowler
                      await updateCurrentPlayers(
                        match.currentState.currentBatsmen.striker,
                        match.currentState.currentBatsmen.nonStriker,
                        newBowler,
                        match.currentState.battingTeam.teamId,
                        match.currentState.bowlingTeam.teamId
                      );
                    }

                    setShowNewBowlerSelection(false);
                    setSelectedNewBowler("");
                  }
                }}
                disabled={!selectedNewBowler}
                style={{
                  padding: "10px 20px",
                  backgroundColor: selectedNewBowler ? "#28a745" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: 5,
                  cursor: selectedNewBowler ? "pointer" : "not-allowed",
                }}
              >
                Confirm Bowler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Innings Break Modal */}
      {showInningsBreak && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              maxWidth: "500px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <h2 style={{ color: "#28a745", marginBottom: "20px" }}>
              🏏 First Innings Complete!
            </h2>

            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#495057" }}>
                📊 Innings Summary
              </h3>
              <p
                style={{
                  fontSize: "18px",
                  margin: "5px 0",
                  fontWeight: "bold",
                }}
              >
                Final Score: {score.runs}/{score.wickets}
              </p>
              <p style={{ fontSize: "16px", margin: "5px 0" }}>
                Overs: {Math.floor(score.balls / 6)}.{score.balls % 6}
              </p>
              <p style={{ fontSize: "16px", margin: "5px 0" }}>
                Extras: {score.extras?.total || 0}
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#e7f3ff",
                padding: "15px",
                borderRadius: "8px",
                marginBottom: "25px",
                border: "2px solid #0066cc",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#0066cc" }}>
                🎯 Target for Second Innings
              </h3>
              <p
                style={{
                  fontSize: "24px",
                  margin: "0",
                  fontWeight: "bold",
                  color: "#0066cc",
                }}
              >
                {targetScore} runs to win
              </p>
              <p
                style={{ fontSize: "14px", margin: "5px 0 0 0", color: "#666" }}
              >
                In {match?.overs || 20} {match?.overs === 1 ? "over" : "overs"}{" "}
                ({(match?.overs || 20) * 6}{" "}
                {(match?.overs || 20) * 6 === 1 ? "ball" : "balls"})
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "16px", color: "#666", lineHeight: "1.5" }}>
                🔄 Teams will now swap roles
                <br />
                Batting team becomes bowling team and vice versa
              </p>
            </div>

            <button
              onClick={startSecondInnings}
              style={{
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                padding: "12px 30px",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#218838")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#28a745")}
            >
              🚀 Start Second Innings
            </button>
          </div>
        </div>
      )}

      {/* Match Complete Modal */}
      {showMatchComplete && matchResult && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "40px",
              borderRadius: "15px",
              maxWidth: "600px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              border: "3px solid #ffd700",
            }}
          >
            <h1
              style={{
                color:
                  matchResult?.isTie ||
                  match?.result?.status === "tied" ||
                  matchResult?.winType === "tie" ||
                  (matchResult?.description || "")
                    .toLowerCase()
                    .includes("tied") ||
                  (matchResult?.summary || "").toLowerCase().includes("tied")
                    ? "#ff8c00"
                    : "#ff6b35",
                marginBottom: "20px",
                fontSize: "32px",
                textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {matchResult?.isTie ||
              match?.result?.status === "tied" ||
              matchResult?.winType === "tie"
                ? "🤝 MATCH TIED! 🤝"
                : "🏆 MATCH COMPLETE! 🏆"}
            </h1>

            <div
              style={{
                backgroundColor: matchResult.isTie ? "#fff3cd" : "#fff3cd",
                padding: "25px",
                borderRadius: "10px",
                marginBottom: "25px",
                border: matchResult.isTie
                  ? "2px solid #ff8c00"
                  : "2px solid #ffc107",
              }}
            >
              {matchResult?.isTie ||
              match?.result?.status === "tied" ||
              matchResult?.winType === "tie" ||
              (matchResult?.description || "").toLowerCase().includes("tied") ||
              (matchResult?.summary || "").toLowerCase().includes("tied") ? (
                <h2
                  style={{
                    margin: "0 0 15px 0",
                    color: "#cc6900",
                    fontSize: "28px",
                  }}
                >
                  🤝 IT'S A TIE! 🤝
                </h2>
              ) : (
                <h2
                  style={{
                    margin: "0 0 15px 0",
                    color: "#856404",
                    fontSize: "28px",
                  }}
                >
                  🎉{" "}
                  {matchResult?.winner?.teamName ||
                    (typeof matchResult?.winner === "string"
                      ? matchResult.winner
                      : match?.result?.winner?.teamName) ||
                    "Winner"}{" "}
                  WINS! 🎉
                </h2>
              )}
              <p
                style={{
                  fontSize: "20px",
                  margin: "10px 0",
                  fontWeight: "bold",
                  color: "#495057",
                }}
              >
                {matchResult.description}
              </p>
              <p
                style={{
                  fontSize: "16px",
                  margin: "10px 0 0 0",
                  color: "#666",
                  fontStyle: "italic",
                }}
              >
                {matchResult.summary}
              </p>

              {/* Additional match details */}
              {matchResult.ballsRemaining && (
                <p
                  style={{
                    fontSize: "14px",
                    margin: "10px 0 0 0",
                    color: "#28a745",
                    fontWeight: "bold",
                  }}
                >
                  🕐 Won with {matchResult.ballsRemaining} balls remaining
                </p>
              )}

              {matchResult.howLost && (
                <p
                  style={{
                    fontSize: "14px",
                    margin: "10px 0 0 0",
                    color: "#dc3545",
                    fontWeight: "bold",
                  }}
                >
                  📉{" "}
                  {matchResult.howLost === "all out"
                    ? "Team was all out"
                    : `Completed ${match?.overs || 20} ${
                        match?.overs === 1 ? "over" : "overs"
                      }`}
                </p>
              )}
            </div>

            <div
              style={{
                backgroundColor: "#f8f9fa",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "25px",
              }}
            >
              <h3 style={{ margin: "0 0 15px 0", color: "#495057" }}>
                📊 Final Score
              </h3>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  textAlign: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "5px 0",
                      fontWeight: "bold",
                      fontSize: "18px",
                    }}
                  >
                    Second Innings
                  </p>
                  <p
                    style={{ margin: "0", fontSize: "20px", color: "#007bff" }}
                  >
                    {score.runs}/{score.wickets}
                  </p>
                  <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
                    ({Math.floor(score.balls / 6)}.{score.balls % 6} overs)
                  </p>
                </div>
                <div>
                  <p
                    style={{
                      margin: "5px 0",
                      fontWeight: "bold",
                      fontSize: "18px",
                    }}
                  >
                    Target
                  </p>
                  <p
                    style={{ margin: "0", fontSize: "20px", color: "#28a745" }}
                  >
                    {targetScore}
                  </p>
                  <p style={{ margin: "0", fontSize: "14px", color: "#666" }}>
                    ({match?.overs || 20} overs)
                  </p>
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", gap: "15px", justifyContent: "center" }}
            >
              {(matchResult?.isTie ||
                match?.result?.status === "tied" ||
                matchResult?.winType === "tie" ||
                superOverResult?.isTie ||
                (matchResult?.description || "")
                  .toLowerCase()
                  .includes("tied") ||
                (matchResult?.summary || "")
                  .toLowerCase()
                  .includes("tied")) && (
                <button
                  onClick={startSuperOver}
                  style={{
                    background:
                      "linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)",
                    color: "white",
                    border: "none",
                    padding: "12px 25px",
                    borderRadius: "6px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    marginRight: "8px",
                    boxShadow: "0 4px 12px rgba(255, 140, 0, 0.3)",
                  }}
                >
                  🔁 Start Super Over{" "}
                  {match?.superOvers?.length > 0
                    ? `#${(match?.superOvers?.length || 0) + 1}`
                    : ""}
                </button>
              )}

              <button
                onClick={() => {
                  setShowMatchComplete(false);
                  // Navigate to completed scorecard view
                  if (window.location.pathname.includes("App.jsx")) {
                    // If using App.jsx routing
                    window.dispatchEvent(
                      new CustomEvent("navigate", {
                        detail: { view: "completed-scorecard", matchId },
                      })
                    );
                  } else {
                    // Fallback: open in new tab
                    window.open(`/scorecard/${matchId}`, "_blank");
                  }
                }}
                style={{
                  backgroundColor: "#667eea",
                  color: "white",
                  border: "none",
                  padding: "12px 25px",
                  borderRadius: "6px",
                  fontSize: "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#5568d3";
                  e.target.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#667eea";
                  e.target.style.transform = "translateY(0)";
                }}
              >
                🏆 View Full Scorecard
              </button>
              <button
                onClick={() => setShowMatchComplete(false)}
                style={{
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "12px 25px",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  padding: "12px 25px",
                  borderRadius: "6px",
                  fontSize: "16px",
                  cursor: "pointer",
                }}
              >
                🔄 New Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Over Player Selection Modal */}
      {/* Super Over Innings Break Modal */}
      {showSuperOverInningsBreak && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1001,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "35px",
              borderRadius: "15px",
              maxWidth: "500px",
              width: "90%",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(255, 140, 0, 0.4)",
              border: "3px solid #ff8c00",
            }}
          >
            <h2 style={{ color: "#ff8c00", marginBottom: "20px" }}>
              🔁 Super Over 1st Innings Complete!
            </h2>

            <div
              style={{
                background: "linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)",
                color: "white",
                padding: "25px",
                borderRadius: "10px",
                marginBottom: "25px",
              }}
            >
              <h3
                style={{ margin: "0 0 10px 0", fontSize: "16px", opacity: 0.9 }}
              >
                1st Innings Score
              </h3>
              <div style={{ fontSize: "36px", fontWeight: "bold" }}>
                {superOverScore.runs}/{superOverScore.wickets}
              </div>
              <div style={{ fontSize: "14px", marginTop: "5px", opacity: 0.9 }}>
                ({superOverScore.balls} balls)
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#e7f3ff",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "25px",
                border: "2px solid #0066cc",
              }}
            >
              <h3 style={{ margin: "0 0 10px 0", color: "#0066cc" }}>
                🎯 Target for 2nd Innings
              </h3>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#0066cc",
                }}
              >
                {superOverTarget} runs
              </div>
              <div
                style={{ fontSize: "14px", color: "#666", marginTop: "5px" }}
              >
                in 6 balls
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#666" }}>
                🔄 Teams will now swap roles for Super Over 2nd Innings
              </p>
            </div>

            <button
              onClick={startSuperOverSecondInnings}
              style={{
                background: "linear-gradient(135deg, #ff8c00 0%, #ffa500 100%)",
                color: "white",
                border: "none",
                padding: "15px 35px",
                borderRadius: "8px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255, 140, 0, 0.3)",
              }}
            >
              🚀 Start Super Over 2nd Innings
            </button>
          </div>
        </div>
      )}

      {/* Global Error Notification System */}
      <GlobalErrorNotification
        errors={globalErrors}
        onRetry={retryGlobalError}
        onDismiss={removeGlobalError}
        maxVisible={3}
        autoDismissTime={7000}
      />
    </div>
  );
};

export default ScorerKeypad;
