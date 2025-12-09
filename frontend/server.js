const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080; // Azure Web App sets PORT env var

// Serve static files (including index.html)
app.use(express.static(__dirname));

// Catch-all route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
