const axios = require('axios');
require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

async function testMVP() {
  console.log('Testing BrevityIQ MVP...\n');
  console.log(`Base URL: ${BASE_URL}`);

  try {
    // Test health check endpoint
    console.log('\n1. Testing health check endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test summary creation
    console.log('\n2. Testing summary creation...');
    const testContent = {
      title: 'Test Article',
      content: 'This is a test article content that needs to be summarized. It contains several paragraphs of information that should be condensed into a concise summary. The summary should capture the main points and key takeaways from this content.'
    };

    const summaryResponse = await axios.post(`${BASE_URL}/summaries`, testContent);
    console.log('✅ Summary creation successful:', summaryResponse.data);

    // Test getting summaries
    console.log('\n3. Testing getting summaries...');
    const summariesResponse = await axios.get(`${BASE_URL}/summaries`);
    console.log('✅ Getting summaries successful:', summariesResponse.data);

    console.log('\n🎉 All MVP tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testMVP(); 