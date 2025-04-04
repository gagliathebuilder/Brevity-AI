require('dotenv').config();
const { summarizeContent } = require('../../src/services/summaryService');

// Test article content about AI
const aiArticleContent = `
Artificial intelligence (AI) is transforming industries across the board, with advancements occurring at breakneck speed. Recent developments in generative AI have enabled machines to create content that's increasingly difficult to distinguish from human-created work. Companies like OpenAI, Google, and Anthropic are leading the charge with models that can write code, compose essays, create art, and even engage in complex reasoning tasks.

While these technologies offer tremendous benefits, they also raise significant ethical concerns. Issues of bias in AI systems, privacy implications of large-scale data collection, and the potential for job displacement require careful consideration. Some experts warn that without proper regulation, AI development could lead to harmful outcomes, while others argue that overregulation might stifle innovation.

The economic impact of AI is expected to be substantial. According to PwC, AI could contribute up to $15.7 trillion to the global economy by 2030. Industries from healthcare to finance are investing heavily in AI solutions, with 91% of businesses already planning to implement AI strategies. However, the transition will likely be uneven, with some sectors experiencing more disruption than others.

Education systems worldwide are adapting to prepare students for an AI-integrated future. Schools are increasingly incorporating AI literacy into their curricula, teaching students not only how to use AI tools but also to understand their limitations and ethical implications. Universities are expanding their AI and machine learning programs to meet the growing demand for AI specialists.

As AI becomes more integrated into our daily lives, questions about governance and regulation become increasingly important. The European Union has taken a lead with the AI Act, while the United States has opted for a more sectoral approach. Finding the right balance between innovation and protection remains a challenge for policymakers globally.
`;

// Test video content about OpenAI voice models
const openAIVoiceContent = `
OpenAI just announced significant updates to its audio model lineup, emphasizing the transition from text-based to voice-based AI interfaces. They highlighted voice as a natural and underutilized interface for future AI applications. The announcement included the release of two state-of-the-art speech-to-text models that surpass the performance of the previous model, Whisper, across all tested languages, and a new text-to-speech model that allows developers to control not just the content but the delivery style of spoken output.

The introduction of speech-to-speech models marks a sophisticated approach, offering a more seamless interaction by directly converting spoken input into spoken output without the intermediary step of text transcription. These speech-to-speech models are designed to preserve the nuances of human speech, such as tone and emphasis, which are often lost in the traditional speech-to-text-to-speech process. This is contrasted with the more modular but latency-prone approach of converting speech to text, processing it, and then converting it back to speech.

OpenAI's update includes a comprehensive suite of tools and capabilities designed to simplify the development of voice agents, including new speech-to-text models and an agents SDK for easy integration of voice capabilities into existing text-based agents. The new GPT-4-based speech-to-text models significantly outperform previous iterations, offering reduced word error rates across multiple languages. The agents SDK simplifies the transition of text-based agents to voice agents, enabling developers to leverage their existing work in new voice applications.

Despite the progress in creating more human-like voice agents, challenges remain in fully capturing and replicating the emotional and tonal nuances of human speech in AI-generated voice interactions. While new models and tools represent a leap forward, the complexity of human speech, including the conveyance of emotion and intent through tone and cadence, remains a difficult challenge to address fully with current technology. Ongoing research and development efforts are necessary to bridge this gap, suggesting that future updates may focus more on understanding and generating speech that captures the full range of human expressiveness.
`;

async function runTest() {
  console.log('Testing new summary format with Key Point and Why It Matters structure...');
  
  try {
    // Test with AI article content
    console.log('\n===== TESTING AI ARTICLE CONTENT =====\n');
    const aiSummary = await summarizeContent({
      content: aiArticleContent,
      title: 'AI Advancement and Impact Test'
    });
    
    console.log('\n--- AI ARTICLE SUMMARY RESULT ---\n');
    console.log(aiSummary.title);
    console.log('Content Type:', aiSummary.contentType);
    console.log('\n' + aiSummary.summary);
    console.log('\n--- END AI ARTICLE SUMMARY ---\n');
    
    // Test with OpenAI voice content
    console.log('\n===== TESTING OPENAI VOICE CONTENT =====\n');
    const voiceSummary = await summarizeContent({
      content: openAIVoiceContent,
      title: 'OpenAI Voice Models Update'
    });
    
    console.log('\n--- OPENAI VOICE SUMMARY RESULT ---\n');
    console.log(voiceSummary.title);
    console.log('Content Type:', voiceSummary.contentType);
    console.log('\n' + voiceSummary.summary);
    console.log('\n--- END OPENAI VOICE SUMMARY ---\n');
    
    console.log('\nAll summary tests completed successfully!');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

runTest(); 