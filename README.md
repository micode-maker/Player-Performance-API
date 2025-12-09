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
6. Enviroment Variables (in .env):
    ```bash
    PORT=3000
    JWT_SECRET=your_secret_key
    NODE_ENV=development
    DB_NAME=player_performance.db
    ```

## Authentication

All endpoints (except /auth/register, /auth/login, and /health) require a JWT token.

### Register 

POST /auth/register

#### Body:
    ```json 
    {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "password123",
        "role": "player"
    }
    ```

#### Response:
    ```json 
    {
        "message": "User registered successfully",
        "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
        }
    }
    ```

### Login 

POST /auth/login

#### Body:
    ```json 
    {
        "email": "john@example.com",
        "password": "password123"
    }
    ```

#### Response:
    ```json 
    {
        "message": "Login successful",
        "token": "JWT_TOKEN",
        "user": {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "role": "player"
        }
    }
    ```

### For protected Endpoints:
    ```bash
    Authorization: Bearer JWT_TOKEN
    ```

### Logout 

POST /auth/logout

#### Response:
    ```json 
    {
        "message": "Logged out successfully"
    }
    ```

## API Endpoints

### Players

- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get players by ID
- `POST /api/players` - Create player
- `PUT /api/players/:id` - Update player (Coach only)
- `DELETE /api/players/:id` - Delete player

### Performance Stats

- `GET /api/stats/:playerId` - Get stats for player
- `POST /api/stats` - Create stat record

### Training Sessions

- `GET /api/training-sessions/:playerId` -Get training sessions for player
- `POST /api/training-sessions` - Create training session (Coach only)


### Coach Evaluations

- `GET /api/evalutions/:playerId` - Get evaluations for player
- `POST /api/evaluations` - Create evaluation (Coach only)

## Error Handling

- 400 Bad Request: Missing or invalid fields
- 401 Unauthorized: No token or invalid token
- 403 Forbidden: Role cannot access endpoint
- 404 Not Found: Resource not found
- 500 Internal Server Error: Unexpected server error

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
