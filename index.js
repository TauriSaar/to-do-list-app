// Require necessary modules
const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const yamlJs = require('yamljs');
const swaggerDocument = yamlJs.load('./swagger.yaml');

// Import bcrypt for password encryption
const bcrypt = require('bcrypt');
const saltRounds = 10; // Number of salt rounds to use for encryption

require('dotenv').config();

const port = process.env.PORT || 3000;

// Serve static files
app.use(express.static('public'));

// Use the Swagger UI to display API documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Middleware to parse JSON
app.use(express.json());


// Create a user array to store users
const users = [];

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

// Start the server and connect to the database
app.listen(port, () => {
    console.log(`App is running at http://localhost:${port} and docs are at http://localhost:${port}/docs`);
});
