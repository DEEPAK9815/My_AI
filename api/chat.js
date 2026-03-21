import axios from 'axios';

export default async function handler(req, res) {
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
    const HF_API_KEY = (process.env.HF_API_KEY || "").trim();
    const MODEL_ID = process.env.MODEL_ID || 'Qwen/Qwen2.5-7B-Instruct';
    const API_URL = "https://router.huggingface.co/v1/chat/completions";
    
    if (!HF_API_KEY) {
        return res.status(500).json({ 
            error: "Neural path blocked.", 
            details: "HF_API_KEY is missing on Vercel. Please set it in the Vercel Dashboard Environment Variables." 
        });
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
        console.error('API Error:', error.message);
        res.status(500).json({ 
            error: "Failed to fetch response.",
            details: error.response?.data?.error?.message || error.response?.data?.error || error.message
        });
    }
}
