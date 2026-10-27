const express = require('express');
const cors = require('cors');

const {Pool} = require('pg');

const app = express();

//middleWare
app.use(cors());
app.use(express.json());

//Connect to local PostgreSQL Database
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'my_database',
    password: 'Godeater1403:)',
    port: 5432,
});

//Create API endpoint to fetch my projects
app.get('/api/projects', async (req, res) => {
    try {
        const allProjects = await pool.query('SELECT * FROM project ORDER BY id ASC');
        res.json(allProjects.rows);
    }
    catch (error){
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

//Start SERVER
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});