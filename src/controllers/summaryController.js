const Summary = require('../models/Summary');
const summarizer = require('../services/summarizer');
const authMiddleware = require('../middleware/authMiddleware');

class SummaryController {
  async createSummary(req, res) {
    try {
      const { url } = req.body;
      const userId = req.user.id;

      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      // Generate summary
      const summaryData = await summarizer.generateSummary(url);

      // Save to database
      const summary = await Summary.create({
        userId,
        url,
        content: summaryData.content,
        summary: summaryData.summary,
        title: summaryData.title,
        sourceType: summaryData.sourceType
      });

      res.status(201).json(summary);
    } catch (error) {
      console.error('Create summary error:', error);
      res.status(500).json({ error: 'Failed to create summary' });
    }
  }

  async getSummaries(req, res) {
    try {
      const userId = req.user.id;
      const summaries = await Summary.getByUserId(userId);
      res.json(summaries);
    } catch (error) {
      console.error('Get summaries error:', error);
      res.status(500).json({ error: 'Failed to get summaries' });
    }
  }

  async getSummary(req, res) {
    try {
      const { id } = req.params;
      const summary = await Summary.getById(id);

      if (!summary) {
        return res.status(404).json({ error: 'Summary not found' });
      }

      res.json(summary);
    } catch (error) {
      console.error('Get summary error:', error);
      res.status(500).json({ error: 'Failed to get summary' });
    }
  }

  async updateSummary(req, res) {
    try {
      const { id } = req.params;
      const { summary } = req.body;

      if (!summary) {
        return res.status(400).json({ error: 'Summary text is required' });
      }

      const updatedSummary = await Summary.update(id, { summary });
      res.json(updatedSummary);
    } catch (error) {
      console.error('Update summary error:', error);
      res.status(500).json({ error: 'Failed to update summary' });
    }
  }

  async deleteSummary(req, res) {
    try {
      const { id } = req.params;
      await Summary.delete(id);
      res.json({ message: 'Summary deleted successfully' });
    } catch (error) {
      console.error('Delete summary error:', error);
      res.status(500).json({ error: 'Failed to delete summary' });
    }
  }
}

module.exports = new SummaryController(); 