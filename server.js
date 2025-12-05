require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { db, User, Player, PerformanceStat, TrainingSession, CoachEvaluation } = require('./database/setup');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

//error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Something went wrong'
  });
});

// DATABASE CONNECTION
async function initializeDatabase() {
  try {
    await db.authenticate();
    console.log('Connection to database established successfully.');

  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

initializeDatabase();

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Player Performance API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Root endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Player Performance API',
    version: '1.0.0',
    description: 'REST API for tracking athletes, match performance, training, and evaluations.',
    endpoints: {
      health: 'GET /health',
      players: {
        list: 'GET /api/players',
        getById: 'GET /api/players/:id',
        create: 'POST /api/players',
        update: 'PUT /api/players/:id',
        delete: 'DELETE /api/players/:id'
      },
      stats: {
        listByPlayer: 'GET /api/stats/:playerId',
        create: 'POST /api/stats',
      },
      training: {
        listByPlayer: 'GET /api/training-sessions/:playerId',
        create: 'POST /api/training-sessions',
      },
      evaluations: {
        listByPlayer: 'GET /api/evaluations/:playerId',
        create: 'POST /api/evaluations',
      }
    }
  });
});

// PLAYER ROUTES
// GET all players
app.get('/api/players', async (req, res) => {
  try {
    const players = await Player.findAll();
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// GET player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    const player = await Player.findByPk(req.params.id);

    if (!player) return res.status(404).json({ error: 'Player not found' });

    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

// CREATE player
app.post('/api/players', async (req, res) => {
  try {
    const { name, age, position, team, userId } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const newPlayer = await Player.create({
      name,
      age,
      position,
      team,
      userId: userId || null
    });

    res.status(201).json(newPlayer);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// UPDATE player
app.put('/api/players/:id', async (req, res) => {
  try {
    const { name, age, position, team, userId } = req.body;

    const [updated] = await Player.update(
      { name, age, position, team, userId },
      { where: { id: req.params.id } }
    );

    if (updated === 0)
      return res.status(404).json({ error: 'Player not found' });

    const updatedPlayer = await Player.findByPk(req.params.id);
    res.json(updatedPlayer);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: 'Failed to update player' });
  }
});

// DELETE player
app.delete('/api/players/:id', async (req, res) => {
  try {
    const deleted = await Player.destroy({
      where: { id: req.params.id }
    });

    if (deleted === 0)
      return res.status(404).json({ error: 'Player not found' });

    res.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// PERFORMANCE STATS ROUTES
// GET stats for a player
app.get('/api/stats/:playerId', async (req, res) => {
  try {
    const stats = await PerformanceStat.findAll({
      where: { playerId: req.params.playerId }
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// CREATE stat entry
app.post('/api/stats', async (req, res) => {
  try {
    const {
      playerId,
      goals,
      assists,
      passAccuracy,
      minutesPlayed,
      matchDate
    } = req.body;

    if (!playerId || !matchDate)
      return res.status(400).json({ error: 'playerId and matchDate required' });

    const stat = await PerformanceStat.create({
      playerId,
      goals,
      assists,
      passAccuracy,
      minutesPlayed,
      matchDate
    });

    res.status(201).json(stat);
  } catch (error) {
    console.error('Error creating stat:', error);
    res.status(500).json({ error: 'Failed to create stat' });
  }
});

// TRAINING SESSION ROUTES
// GET sessions for player
app.get('/api/training-sessions/:playerId', async (req, res) => {
  try {
    const sessions = await TrainingSession.findAll({
      where: { playerId: req.params.playerId }
    });

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching training sessions:', error);
    res.status(500).json({ error: 'Failed to fetch training sessions' });
  }
});

// CREATE session
app.post('/api/training-sessions', async (req, res) => {
  try {
    const { playerId, date, duration, workoutType, notes } = req.body;

    if (!playerId || !date)
      return res.status(400).json({ error: 'playerId and date required' });

    const session = await TrainingSession.create({
      playerId,
      date,
      duration,
      workoutType,
      notes
    });

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// COACH EVALUATIONS ROUTES
// GET evaluations for player
app.get('/api/evaluations/:playerId', async (req, res) => {
  try {
    const evaluations = await CoachEvaluation.findAll({
      where: { playerId: req.params.playerId },
      include: [{ model: User, as: 'coach', attributes: ['name', 'email'] }]
    });

    res.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ error: 'Failed to fetch evaluations' });
  }
});

// CREATE evaluation
app.post('/api/evaluations', async (req, res) => {
  try {
    const { playerId, coachId, rating, strengths, weaknesses, comments } = req.body;

    if (!playerId || !coachId || rating == null)
      return res.status(400).json({ error: 'playerId, coachId, and rating required' });

    const evaluation = await CoachEvaluation.create({
      playerId,
      coachId,
      rating,
      strengths,
      weaknesses,
      comments
    });

    res.status(201).json(evaluation);
  } catch (error) {
    console.error('Error creating evaluation:', error);
    res.status(500).json({ error: 'Failed to create evaluation' });
  }
});

//404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.path} is not a valid endpoint`
  });
});

// START SERVER
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Player Performance API running at http://localhost:${PORT}`);
  });
}

module.exports = app;
