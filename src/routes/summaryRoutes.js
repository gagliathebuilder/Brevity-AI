const express = require('express');
const router = express.Router();
const { summarizeContent } = require('../services/summaryService');

// Create a new summary
router.post('/', async (req, res) => {
  console.log('Received summary request:', {
    hasUrl: !!req.body.url,
    hasContent: !!req.body.content,
    hasTitle: !!req.body.title
  });

  try {
    const { url, content, title } = req.body;

    if (!content && !url) {
      console.log('Request validation failed: No content or URL provided');
      return res.status(400).json({ 
        error: 'Either content or URL is required',
        received: {
          hasUrl: !!url,
          hasContent: !!content
        }
      });
    }

    console.log('Processing summary request...');
    const summary = await summarizeContent({ url, content, title });
    
    console.log('Summary created successfully:', {
      id: summary.id,
      title: summary.title
    });

    res.status(201).json(summary);
  } catch (error) {
    console.error('Error in summary creation:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Check if it's a known error type
    if (error.message.includes('No content provided')) {
      return res.status(400).json({ error: error.message });
    }

    if (error.message.includes('OpenAI')) {
      return res.status(503).json({ error: 'Summary service temporarily unavailable' });
    }

    res.status(500).json({ 
      error: 'Failed to create summary',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all summaries
router.get('/', async (req, res) => {
  try {
    // For MVP, we'll just return a success message
    res.json({ message: 'Summaries endpoint working' });
  } catch (error) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

// Get a single summary
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // For MVP, we'll just return a success message
    res.json({ message: `Summary ${id} endpoint working` });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

module.exports = router; 