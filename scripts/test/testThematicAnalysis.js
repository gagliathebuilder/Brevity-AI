require('dotenv').config();
const { summarizeContent, generateEmailDraft, generateSocialShare } = require('../../src/services/summaryService');

// Test news article content about education budget cuts
const educationBudgetContent = `
The Department of Education is facing a 10% reduction in its annual budget as part of broader government efforts to reduce federal spending. This significant cut amounts to billions of dollars and will impact various educational programs and initiatives across the country.

According to government officials, the budget reduction is necessary to address the growing federal deficit. Critics, however, argue that cutting education funding will have long-term negative consequences for the nation's students and educational system.

Programs specifically aimed at low-income students might see reduced funding or elimination under the new budget constraints. Grants for teacher training and after-school programs are also at risk of facing severe reductions. Educational leaders have expressed concerns that these cuts will undermine the quality of education in vulnerable communities.

The budget cuts have sparked debates among politicians, with some defending the cuts as necessary for fiscal health and others criticizing them as harmful to educational equity. Educators and public figures have started organizing campaigns to protest against the budget cuts.

Opinion polls show a significant portion of the public opposes the cuts, viewing them as detrimental to the nation's educational standards. Parent associations across the country have voiced concerns about how the reduced funding might affect their children's education quality.
`;

// Test research content about climate change
const climateResearchContent = `
This study examines the impacts of rising global temperatures on agricultural productivity in different regions. Using data from 50 countries over a 30-year period, researchers found that for every 1°C increase in global mean temperature, agricultural yields decreased by an average of 5.6% globally.

The methodology involved analyzing historical climate and agricultural data, controlling for variables such as precipitation, technological advancements, and agricultural policies. Statistical models were used to isolate the effects of temperature changes on crop yields.

Results indicate significant regional variations in climate vulnerability. Tropical regions showed the highest sensitivity to temperature increases, with yield reductions of up to 9.1% per 1°C warming. In contrast, some high-latitude regions experienced modest yield improvements of 1.8% for the same temperature increase.

Researchers concluded that agricultural adaptation strategies are essential for food security. The study identified several promising approaches, including drought-resistant crop varieties, improved irrigation systems, and changes in planting schedules, which could mitigate up to 60% of climate-related yield losses in the most vulnerable regions.

The findings emphasize the need for increased investment in agricultural research and development, particularly in vulnerable regions. The study estimates that each dollar invested in climate-adaptive agricultural research could prevent $7 in crop losses over the next decade.
`;

async function runTest() {
  console.log('Testing thematic analysis format, email draft, and social share functionality...');
  
  try {
    // Test with education budget content
    console.log('\n===== TESTING EDUCATION BUDGET CONTENT =====\n');
    const budgetAnalysis = await summarizeContent({
      content: educationBudgetContent,
      title: 'Department of Education Budget Cuts'
    });
    
    console.log('\n--- EDUCATION BUDGET ANALYSIS RESULT ---\n');
    console.log(budgetAnalysis.title);
    console.log('Content Type:', budgetAnalysis.contentType);
    console.log('\n' + budgetAnalysis.analysis);
    
    // Test the AI-generated email draft
    console.log('\n--- AI-GENERATED EMAIL DRAFT ---\n');
    console.log(budgetAnalysis.emailDraft || 'No email draft generated');
    
    // Test the AI-generated social share
    console.log('\n--- AI-GENERATED SOCIAL SHARE ---\n');
    console.log(budgetAnalysis.socialShare || 'No social share generated');
    
    // Test the programmatically generated email draft
    console.log('\n--- PROGRAMMATICALLY GENERATED EMAIL DRAFT ---\n');
    const programmaticEmail = generateEmailDraft(budgetAnalysis.analysis, budgetAnalysis.title);
    console.log(programmaticEmail);
    
    // Test the programmatically generated social share
    console.log('\n--- PROGRAMMATICALLY GENERATED SOCIAL SHARE ---\n');
    const programmaticSocial = generateSocialShare(budgetAnalysis.analysis, budgetAnalysis.title);
    console.log(programmaticSocial);
    
    console.log('\n--- END EDUCATION BUDGET ANALYSIS ---\n');
    
    // Test with climate research content
    console.log('\n===== TESTING CLIMATE RESEARCH CONTENT =====\n');
    const climateAnalysis = await summarizeContent({
      content: climateResearchContent,
      title: 'Climate Change Impact on Agriculture'
    });
    
    console.log('\n--- CLIMATE RESEARCH ANALYSIS RESULT ---\n');
    console.log(climateAnalysis.title);
    console.log('Content Type:', climateAnalysis.contentType);
    console.log('\n' + climateAnalysis.analysis);
    
    // Test the AI-generated email draft
    console.log('\n--- AI-GENERATED EMAIL DRAFT ---\n');
    console.log(climateAnalysis.emailDraft || 'No email draft generated');
    
    // Test the AI-generated social share
    console.log('\n--- AI-GENERATED SOCIAL SHARE ---\n');
    console.log(climateAnalysis.socialShare || 'No social share generated');
    
    // Test the programmatically generated email draft
    console.log('\n--- PROGRAMMATICALLY GENERATED EMAIL DRAFT ---\n');
    const climateEmail = generateEmailDraft(climateAnalysis.analysis, climateAnalysis.title);
    console.log(climateEmail);
    
    // Test the programmatically generated social share
    console.log('\n--- PROGRAMMATICALLY GENERATED SOCIAL SHARE ---\n');
    const climateSocial = generateSocialShare(climateAnalysis.analysis, climateAnalysis.title);
    console.log(climateSocial);
    
    console.log('\n--- END CLIMATE RESEARCH ANALYSIS ---\n');
    
    console.log('\nAll thematic analysis tests completed successfully!');
  } catch (error) {
    console.error('Error in test:', error);
  }
}

runTest(); 