require('dotenv').config();

console.log('\nChecking environment variables...\n');

const requiredVars = [
  'OPENAI_API_KEY',
  'PORT',
  'NODE_ENV'
];

const missingVars = [];
const presentVars = [];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName);
  } else {
    presentVars.push(varName);
  }
});

console.log('Present variables:');
presentVars.forEach(varName => {
  const value = process.env[varName];
  const maskedValue = varName.includes('KEY') || varName.includes('SECRET') 
    ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
    : value;
  console.log(`- ${varName}: ${maskedValue}`);
});

if (missingVars.length > 0) {
  console.log('\nMissing required variables:');
  missingVars.forEach(varName => {
    console.log(`- ${varName}`);
  });
  console.log('\nPlease add these variables to your .env file');
  process.exit(1);
} else {
  console.log('\nAll required environment variables are present! ✅\n');
} 