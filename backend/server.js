require("dotenv").config();
const express = require('express');
const cors = require('cors');
const repoRoutes = require('./routes/repoRoutes');
const app = express();
const PORT =  5000;

app.use(cors());//allow frontend requests from different origins (like localhost:3000 for React) to access the backend API without CORS issues
app.use(express.json());// Middleware to parse JSON bodies from incoming requests

app.use('/api/repo', repoRoutes);//all routes in repoRoutes will be prefixed with /api
app.get("/", (req, res) => {
    res.send("Welcome to the AI Codebase Analyzer API");
});

app.listen(PORT, () => {
    console.log(`Backend is running on http://localhost:${PORT}`);
});