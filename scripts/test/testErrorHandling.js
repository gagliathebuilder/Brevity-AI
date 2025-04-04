require('dotenv').config();
const { summarizeContent } = require('../../src/services/summaryService');

// Test URLs that might cause issues
const testURLs = [
  // Malformed URL
  'https://example',
  
  // Valid but likely non-existent domain
  'https://site-that-definitely-does-not-exist-12345.com',
  
  // URL with invalid path
  'https://www.google.com/nonexistent-page-12345',
  
  // Page that requires authentication
  'https://github.com/settings/profile',
  
  // URL with special characters
  'https://example.com/path with spaces',
  
  // Extremely long URL
  'https://example.com/' + 'a'.repeat(500),
  
  // Valid URL with real content
  'https://www.bbc.com/news'
];

async function testURL(url) {
  console.log(`\n===== TESTING URL: ${url} =====\n`);
  
  try {
    const result = await summarizeContent({ url });
    console.log('Success! Analysis generated:', {
      title: result.title,
      analysisLength: result.analysis?.length || 0,
      hasEmailDraft: !!result.emailDraft,
      hasSocialShare: !!result.socialShare
    });
    return { success: true, result };
  } catch (error) {
    console.log('Error occurred:', {
      name: error.name,
      message: error.message
    });
    return { success: false, error };
  }
}

async function runTests() {
  console.log('Starting error handling tests with problematic URLs...');
  
  const results = [];
  
  for (const url of testURLs) {
    const result = await testURL(url);
    results.push({
      url,
      success: result.success,
      error: result.error?.message
    });
  }
  
  console.log('\n===== TEST SUMMARY =====\n');
  console.table(results);
  
  // Count successful and failed tests
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(`\nTest results: ${successCount} successful, ${failureCount} failed\n`);
  console.log('All tests completed');
}

runTests().catch(error => {
  console.error('Test runner error:', error);
}); 