const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Trim token to avoid hidden spaces
const HF_API_KEY = (process.env.HF_API_KEY || "").trim();
const API_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL_ID = process.env.MODEL_ID || "meta-llama/Llama-3.1-8B-Instruct";

console.log('--- Dpk AI Final Startup Check ---');
console.log('Model Assigned:', MODEL_ID);
console.log('Token Status:', HF_API_KEY ? `Active (${HF_API_KEY.substring(0, 5)}...)` : 'Missing');
console.log('---------------------------------');

app.post('/chat', async (req, res) => {
    const { messages } = req.body;

    try {
        if (!HF_API_KEY) throw new Error("API Key is missing. Check your .env file.");

        console.log(`📡 Contacting Neural Hub...`);
        
        const response = await axios.post(
            API_URL,
            {
                model: MODEL_ID,
                messages: [
                    { role: "system", content: "You are Dpk AI, a wittty and friendly AI assistant. Be concise." },
                    ...messages
                ],
                max_tokens: 512,
                temperature: 0.7
            },
            {
                headers: { 
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json' 
                },
                timeout: 60000 
            }
        );

        res.json({ content: response.data.choices[0].message.content.trim() });
        
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error('❌ Hub Error:', errorMsg);
        
        res.status(500).json({ 
            error: "Neural path blocked.",
            details: errorMsg
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dpk AI Backend is LIVE on http://localhost:${PORT}`);
});
