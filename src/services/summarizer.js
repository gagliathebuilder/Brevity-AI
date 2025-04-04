const OpenAI = require('openai');
const contentExtractor = require('./contentExtractor');

class Summarizer {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateSummary(url) {
    try {
      // Extract content from URL
      const { title, content, sourceType, metadata } = await contentExtractor.extractContent(url);

      // Generate summary using GPT-4
      const prompt = this.generatePrompt(title, content, sourceType, metadata);
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise, informative summaries of content. Focus on the key points and maintain a professional tone."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const summary = completion.choices[0].message.content;

      return {
        title,
        content,
        summary,
        sourceType,
        metadata
      };
    } catch (error) {
      console.error('Summarization error:', error);
      throw new Error('Failed to generate summary');
    }
  }

  generatePrompt(title, content, sourceType, metadata) {
    let context = '';
    
    if (sourceType === 'youtube') {
      context = `This is a YouTube video titled "${title}" from the channel "${metadata.channel}". Duration: ${metadata.duration}.`;
    } else if (sourceType === 'vimeo') {
      context = `This is a Vimeo video titled "${title}". Duration: ${metadata.duration} seconds.`;
    } else if (sourceType === 'spotify') {
      context = `This is a Spotify track titled "${title}" by ${metadata.artists.join(', ')} from the album "${metadata.album}".`;
    } else {
      context = `This is an article titled "${title}".`;
    }

    return `${context}

Content to summarize:
${content}

Please provide a concise summary that captures the main points and key takeaways. The summary should be:
1. Clear and well-structured
2. Focus on the most important information
3. Maintain the original context and meaning
4. Be suitable for sharing with others

Summary:`;
  }
}

module.exports = new Summarizer(); 