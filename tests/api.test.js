const request = require('supertest');
const { db, User, Player } = require('../database/setup');

const app = require('../server');

// Setup & teardown
beforeAll(async () => {
  await db.sync({ force: true });

  await User.create({
    id: 1,
    name: 'Test Coach',
    email: 'coach@test.com',
    password: 'password',
    role: 'coach'
  });
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

  // PLAYERS
  // GET /api/players
  test('should return an array of players', async () => {
    const response = await request(app).get('/api/players');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });


  // POST /api/players 
  test('should fail to create player without name', async () => {
    const response = await request(app)
      .post('/api/players')
      .send({
        age: 20,
        position: 'CF'
      });
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });


  // GET /api/players/:id
  test('should return 404 for nonexistent player', async () => {
    const response = await request(app).get('/api/players/9999');
    
    expect(response.statusCode).toBe(404);
  });


  // POST /api/players
  test('should successfully create a player', async () => {
    const newPlayer = {
      name: 'Lionel Messi',
      age: 36,
      position: 'RW',
      team: 'Inter Miami',
      userId: 1
    };

    const response = await request(app)
      .post('/api/players')
      .send(newPlayer);

    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe(newPlayer.name);
    expect(response.body.position).toBe(newPlayer.position);
  });


  // PUT /api/players/:id
  test('should successfully update a player', async () => {
    const player = await Player.create({
      name: 'Old Name',
      age: 22,
      position: 'MF',
      team: 'FC Test',
      userId: 1
    });

    const response = await request(app)
      .put(`/api/players/${player.id}`)
      .send({
        name: 'Updated Name',
        age: 23,
        position: 'CM',
        team: 'Updated FC',
        userId: 1
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Updated Name');
    expect(response.body.position).toBe('CM');
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
      .delete(`/api/players/${player.id}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Player deleted successfully');
  });

});
