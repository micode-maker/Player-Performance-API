const bcrypt = require('bcryptjs');
const { db, User, Player, PerformanceStat, TrainingSession, CoachEvaluation } = require('./setup');

async function seedDatabase() {
  try {
    await db.authenticate();
    console.log('Connected to database for seeding.');

    await db.sync({ force: true });
    console.log('Database tables created successfully.');

    // SAMPLE USERS
    const users = await User.bulkCreate([
      {
        name: 'Coach Carter',
        email: 'coach@example.com',
        password: await bcrypt.hash('coach123', 10),
        role: 'coach'
      },
      {
        name: 'Lionel Messi',
        email: 'messi@example.com',
        password: await bcrypt.hash('goat123', 10),
        role: 'player'
      },
      {
        name: 'Cristiano Ronaldo',
        email: 'ronaldo@example.com',
        password: await bcrypt.hash('cr7pass', 10),
        role: 'player'
      }
    ]);
    console.log('Sample users inserted.');

    const coach = users[0];
    const messiUser = users[1];
    const ronaldoUser = users[2];

    // SAMPLE PLAYER PROFILES
    const players = await Player.bulkCreate([
      {
        name: 'Lionel Messi',
        age: 36,
        position: 'RW',
        team: 'Inter Miami',
        userId: messiUser.id
      },
      {
        name: 'Cristiano Ronaldo',
        age: 38,
        position: 'CF',
        team: 'Al Nassr',
        userId: ronaldoUser.id
      },
      {
        name: 'Kylian Mbappé',
        age: 25,
        position: 'LW',
        team: 'PSG',
        userId: null // No login account
      }
    ]);
    console.log('Sample players inserted.');

    const messi = players[0];
    const ronaldo = players[1];
    const mbappe = players[2];

    // SAMPLE PERFORMANCE STATS
    await PerformanceStat.bulkCreate([
      {
        playerId: messi.id,
        goals: 2,
        assists: 1,
        passAccuracy: 88,
        minutesPlayed: 90,
        matchDate: '2025-10-15'
      },
      {
        playerId: messi.id,
        goals: 1,
        assists: 2,
        passAccuracy: 91,
        minutesPlayed: 90,
        matchDate: '2025-10-29'
      },
      {
        playerId: ronaldo.id,
        goals: 3,
        assists: 0,
        passAccuracy: 82,
        minutesPlayed: 88,
        matchDate: '2025-10-21'
      },
      {
        playerId: mbappe.id,
        goals: 1,
        assists: 1,
        passAccuracy: 89,
        minutesPlayed: 92,
        matchDate: '2025-10-24'
      }
    ]);
    console.log('Sample performance stats inserted.');

    // SAMPLE TRAINING SESSIONS
    await TrainingSession.bulkCreate([
      {
        playerId: messi.id,
        date: '2025-11-01',
        duration: 75,
        workoutType: 'Technical',
        notes: 'Ball control and finishing drills.'
      },
      {
        playerId: ronaldo.id,
        date: '2025-11-02',
        duration: 90,
        workoutType: 'Strength',
        notes: 'Weight training and sprint intervals.'
      },
      {
        playerId: mbappe.id,
        date: '2025-11-02',
        duration: 80,
        workoutType: 'Speed',
        notes: 'Acceleration training and agility ladder work.'
      }
    ]);
    console.log('Sample training sessions inserted.');

    // SAMPLE COACH EVALUATIONS
    await CoachEvaluation.bulkCreate([
      {
        playerId: messi.id,
        coachId: coach.id,
        rating: 9,
        strengths: 'Vision, passing, finishing',
        weaknesses: 'Physical strength declining',
        comments: 'Still the best playmaker on the field.'
      },
      {
        playerId: ronaldo.id,
        coachId: coach.id,
        rating: 8,
        strengths: 'Finishing, physical strength, leadership',
        weaknesses: 'Ball control under pressure',
        comments: 'Dominant in aerial duels, needs quicker decision making.'
      },
      {
        playerId: mbappe.id,
        coachId: coach.id,
        rating: 9,
        strengths: 'Speed, dribbling, finishing',
        weaknesses: 'Positional awareness',
        comments: 'Elite talent, very high ceiling.'
      }
    ]);
    console.log('Sample evaluations inserted.');

    await db.close();
    console.log('Database seeding completed successfully.');

  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
