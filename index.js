// Require necessary modules
const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const yamlJs = require('yamljs');
const swaggerDocument = yamlJs.load('./swagger.yaml');
const {v4: uuidv4} = require('uuid');

// Import bcrypt for password encryption
const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds to use for encryption

require('dotenv').config();

const port = process.env.PORT || 3000;

let sessions = [{id: '1234', userId: '1234'}];
let items = [{id: '1234', userId: '1234', text: 'lorem ipsum'}];

// Serve static files
app.use(express.static('public'));

// Use the Swagger UI to display API documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware to parse JSON
app.use(express.json());


// Create a user array to store users
const users = [{id: '1234', email: '1234'}];

// General error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    const status = err.statusCode || 500;
    res.status(status).send(err.message);
});

// Endpoint to create a new user with email and password
app.post('/users', (req, res) => {
    const {email, password} = req.body;
    const user = {email, password};

    // validate the email and password
    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    } else if (users.find(u => u.email === email)) {
        return res.status(409).send('Email already exists');
    }

    // Hash the password with bcrypt before storing in the database
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error creating user');
        } else {
            user.password = hash;
            users.push(user);
            return res.status(201).send('User created');
        }
    });
});

// Endpoint to log in a user
app.post('/sessions', (req, res) => {
    const {email, password} = req.body;

    // Validate the email and password
    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    // Find the user in the database
    const user = users.find(u => u.email === email);

    // If the user is not found, return an error
    if (!user) {
        return res.status(401).send('Invalid email or password');
    }

    // Compare the password with the hash in the database
    bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error signing in');
        } else if (result) {
            // Create a session for the user
            const session = {id: uuidv4(), userId: user.id};

            // Store the session in the database
            sessions.push(session);

            // Send the session id back to the client
            return res.status(201).send({sessionId: session.id});
        } else {
            return res.status(401).send('Invalid email or password');
        }
    });
});

function authenticateRequest(req, res, next) {
    // Validate the authorization header is present
    if (!req.headers.authorization) {
        return res.status(401).send('Authorization header is required');
    }

    // Validate the authorization header is in the correct format
    const authHeader = req.headers.authorization.split(' ');
    if (authHeader.length !== 2 || authHeader[0] !== 'Bearer') {
        return res.status(401).send('Authorization header is invalid');
    }

    // Validate the session id is valid
    const sessionId = authHeader[1];
    const session = sessions.find(s => s.id === sessionId);
    if (!session) {
        return res.status(401).send('Session not found');
    }

    // Validate the user id is valid
    const user = users.find(u => u.id === session.userId);
    if (!user) {
        return res.status(404).send('User not found');
    }

    // Attach the user to the request object
    req.user = user;

    // Attach the session to the request object
    req.session = session;

    // Call the next middleware
    next();
}

// Endpoint to log out a user
app.delete('/sessions', authenticateRequest, (req, res) => {
    // Remove the session from the database
    sessions = sessions.filter(s => s.id !== req.session.id);

    // Return a success message
    res.status(204).end();
});

// Endpoint to get the current users items
app.get('/items', authenticateRequest, (req, res) => {
    res.status(200).send(items.filter(i => i.userId === req.user.id));
});

// Start the server and connect to the database
app.listen(port, () => {
    console.log(`App is running at http://localhost:${port} and docs are at http://localhost:${port}/docs`);
});
