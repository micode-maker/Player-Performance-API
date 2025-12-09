const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();
const path = require('path');

// DATABASE INITIALIZATION
const dbName = process.env.DB_NAME || 'player_performance.db';
const storagePath = path.resolve(__dirname, dbName);

let db;

if (process.env.NODE_ENV === "test") {
  // In-memory SQLite for tests
  db = new Sequelize("sqlite::memory:", {
    logging: false,
  });
} else {
  db = new Sequelize({
    dialect: "sqlite",
    storage: storagePath,
    logging: false,
  });
}


console.log(`Using SQLite database at: ${storagePath}`);

// MODELS
// USER
const User = db.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { len: [2, 50] }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'player',
        validate: {
            isIn: [['player', 'coach']]
        }
  }
});

// PLAYER
// Represents an athlete profile.
// A player may or may not have a linked user account.
const Player = db.define('Player', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age: DataTypes.INTEGER,
  position: DataTypes.STRING,
  team: DataTypes.STRING
});


// PERFORMANCE STATS
const PerformanceStat = db.define('PerformanceStat', {
  goals: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  assists: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  passAccuracy: {
    type: DataTypes.FLOAT,
    validate: { min: 0, max: 100 }
  },
  minutesPlayed: DataTypes.INTEGER,
  matchDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
});


// TRAINING SESSIONS
const TrainingSession = db.define('TrainingSession', {
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  duration: DataTypes.INTEGER, // minutes
  workoutType: DataTypes.STRING,
  notes: DataTypes.TEXT
});


// COACH EVALUATIONS
const CoachEvaluation = db.define('CoachEvaluation', {
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 10 }
  },
  strengths: DataTypes.TEXT,
  weaknesses: DataTypes.TEXT,
  comments: DataTypes.TEXT
});

// RELATIONSHIPS
User.hasMany(Player, { foreignKey: 'userId', as: 'players' });
Player.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Player.hasMany(PerformanceStat, { foreignKey: 'playerId', as: 'stats', onDelete: 'CASCADE' });
PerformanceStat.belongsTo(Player, { foreignKey: 'playerId', as: 'player' });

Player.hasMany(TrainingSession, { foreignKey: 'playerId', as: 'trainingSessions', onDelete: 'CASCADE' });
TrainingSession.belongsTo(Player, { foreignKey: 'playerId', as: 'player' });

Player.hasMany(CoachEvaluation, { foreignKey: 'playerId', as: 'evaluations', onDelete: 'CASCADE' });
CoachEvaluation.belongsTo(Player, { foreignKey: 'playerId', as: 'player' });

User.hasMany(CoachEvaluation, { foreignKey: 'coachId', as: 'authoredEvaluations', onDelete: 'CASCADE' });
CoachEvaluation.belongsTo(User, { foreignKey: 'coachId', as: 'coach' });

// DATABASE SYNC
async function setupDatabase() {
  try {
    await db.authenticate();
    console.log('Connection to database established successfully.');

  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = {
  db,
  User,
  Player,
  PerformanceStat,
  TrainingSession,
  CoachEvaluation
};
