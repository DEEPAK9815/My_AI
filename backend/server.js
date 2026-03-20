const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Hugging Face Config
const HF_API_KEY = process.env.HF_API_KEY;
const MODEL_ID = process.env.MODEL_ID;
const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

// System Prompt for personality
const SYSTEM_PROMPT = "You are a helpful, witty, and intelligent AI assistant. Keep your responses concise yet thorough. Your tone should be friendly and professional.";

/**
 * Format message history for Mistral instruct format:
 * [INST] system_prompt \n user_message [/INST] assistant_response [INST] user_message [/INST]
 */
const formatPrompt = (messages) => {
    let prompt = `<s>[INST] ${SYSTEM_PROMPT}\n\n`;
    
    messages.forEach((msg, idx) => {
        if (msg.role === 'user') {
            if (idx === 0) {
                prompt += `${msg.content} [/INST] `;
            } else {
                prompt += `[INST] ${msg.content} [/INST] `;
            }
        } else if (msg.role === 'assistant') {
            prompt += `${msg.content} </s>`;
        }
    });

    return prompt;
};

// POST /chat endpoint
app.post('/chat', async (req, res) => {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
    }

    try {
        const fullPrompt = formatPrompt(messages);
        
        const response = await axios.post(
            API_URL,
            {
                inputs: fullPrompt,
                parameters: {
                    max_new_tokens: 512,
                    temperature: 0.7,
                    top_p: 0.9,
                    do_sample: true,
                    return_full_text: false
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${HF_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Hugging Face returns an array of objects
        const generatedText = response.data[0].generated_text;
        
        // Clean up any residual markers if the model leaks them
        const cleanText = generatedText.replace(/\[\/INST\]/g, '').trim();

        res.json({ content: cleanText });
        
    } catch (error) {
        console.error('Hugging Face API Error:', error.response?.data || error.message);
        res.status(500).json({ 
            error: "Failed to fetch response from AI model.",
            details: error.response?.data?.error || error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
