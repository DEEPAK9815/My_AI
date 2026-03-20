const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const HF_API_KEY = process.env.HF_API_KEY;
const API_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL_ID = "Qwen/Qwen2.5-7B-Instruct";

app.post('/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
    }

    try {
        console.log(`📡 Connecting to Dpk AI Hub (${MODEL_ID})...`);
        const response = await axios.post(
            API_URL,
            {
                model: MODEL_ID,
                messages: [
                    { role: "system", content: "You are Dpk AI, a wittty and friendly AI assistant. Be concise and professional." },
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
                timeout: 60000 // 60s
            }
        );

        const content = response.data.choices[0].message.content;
        res.json({ content: content.trim() });
        
    } catch (error) {
        const detail = error.response?.data?.error?.message || error.message;
        console.error('❌ AI Hub Connection Error:', detail);
        
        // Friendly error for the user
        res.status(500).json({ 
            error: "Neural path blocked.",
            details: detail.includes("permissions") 
                ? "Your API Token lacks 'Inference' permissions. Please check your Hub settings." 
                : detail
        });
    }
});

app.listen(PORT, () => {
    console.log(`Dpk AI Backend running on http://localhost:${PORT}`);
});
