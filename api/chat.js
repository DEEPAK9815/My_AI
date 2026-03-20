const axios = require('axios');

module.exports = async (req, res) => {
    // Add CORS headers manually for serverless
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { messages } = req.body;
    const HF_API_KEY = process.env.HF_API_KEY;
    const MODEL_ID = 'mistralai/Mistral-7B-Instruct-v0.2';
    const API_URL = `https://router.huggingface.co/models/${MODEL_ID}`;

    const SYSTEM_PROMPT = "You are a helpful, witty, and intelligent AI assistant. Keep your responses concise yet thorough. Your tone should be friendly and professional.";

    const formatPrompt = (msgs) => {
        let prompt = `<s>[INST] ${SYSTEM_PROMPT}\n\n`;
        msgs.forEach((msg, idx) => {
            if (msg.role === 'user') {
                prompt += (idx === 0) ? `${msg.content} [/INST] ` : `[INST] ${msg.content} [/INST] `;
            } else if (msg.role === 'assistant') {
                prompt += `${msg.content} </s>`;
            }
        });
        return prompt;
    };

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

        const cleanText = response.data[0].generated_text.replace(/\[\/INST\]/g, '').trim();
        res.json({ content: cleanText });

    } catch (error) {
        console.error('API Error:', error.message);
        res.status(500).json({ 
            error: "Failed to fetch response.",
            details: error.response?.data?.error || error.message
        });
    }
};
