const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;
const API_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL_ID = "Qwen/Qwen2.5-7B-Instruct";

// Log startup status
console.log('--- Dpk AI Startup Diagnostic ---');
console.log('Model:', MODEL_ID);
console.log('Token Loaded:', HF_API_KEY ? `Yes (${HF_API_KEY.substring(0, 5)}...)` : 'No');
console.log('---------------------------------');

app.post('/chat', async (req, res) => {
    const { messages } = req.body;

    try {
        if (!HF_API_KEY) throw new Error("HF_API_KEY is missing from .env");

        console.log(`📡 Sending to Hub: "${messages[messages.length-1].content.substring(0, 20)}..."`);
        
        const response = await axios.post(
            API_URL,
            {
                model: MODEL_ID,
                messages: [
                    { role: "system", content: "You are Dpk AI, a helpful and witty assistant." },
                    ...messages
                ],
                max_tokens: 512,
                temperature: 0.7
            },
            {
                headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 60000 
            }
        );

        res.json({ content: response.data.choices[0].message.content.trim() });
        
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error('❌ Diagnostic Error:', errorMsg);
        
        res.status(500).json({ 
            error: "Neural Connection Failed",
            details: errorMsg
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dpk AI Backend running on http://localhost:${PORT}`);
});
