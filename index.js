const express = require('express');
const fileUpload = require('express-fileupload');
const pdf = require('pdf-parse');
const app = express();
const port = 3000;

// Middleware to handle file uploads
app.use(fileUpload());

// Home route to test server is working
app.get('/', (req, res) => {
    res.send('Hello from my PDF processing server!');
});

// Endpoint to upload and extract text from a PDF
app.post('/upload-pdf', (req, res) => {
    if (!req.files || !req.files.pdfFile) {
        return res.status(400).send('No PDF file uploaded.');
    }

    const pdfFile = req.files.pdfFile;

    pdf(pdfFile.data).then(function(data) {
        res.send(data.text);  // Send extracted text back to client
    }).catch(error => {
        console.error('Error processing PDF:', error);
        res.status(500).send('Failed to extract text from PDF.');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Click here to access: \x1b[4m\x1b[36mhttp://localhost:${port}\x1b[0m`);
});
