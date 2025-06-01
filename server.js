const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { handler } = require('./api/submit-form');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// API endpoint for form submissions
app.post('/api/submit-form', async (req, res) => {
    try {
        // Format the request to match what the handler expects
        const event = {
            body: JSON.stringify(req.body)
        };

        // Call the handler function
        const result = await handler(event);

        // Send response
        res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (error) {
        console.error('Error handling form submission:', error);
        res.status(500).json({
            message: 'Error processing form submission',
            error: error.message
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});
