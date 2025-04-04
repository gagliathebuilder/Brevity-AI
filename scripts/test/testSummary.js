require('dotenv').config();
const { summarizeContent } = require('../../src/services/summaryService');

// Test article content
const articleContent = `
Artificial intelligence (AI) is transforming industries across the board, with advancements occurring at breakneck speed. Recent developments in generative AI have enabled machines to create content that's increasingly difficult to distinguish from human-created work. Companies like OpenAI, Google, and Anthropic are leading the charge with models that can write code, compose essays, create art, and even engage in complex reasoning tasks.

While these technologies offer tremendous benefits, they also raise significant ethical concerns. Issues of bias in AI systems, privacy implications of large-scale data collection, and the potential for job displacement require careful consideration. Some experts warn that without proper regulation, AI development could lead to harmful outcomes, while others argue that overregulation might stifle innovation.

The economic impact of AI is expected to be substantial. According to PwC, AI could contribute up to $15.7 trillion to the global economy by 2030. Industries from healthcare to finance are investing heavily in AI solutions, with 91% of businesses already planning to implement AI strategies. However, the transition will likely be uneven, with some sectors experiencing more disruption than others.

Education systems worldwide are adapting to prepare students for an AI-integrated future. Schools are increasingly incorporating AI literacy into their curricula, teaching students not only how to use AI tools but also to understand their limitations and ethical implications. Universities are expanding their AI and machine learning programs to meet the growing demand for AI specialists.

As AI becomes more integrated into our daily lives, questions about governance and regulation become increasingly important. The European Union has taken a lead with the AI Act, while the United States has opted for a more sectoral approach. Finding the right balance between innovation and protection remains a challenge for policymakers globally.
`;

// Test research content
const researchContent = `
Abstract: This study evaluates the efficacy of mindfulness-based interventions (MBIs) on stress reduction and cognitive performance in high-pressure workplace environments. Through a randomized controlled trial involving 240 participants across diverse industries, we measured changes in cortisol levels, self-reported stress, and performance on cognitive tasks before and after an 8-week intervention period.

Introduction: Workplace stress continues to be a significant public health concern, with the World Health Organization estimating the global cost of work-related stress at approximately $1 trillion per year in lost productivity. Recent interest in mindfulness practices as a potential intervention has grown, but methodologically rigorous studies in professional settings remain limited.

Methodology: Participants were randomly assigned to either an 8-week mindfulness training program (n=120) or an active control group (n=120) receiving general wellness information. The mindfulness group participated in weekly 90-minute sessions and were asked to practice for 20 minutes daily. Assessments were conducted at baseline, 4 weeks, 8 weeks, and 3 months post-intervention. Measures included salivary cortisol samples, the Perceived Stress Scale (PSS), the Maslach Burnout Inventory (MBI), and a battery of cognitive performance tasks.

Results: Compared to the control group, participants in the mindfulness group showed a significant reduction in cortisol levels (p<0.01) and self-reported stress (p<0.001) at the 8-week and 3-month follow-up points. Additionally, the mindfulness group demonstrated improved performance on tasks measuring attention (p<0.01) and working memory (p<0.05). Notably, participants who reported practicing mindfulness for at least 15 minutes per day (71% of the intervention group) showed stronger effects across all outcome measures.

Discussion: These findings suggest that structured mindfulness practice can effectively reduce physiological and psychological markers of stress while enhancing cognitive function in high-pressure work environments. The dose-dependent relationship between practice time and outcomes underscores the importance of regular engagement with mindfulness techniques.

Conclusion: This study provides robust evidence for the efficacy of mindfulness-based interventions in workplace settings. Organizations seeking to improve employee wellbeing and performance may benefit from implementing structured mindfulness programs. Future research should explore the long-term sustainability of these effects and potential mechanisms of action.
`;

// Test with URLs
const youtubeURL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
const newsURL = "https://www.bbc.com/news/technology-64542408";

async function runTest() {
  console.log('Testing refined summary generation with various content types...');
  
  try {
    // Test with article content
    console.log('\n===== TESTING ARTICLE CONTENT =====\n');
    const articleSummary = await summarizeContent({
      content: articleContent,
      title: 'AI Advancement and Impact Test'
    });
    
    console.log('\n--- ARTICLE SUMMARY RESULT ---\n');
    console.log(articleSummary.title);
    console.log('Content Type:', articleSummary.contentType);
    console.log('\n' + articleSummary.summary);
    console.log('\n--- END ARTICLE SUMMARY ---\n');
    
    // Test with research content
    console.log('\n===== TESTING RESEARCH CONTENT =====\n');
    const researchSummary = await summarizeContent({
      content: researchContent,
      title: 'Mindfulness Efficacy in Workplace Environments'
    });
    
    console.log('\n--- RESEARCH SUMMARY RESULT ---\n');
    console.log(researchSummary.title);
    console.log('Content Type:', researchSummary.contentType);
    console.log('\n' + researchSummary.summary);
    console.log('\n--- END RESEARCH SUMMARY ---\n');
    
    // Note: We're not actually testing with URLs to avoid making external API calls in this test
    // This would require proper network connectivity and API keys
    /* 
    console.log('\n===== TESTING WITH YOUTUBE URL =====\n');
    const ytSummary = await summarizeContent({
      url: youtubeURL
    });
    console.log('\n--- YOUTUBE SUMMARY RESULT ---\n');
    console.log(ytSummary.title);
    console.log('Content Type:', ytSummary.contentType);
    console.log('\n' + ytSummary.summary);
    */
    
    console.log('\nAll summary tests completed successfully!');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

runTest(); 