const request = require('supertest');
const bcrypt = require('bcryptjs');
const { db, User, Player } = require('../database/setup');
const app = require('../server');

let coachToken, playerToken;

// Setup & teardown
beforeAll(async () => {
  await db.sync({ force: true });

  const coach = await User.create({
    name: 'Test Coach',
    email: 'coach@test.com',
    password: await bcrypt.hash('password', 10),
    role: 'coach'
  });

  const player = await User.create({
    name: 'Test Player',
    email: 'player@test.com',
    password: await bcrypt.hash('password', 10),
    role: 'player'
  });

  // Login users to get tokens
  const coachRes = await request(app)
    .post('/auth/login')
    .send({ email: 'coach@test.com', password: 'password' });
  coachToken = coachRes.body.token;

  const playerRes = await request(app)
    .post('/auth/login')
    .send({ email: 'player@test.com', password: 'password' });
  playerToken = playerRes.body.token;
});

afterAll(async () => {
  await db.close();
});

// TEST SUITE
describe('Player Performance API', () => {
  
  // Test GET /health
  test('should return API health status', async () => {
    const response = await request(app).get('/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  // Authentication
  test('should create new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: 'New User', email: 'newuser@test.com', password: 'password123' });

    expect(response.statusCode).toBe(201);
    expect(response.body.user.email).toBe('newuser@test.com');
  });

  test('should fail for duplicate email', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: 'New User', email: 'newuser@test.com', password: 'password123' });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  test('should fail for wrong credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'newuser@test.com', password: 'abcdefg' });

    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBeDefined();
  });

  test('should log user out', async () => {
    const response = await request(app).post('/api/logout');
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBeDefined();
  });


  // PLAYERS
  // GET /api/players
   test('should require auth', async () => {
    const response = await request(app).get('/api/players');
    expect(response.statusCode).toBe(401);
  });

  test('should return an array of players', async () => {
    const response = await request(app).get('/api/players').set('Authorization', `Bearer ${coachToken}`);;

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });


  // POST /api/players 
  test('should fail to create player without name', async () => {
    const response = await request(app)
      .post('/api/players').set('Authorization', `Bearer ${coachToken}`)
      .send({
        age: 20,
        position: 'CF'
      });
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });

    test('should succeed with valid data', async () => {
    const newPlayer = {
      name: 'Lionel Messi',
      age: 36,
      position: 'RW',
      team: 'Inter Miami',
      userId: 2
    };
    const response = await request(app)
      .post('/api/players')
      .set('Authorization', `Bearer ${coachToken}`)
      .send(newPlayer);

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe(newPlayer.name);
  });


  // GET /api/players/:id
  test('should return 404 for nonexistent player', async () => {
    const response = await request(app).get('/api/players/9999').set('Authorization', `Bearer ${coachToken}`);;
    
    expect(response.statusCode).toBe(404);
  });


  // PUT /api/players/:id
   test('should update player', async () => {
    const player = await Player.create({
      name: 'Michael Ho',
      age: 21,
      position: 'RW',
      team: 'Auckland United',
      userId: 2
    });

    const response = await request(app)
      .put(`/api/players/${player.id}`)
      .set('Authorization', `Bearer ${coachToken}`)
      .send({ 
        name: 'Javi Gutierrez', 
        age: 21, 
        position: 'CAM', 
        team: 'Updated FC', 
        userId: 2 });

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Javi Gutierrez');
    expect(response.body.position).toBe('CAM');
  });

  // DELETE /api/players/:id
  test('should successfully delete a player', async () => {
    const player = await Player.create({
      name: 'To Delete',
      age: 25,
      position: 'DF',
      team: 'Test FC',
      userId: 1
    });

    const response = await request(app)
      .delete(`/api/players/${player.id}`).set('Authorization', `Bearer ${coachToken}`);;

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Player deleted successfully');
  });

   test('Player cannot access coach-only endpoint', async () => {
    const response = await request(app)
      .post('/api/training-sessions')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ playerId: 1, date: '2025-12-01', duration: 60 });

    expect(response.statusCode).toBe(403);
  });

  test('Coach can access coach-only endpoint', async () => {
    const response = await request(app)
      .post('/api/training-sessions')
      .set('Authorization', `Bearer ${coachToken}`)
      .send({ playerId: 1, date: '2025-12-01', duration: 60 });

    expect(response.statusCode).toBe(201);
  });

});
