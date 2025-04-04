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

    // Make sure we provide the summary property that the frontend expects
    const response = {
      ...summary,
      summary: summary.analysis // Add summary property for frontend compatibility
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in summary creation:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    // Check if it's a known error type
    if (error.message.includes('No content provided')) {
      return res.status(400).json({ 
        error: 'No content could be extracted', 
        message: error.message 
      });
    }

    if (error.message.includes('Failed to retrieve content')) {
      return res.status(422).json({ 
        error: 'Content retrieval failed', 
        message: error.message 
      });
    }

    if (error.message.includes('OpenAI') || error.message.includes('AI analysis failed')) {
      return res.status(503).json({ 
        error: 'Analysis service temporarily unavailable',
        message: error.message
      });
    }
    
    // If the error has a response property, it might be an API error
    if (error.response) {
      const statusCode = error.response.status || 500;
      return res.status(statusCode).json({ 
        error: `External API error (${statusCode})`,
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.response.data : undefined
      });
    }

    res.status(500).json({ 
      error: 'Failed to create summary',
      message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
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