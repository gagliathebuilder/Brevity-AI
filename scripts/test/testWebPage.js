require('dotenv').config();
const { summarizeContent } = require('../../src/services/summaryService');

async function testWebPageAnalysis() {
  console.log('Testing web page content summarization...');
  
  // Use a reliable news website
  const webUrl = 'https://www.bbc.com/news';
  
  try {
    console.log(`Attempting to analyze web page: ${webUrl}`);
    const result = await summarizeContent({ url: webUrl });
    
    console.log('\n✅ SUCCESS! Analysis generated:');
    console.log('Title:', result.title);
    console.log('Content Length:', result.content.length);
    console.log('Analysis Length:', result.analysis.length);
    console.log('Email Draft:', !!result.emailDraft);
    console.log('Social Share:', !!result.socialShare);
    
    // Print a sample of the analysis
    console.log('\nAnalysis Sample:');
    console.log(result.analysis.substring(0, 300) + '...');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testWebPageAnalysis(); 