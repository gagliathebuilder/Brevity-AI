const axios = require('axios');
require('dotenv').config();

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;
const TEST_USER = {
  email: 'testuser@brevityiq.com',
  password: 'Test123!@#'
};

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAPI() {
  console.log('Testing BrevityIQ API...\n');
  console.log(`Base URL: ${BASE_URL}`);

  try {
    // Test health check endpoint
    console.log('\n1. Testing health check endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);

    // Test registration
    console.log('\n2. Testing user registration...');
    console.log('Registering user:', TEST_USER.email);
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
    console.log('✅ Registration successful:', registerResponse.data);

    // Wait a bit for the registration to process
    await wait(2000);

    // Test login
    console.log('\n3. Testing user login...');
    console.log('Logging in user:', TEST_USER.email);
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    console.log('✅ Login successful');
    console.log('Session token received:', !!loginResponse.data.session.access_token);

    const token = loginResponse.data.session.access_token;

    // Test summary creation
    console.log('\n4. Testing summary creation...');
    const testContent = {
      url: 'https://www.example.com/sample-article',
      title: 'Test Article',
      content: 'This is a test article content that needs to be summarized.'
    };
    console.log('Creating summary for:', testContent.url);
    const summaryResponse = await axios.post(
      `${BASE_URL}/summaries`,
      testContent,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    console.log('✅ Summary creation successful:', summaryResponse.data);

    // Test getting summaries
    console.log('\n5. Testing getting summaries...');
    const summariesResponse = await axios.get(`${BASE_URL}/summaries`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Getting summaries successful');
    console.log('Number of summaries:', summariesResponse.data.length);

    console.log('\n🎉 All tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received');
      console.error('Request:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testAPI(); 