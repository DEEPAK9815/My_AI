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

// A list of models to try if one fails
const MODELS = [
    'mistralai/Mistral-7B-Instruct-v0.3',
    'Qwen/Qwen2.5-7B-Instruct',
    'meta-llama/Llama-3.1-8B-Instruct'
];

app.post('/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
    }

    let lastError = null;

    // Try multiple models to ensure success
    for (const modelId of MODELS) {
        try {
            console.log(`📡 Connecting to Neural Path: ${modelId}...`);
            const response = await axios.post(
                API_URL,
                {
                    model: modelId,
                    messages: [
                        { role: "system", content: "You are a helpful AI assistant named Dpk AI. You are witty, smart, and friendly." },
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
                    timeout: 10000 // 10s timeout
                }
            );

            const content = response.data.choices[0].message.content;
            return res.json({ content: content.trim() });
            
        } catch (error) {
            lastError = error;
            console.error(`❌ Path ${modelId} failed:`, error.response?.data?.error?.message || error.message);
            // If it's a permission error, we should stop and tell the user
            if (error.response?.data?.error?.message?.includes("permissions")) {
                break;
            }
            continue; // Try next model
        }
    }

    // If we get here, all models failed
    res.status(500).json({ 
        error: "Failed to connect to Dpk AI.",
        details: lastError.response?.data?.error?.message || lastError.response?.data?.error || lastError.message
    });
});

app.listen(PORT, () => {
    console.log(`Dpk AI Backend running on http://localhost:${PORT}`);
});
