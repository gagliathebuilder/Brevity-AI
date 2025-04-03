const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const supabase = require('../services/supabase');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware to check authentication
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Generate summary from URL
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // TODO: Implement URL content fetching
    // For now, we'll use a placeholder content
    const content = "This is a placeholder for the actual content that would be fetched from the URL.";

    // Generate summary using GPT-4
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise, well-structured summaries of content. Focus on the main points and key takeaways."
        },
        {
          role: "user",
          content: `Please provide a concise summary of the following content:\n\n${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const summary = completion.choices[0].message.content;

    // Store the summary in Supabase
    const { data, error } = await supabase
      .from('summaries')
      .insert([
        {
          user_id: req.user.id,
          url,
          content,
          summary,
          created_at: new Date().toISOString(),
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: 'Summary generated successfully',
      summary: data[0],
    });
  } catch (error) {
    console.error('Summarization error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get user's summaries
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching summaries:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 