# Scorer Test Frontend

A minimal React frontend to test the cricket scorer flow and real-time updates.

## Setup & Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the dev server:**
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

3. **Ensure backend is running:**
   - Backend should be running on http://localhost:5001
   - Make sure MongoDB is connected
   - Redis is optional (will fallback to Socket.IO only mode)

## Testing the Scorer Flow

### Step 1: Login & Create Match
1. Use the login form with valid credentials (or create a test user in your DB)
2. Tournament ID is pre-filled with your Delhi T20 Championship ID: `68ed18c056f9077394c82697`
3. Click "Create Match" - this will:
   - Auto-generate fixtures for the tournament
   - Create a match between Delhi Dynamites vs Mumbai Warriors
   - Display match details

### Step 2: Start Match  
1. Click "Start Match (Auto Toss)" to:
   - Set Delhi Dynamites to win toss and bat first
   - Set batting/bowling orders automatically
   - Start the match

### Step 3: Live Scoring
1. Switch to "Live Scoring" tab
2. Enter the generated Match ID
3. Click "Connect & Join" to:
   - Connect to WebSocket server
   - Join the match room
   - Start receiving live updates

4. Click "Record 1 run (test)" to:
   - Send a ball event via socket.io
   - See live score updates
   - View commentary updates

## Features Tested

- ✅ Match creation from tournament
- ✅ Fixture generation
- ✅ Match start with toss & lineups
- ✅ Real-time WebSocket connection
- ✅ Ball event recording via socket
- ✅ Live score updates
- ✅ Commentary feed
- ✅ Match state synchronization

## API Endpoints Used

- `POST /api/users/login` - Authentication
- `POST /api/fixtures/tournament/:id/auto-generate` - Generate fixtures
- `POST /api/live-matches` - Create match
- `POST /api/live-matches/:id/start` - Start match
- `WebSocket` - Real-time scoring events

## Tournament Data

Uses your existing tournament:
- **Tournament ID:** FRAT255361 (68ed18c056f9077394c82697)
- **Teams:** Delhi Dynamites vs Mumbai Warriors
- **Format:** T20, 15 overs
- **Players:** 10 per team (as configured)

## Troubleshooting

1. **Auth errors:** Update login credentials or temporarily disable auth middleware
2. **Socket connection fails:** Check if backend WebSocket server is running
3. **Match creation fails:** Ensure tournament exists and teams are properly registered
4. **No real-time updates:** Check browser console for WebSocket errors

## Next Steps for Production

1. Add proper authentication flow
2. Implement complete scorer interface (over/wicket/boundary buttons)
3. Add match summary and statistics
4. Handle edge cases and error states
5. Add player selection and substitution
6. Implement umpire decision flows

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
