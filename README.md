# Player-Performace-API

A REST API for managing athlete profiles, match performance data, training sessions, and coach evaluations.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the database:
    ```bash
    npm run setup
    ```

3. Seed with sample data:
    ```bash
    npm run seed
    ```

4. Start the server:
    ```bash
    npm start
    ```

5. The API will run at:
    ```bash
    http://localhost:3000
    ```


## API Endpoints

### Players

- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get players by ID
- `POST /api/players` - Create player
- `PUT /api/players/:id` - Update player
- `DELETE /api/players/:id` - Delete player

### Performance Stats

- `GET /api/stats/:playerId` - Get stats for player
- `POST /api/stats` - Create stat record

### Training Sessions

- `GET /api/training-sessions/:playerId` -Get training sessions for player
- `POST /api/training-sessions` - Create training session


### Coach Evaluations

- `GET /api/evalutions/:playerId` - Get evaluations for player
- `POST /api/evaluations` - Create evaluation

## Project Structure

```plaintext
player-performance-api/
├── database/
│   ├── setup.js    # Database setup and models
│   └── seed.js     # Sample data
├── tests/
│   └── api.test.js # Automated tests
├── server.js       # Main server file
├── package.json    # Dependencies
├── .env            # Environment variables
└── README.md       # This file
```
