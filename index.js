const express = require('express');
const fileUpload = require('express-fileupload');
const pdf = require('pdf-parse');
const app = express();
const port = 3000;
const axios = require('axios');

const API_URL = "https://api-inference.huggingface.co/models/bigscience/bloom";

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

    pdf(pdfFile.data).then(async function(data) {
        if (!data.text) {
            return res.status(400).send('No text could be extracted from the uploaded PDF.');
        }
        try {
            const questionsAndAnswers = await generateQuestionsAndAnswers(data.text);
            if (questionsAndAnswers) {
                // Convert object to a formatted string before sending
                res.send(`<pre>${JSON.stringify(questionsAndAnswers, null, 2)}</pre>`);
            } else {
                res.status(500).send('Failed to generate Q&A.');
            }
        } catch (error) {
            console.error('Error generating Q&A:', error);
            res.status(500).send('Error calling the Q&A generation API.');
        }
    }).catch(error => {
        console.error('Error processing PDF:', error);
        res.status(500).send('Error extracting text from PDF.');
    });
});

/*
//OLD CODE
app.post('/upload-pdf', (req, res) => {
    if (!req.files || !req.files.pdfFile) {
        return res.status(400).send('No PDF file uploaded.');
    }

    const pdfFile = req.files.pdfFile;

    pdf(pdfFile.data).then(async function(data) {
        // Assuming generateQuestionsAndAnswers is your function to call the API
        const questionsAndAnswers = await generateQuestionsAndAnswers(data.text);
        if (questionsAndAnswers) {
            res.send(`<pre>${questionsAndAnswers}</pre>`);
        } else {
            res.status(500).send('Failed to generate Q&A.');
        }
    }).catch(error => {
        console.error('Error processing PDF:', error);
        res.status(500).send('Error extracting text from PDF.');
    });
});
*/

/*
//OLD CODE
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
*/

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Click here to access: \x1b[4m\x1b[36mhttp://localhost:${port}\x1b[0m`);
});


async function generateQuestionsAndAnswers(text) {
    const prompt = `Given the text: "${text}", identify and answer potential questions found within the text.`;
    const token = process.env.HUGGINGFACE_API_KEY; //IDK WHAT IM DOING HERE
    try {
        const response = await axios.post(API_URL, {
            inputs: prompt,
            options: {
                wait_for_model: true,
                use_gpu: false
            }
        }, {
            headers: {
                'Authorization': `Bearer {PLACE MY API KEY HERE}`, //REPALCE WITH YOUR API KEY
                'Content-Type': 'application/json'
            }
        });

        // Check if the response is correctly formatted and contains the expected data
        if (response.data && response.data.length > 0 && response.data[0].generated_text) {
            return response.data[0].generated_text;  // Return the generated text from the first object
        } else {
            console.log("Unexpected API response format:", JSON.stringify(response.data, null, 2));
            return null;  // Return null if the format is not as expected
        }
    } catch (error) {
        console.error('Error calling the Hugging Face API:', error);
        return null;
    }
}

/*
//OLD CODE
async function generateQuestionsAndAnswers(text) {
    try {
        const response = await axios.post(API_URL, {
            inputs: text,
            options: {
                wait_for_model: true,
                use_gpu: false
            }
        }, {
            headers: {
                'Authorization': `Bearer `
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error calling the Hugging Face API:', error);
        return null;
    }
}
*/