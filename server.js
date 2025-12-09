const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

// Session Middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Access denied. No token provided.'
        });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please log in again.' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token. Please log in again.' });
        } else {
            return res.status(401).json({ error: 'Token verification failed.' });
        }
    }
}

function requireCoach(req, res, next) {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    if (req.user.role === "coach") {
        return next(); // authorized
    }
    return res.status(403).json({ error: "Manager or Admin role required" });
}

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

// AUTH ROUTES
// REGISTER
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || "player"
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Failed to register user" });
    }
});

// LOGIN
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});

// LOGOUT
app.post('/api/logout', (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// PLAYER ROUTES
// GET all players
app.get('/api/players', requireAuth, async (req, res) => {
  try {
    const players = await Player.findAll();
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// GET player by ID
app.get('/api/players/:id', requireAuth, async (req, res) => {
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
app.post('/api/players', requireAuth, async (req, res) => {
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
app.put('/api/players/:id', requireAuth, requireCoach, async (req, res) => {
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
app.delete('/api/players/:id', requireAuth, async (req, res) => {
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
app.get('/api/stats/:playerId', requireAuth, async (req, res) => {
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
app.post('/api/stats', requireAuth, async (req, res) => {
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
app.get('/api/training-sessions/:playerId', requireAuth, async (req, res) => {
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
app.post('/api/training-sessions', requireAuth, requireCoach, async (req, res) => {
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
app.get('/api/evaluations/:playerId', requireAuth, async (req, res) => {
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
app.post('/api/evaluations', requireAuth, requireCoach, async (req, res) => {
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

// START SERVER
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Player Performance API running at http://localhost:${PORT}`);
  });
}

module.exports = app;
