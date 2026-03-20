const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;
const MODEL_ID = process.env.MODEL_ID || 'mistralai/Mistral-7B-Instruct-v0.3';
const API_URL = "https://router.huggingface.co/v1/chat/completions";

app.post('/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
    }

    try {
        const response = await axios.post(
            API_URL,
            {
                model: MODEL_ID,
                messages: [
                    { role: "system", content: "You are a helpful, witty, and intelligent AI assistant. Keep your responses concise yet thorough. Your tone should be friendly and professional." },
                    ...messages
                ],
                max_tokens: 512,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const content = response.data.choices[0].message.content;
        res.json({ content: content.trim() });
        
    } catch (error) {
        console.error('Hugging Face Router Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: "Failed to fetch response from AI model.",
            details: error.response?.data?.error?.message || error.response?.data?.error || error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
