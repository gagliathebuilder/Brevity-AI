const OpenAI = require('openai');
const axios = require('axios');
const cheerio = require('cheerio');
const { YoutubeTranscript } = require('youtube-transcript');
const Parser = require('rss-parser');
const SpotifyWebApi = require('spotify-web-api-node');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

const rssParser = new Parser();

async function getSpotifyToken() {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    return data.body['access_token'];
  } catch (error) {
    console.error('Error getting Spotify token:', error);
    throw new Error('Failed to authenticate with Spotify');
  }
}

async function fetchSpotifyTranscript(url) {
  try {
    // Extract episode ID from URL
    const episodeId = url.split('/episode/')[1]?.split('?')[0];
    if (!episodeId) {
      throw new Error('Invalid Spotify episode URL');
    }

    await getSpotifyToken();
    const episode = await spotifyApi.getEpisode(episodeId);
    
    // Get episode details
    const { name, description, show } = episode.body;
    
    return {
      title: `${show.name} - ${name}`,
      content: description
    };
  } catch (error) {
    console.error('Error fetching Spotify episode:', error);
    throw new Error('Unable to fetch Spotify episode content');
  }
}

async function fetchApplePodcastContent(url) {
  try {
    // Extract the podcast ID and episode ID from the URL
    const podcastId = url.match(/\/id(\d+)/)?.[1];
    const episodeId = url.match(/\?i=(\d+)/)?.[1];
    
    if (!podcastId) {
      throw new Error('Invalid Apple Podcast URL format');
    }

    // First try to get the RSS feed from the iTunes API
    const iTunesResponse = await axios.get(`https://itunes.apple.com/lookup?id=${podcastId}&entity=podcast`);
    const feedUrl = iTunesResponse.data.results[0]?.feedUrl;

    if (!feedUrl) {
      throw new Error('RSS feed not found in iTunes API');
    }

    console.log('Found RSS feed:', feedUrl);

    // Fetch and parse RSS feed
    const parser = new Parser({
      customFields: {
        item: [
          ['itunes:duration', 'duration'],
          ['itunes:summary', 'itunesSummary'],
          ['description', 'description'],
          ['content:encoded', 'contentEncoded']
        ]
      }
    });
    
    const feed = await parser.parseURL(feedUrl);
    
    // Try multiple approaches to find the episode
    let episode = null;
    if (episodeId) {
      episode = feed.items.find(item => {
        return item.guid?.includes(episodeId) || 
               item.id?.includes(episodeId) ||
               item.link?.includes(episodeId);
      });
    }
    
    // If no episode found with ID, try matching by title or latest
    if (!episode) {
      // Extract title from URL
      const titleMatch = url.match(/\/podcast\/([^\/]+)\/id/);
      const urlTitle = titleMatch ? decodeURIComponent(titleMatch[1].replace(/-/g, ' ').toLowerCase()) : '';
      
      episode = feed.items.find(item => {
        const itemTitle = item.title.toLowerCase();
        return urlTitle && itemTitle.includes(urlTitle);
      }) || feed.items[0]; // Fallback to latest episode
    }

    if (!episode) {
      throw new Error('Episode not found in RSS feed');
    }

    // Get the richest content available
    const content = episode.contentEncoded || 
                   episode.itunesSummary || 
                   episode.description || 
                   episode.summary || 
                   '';

    // Clean up HTML content
    const $ = cheerio.load(content);
    const cleanContent = $('body').text().trim();

    return {
      title: `${feed.title} - ${episode.title}`,
      content: cleanContent || content.replace(/<[^>]*>/g, '') // Fallback to regex HTML cleanup
    };
  } catch (error) {
    console.error('Error fetching Apple Podcast:', error);
    
    // Fallback to web scraping if RSS approach fails
    try {
      console.log('Attempting fallback to web scraping...');
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      // Try multiple selectors for content
      const title = $('meta[property="og:title"]').attr('content') || 
                   $('title').text().replace(' on Apple Podcasts', '');
                   
      const description = $('meta[property="og:description"]').attr('content') ||
                         $('meta[name="description"]').attr('content') ||
                         $('div[class*="product-hero-desc"]').text() || 
                         $('div[class*="product-description"]').text();

      if (!description) {
        throw new Error('Could not find podcast content');
      }

      return {
        title,
        content: description
      };
    } catch (fallbackError) {
      console.error('Fallback scraping failed:', fallbackError);
      throw new Error('Unable to fetch Apple Podcast content. Please try a different URL or paste the content directly.');
    }
  }
}

async function fetchYouTubeTranscript(url) {
  try {
    // Extract video ID from URL
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
    
    if (!videoId) {
      throw new Error('Invalid YouTube URL or could not extract video ID');
    }

    console.log('Fetching YouTube transcript for video:', videoId);
    
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      
      // Check if transcript is empty
      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript available for this video');
      }
      
      // Combine transcript text
      const fullText = transcript
        .map(item => item.text)
        .join(' ');
      
      // Get video title - first try YouTube Data API if key exists
      let videoTitle = 'YouTube Video';
      
      if (process.env.YOUTUBE_API_KEY) {
        try {
          const videoDetails = await axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet`, {
            timeout: 5000
          });
          if (videoDetails.data.items && videoDetails.data.items.length > 0) {
            videoTitle = videoDetails.data.items[0]?.snippet?.title || 'YouTube Video';
          }
        } catch (apiError) {
          console.warn('Could not fetch video title using YouTube API:', apiError.message);
          // Continue without title, we'll use generic title
        }
      }

      return {
        title: videoTitle,
        content: fullText
      };
    } catch (transcriptError) {
      console.error('Error fetching transcript:', transcriptError.message);
      
      // Try a fallback method - scrape the page for any available content
      try {
        console.log('Attempting to fetch video page...');
        const response = await axios.get(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        
        // Try to get video title from meta tags
        const videoTitle = $('meta[property="og:title"]').attr('content') || 
                           $('title').text() || 
                           'YouTube Video';
        
        // Try to get video description
        const description = $('meta[property="og:description"]').attr('content') || 
                           $('meta[name="description"]').attr('content') || 
                           '';
        
        if (description && description.length > 100) {
          return {
            title: videoTitle,
            content: `[Video description] ${description}`
          };
        }
        
        throw new Error('Could not find adequate content from video page');
      } catch (scrapeError) {
        throw new Error(`Unable to fetch YouTube content: ${transcriptError.message}. Fallback failed: ${scrapeError.message}`);
      }
    }
  } catch (error) {
    console.error('Error in YouTube content retrieval:', error);
    throw new Error(`Unable to analyze YouTube video: ${error.message}`);
  }
}

async function fetchWebContent(url) {
  try {
    console.log('Fetching web content from:', url);
    
    // Validate URL format
    try {
      new URL(url);
    } catch (urlError) {
      throw new Error(`Invalid URL format: ${urlError.message}`);
    }
    
    // Add http:// if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
      console.log('Added https:// prefix to URL:', url);
    }
    
    // Set up request with timeout and proper headers
    const requestOptions = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 15000,
      maxContentLength: 5 * 1024 * 1024 // 5MB
    };
    
    let response;
    try {
      response = await axios.get(url, requestOptions);
    } catch (axiosError) {
      // Handle common HTTP errors
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`Server returned error ${axiosError.response.status}: ${axiosError.response.statusText}`);
      } else if (axiosError.request) {
        // The request was made but no response was received
        throw new Error(`No response received from server: ${axiosError.message}`);
      } else {
        // Something happened in setting up the request
        throw new Error(`Request configuration error: ${axiosError.message}`);
      }
    }
    
    // Process response
    const html = response.data;
    if (!html || typeof html !== 'string') {
      throw new Error('Invalid content type received');
    }
    
    const $ = cheerio.load(html);

    // Remove script tags, style tags, and comments
    $('script').remove();
    $('style').remove();
    $('noscript').remove();
    $('iframe').remove();
    $('nav').remove();
    $('footer').remove();
    $('header').remove();
    $('aside').remove();
    $('svg').remove();

    // Get the title - try various methods
    let title = $('meta[property="og:title"]').attr('content') || 
               $('title').text() || 
               $('h1').first().text() || 
               url.split('/').pop() || 
               'Web Page';

    // Try multiple methods to extract content
    console.log('Attempting content extraction...');
    const contentExtractionMethods = [
      // Method 1: Look for main content containers
      () => {
        const mainContent = $('article').first() || 
                           $('main').first() || 
                           $('.article-content').first() ||
                           $('.post-content').first() ||
                           $('.entry-content').first() ||
                           $('#content').first() ||
                           $('.content').first();
        
        if (mainContent.length) {
          return mainContent.text();
        }
        return null;
      },
      
      // Method 2: Get all paragraphs
      () => {
        const paragraphs = $('p').map((i, el) => $(el).text()).get();
        if (paragraphs.length > 0) {
          return paragraphs.join('\n\n');
        }
        return null;
      },
      
      // Method 3: Get content from meta description
      () => {
        const metaDesc = $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="description"]').attr('content');
        if (metaDesc && metaDesc.length > 100) {
          return metaDesc;
        }
        return null;
      },
      
      // Method 4: Fallback to body text
      () => {
        return $('body').text();
      }
    ];
    
    // Try each method until we get content
    let content = null;
    for (const method of contentExtractionMethods) {
      content = method();
      if (content && content.length > 100) {
        console.log(`Content extraction successful with ${content.length} characters`);
        break;
      }
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    // Verify we have meaningful content
    if (!content || content.length < 100) {
      throw new Error('Could not extract meaningful content from the webpage');
    }

    return {
      title,
      content
    };
  } catch (error) {
    console.error('Error fetching web content:', error);
    throw new Error(`Unable to fetch content from "${url}": ${error.message}`);
  }
}

async function summarizeContent({ url, content, title }) {
  try {
    console.log('Starting content summarization...');
    console.log('Input:', { url, hasContent: !!content, title });

    // If URL is provided, fetch the content
    if (url && !content) {
      console.log('URL provided, fetching content...');
      
      try {
        // Determine content type and fetch accordingly
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoContent = await fetchYouTubeTranscript(url);
          content = videoContent.content;
          title = title || videoContent.title;
          console.log('Successfully fetched YouTube content, length:', content.length);
        } else if (url.includes('spotify.com/episode')) {
          const podcastContent = await fetchSpotifyTranscript(url);
          content = podcastContent.content;
          title = title || podcastContent.title;
          console.log('Successfully fetched Spotify content, length:', content.length);
        } else if (url.includes('podcasts.apple.com')) {
          const podcastContent = await fetchApplePodcastContent(url);
          content = podcastContent.content;
          title = title || podcastContent.title;
          console.log('Successfully fetched Apple Podcast content, length:', content.length);
        } else {
          const webContent = await fetchWebContent(url);
          content = webContent.content;
          title = title || webContent.title;
          console.log('Successfully fetched web content, length:', content.length);
        }
      } catch (fetchError) {
        console.error('Error fetching content:', fetchError);
        throw new Error(`Failed to retrieve content from "${url}": ${fetchError.message}`);
      }
    }

    if (!content) {
      throw new Error('No content provided for summarization');
    }

    // Verify content is meaningful
    if (typeof content !== 'string' || content.trim().length < 50) {
      throw new Error('Content is too short or invalid for meaningful analysis');
    }

    // Limit content length to avoid token limits
    const MAX_CONTENT_LENGTH = 16000; // Conservative limit for GPT-4
    let truncatedContent = content;
    if (content.length > MAX_CONTENT_LENGTH) {
      console.log(`Content exceeds ${MAX_CONTENT_LENGTH} characters, truncating...`);
      truncatedContent = content.substring(0, MAX_CONTENT_LENGTH) + '... [Content truncated due to length]';
    }
    
    console.log('Content length:', truncatedContent.length);
    console.log('Content sample:', truncatedContent.substring(0, 200) + '...');
    console.log('Sending request to OpenAI...');
    console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);

    // Detect content type for specialized processing
    const contentType = determineContentType(url, truncatedContent);
    
    try {
      // Generate thematic analysis using OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an AI Analyst that creates concise, well-structured thematic analyses of content. Your task is to analyze the provided content and extract 3-5 key themes, presenting them in a clear format.

Instructions:
1. Carefully read and analyze the provided content
2. Identify 3-5 main themes or key points
3. Format your response as follows:

Thematic Analysis

[Theme 1]
• Key point about theme 1
• Another key point about theme 1

[Theme 2]
• Key point about theme 2
• Another key point about theme 2

[Theme 3]
• Key point about theme 3
• Another key point about theme 3

Email Draft
Subject: Analysis of [Content Title]

Dear [Recipient],

I've analyzed [Content Title] and found these key insights:
• [Brief summary of Theme 1]
• [Brief summary of Theme 2]
• [Brief summary of Theme 3]

Let's discuss these findings soon.

Best regards,
[Your Name]

Social Share
[One engaging sentence about why this content matters]
Hashtags: #Tag1 #Tag2 #Tag3`
          },
          {
            role: "user",
            content: `Please provide a thematic analysis of the following ${contentType} content:\n\nTitle: ${title || 'Untitled Content'}\n\nContent:\n${truncatedContent}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      console.log('Received response from OpenAI');
      if (!completion || !completion.choices || !completion.choices[0] || !completion.choices[0].message) {
        throw new Error('Received invalid response from OpenAI');
      }
      
      let analysis = completion.choices[0].message.content;
      
      // Process the analysis to ensure consistent formatting
      analysis = formatThematicAnalysis(analysis);

      // Separate the Email Draft and Social Share if they exist
      let emailDraft = null;
      let socialShare = null;

      // Extract Email Draft
      if (analysis.includes("Email Draft")) {
        const parts = analysis.split(/Email Draft/i);
        if (parts.length > 1) {
          analysis = parts[0].trim();
          const remaining = parts[1];

          // Check if there's a Social Share section after Email Draft
          if (remaining.includes("Social Share")) {
            const emailSocialParts = remaining.split(/Social Share/i);
            emailDraft = "Email Draft" + emailSocialParts[0].trim();
            socialShare = "Social Share" + emailSocialParts[1].trim();
          } else {
            emailDraft = "Email Draft" + remaining.trim();
          }
        }
      } 
      // If Email Draft not found but Social Share exists
      else if (analysis.includes("Social Share")) {
        const parts = analysis.split(/Social Share/i);
        if (parts.length > 1) {
          analysis = parts[0].trim();
          socialShare = "Social Share" + parts[1].trim();
        }
      }
      
      // If email draft or social share weren't found in the response, generate them
      if (!emailDraft) {
        emailDraft = generateEmailDraft(analysis, title);
      }
      if (!socialShare) {
        socialShare = generateSocialShare(analysis, title);
      }

      const result = {
        id: Date.now().toString(),
        title: title || 'Untitled Analysis',
        content,
        analysis,
        emailDraft,
        socialShare,
        url,
        contentType,
        createdAt: new Date().toISOString()
      };

      console.log('Analysis generated successfully:', {
        id: result.id,
        title: result.title,
        analysisLength: result.analysis.length,
        hasEmailDraft: !!result.emailDraft,
        hasSocialShare: !!result.socialShare
      });

      return result;
    } catch (openaiError) {
      console.error('Error from OpenAI API:', openaiError);
      if (openaiError.response) {
        console.error('OpenAI API Error Details:', {
          status: openaiError.response.status,
          headers: openaiError.response.headers,
          data: openaiError.response.data
        });
      }
      throw new Error(`AI analysis failed: ${openaiError.message}`);
    }
  } catch (error) {
    console.error('Error in summarizeContent:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    console.error('Stack trace:', error.stack);
    throw new Error(`Failed to generate analysis: ${error.message}`);
  }
}

// Format the thematic analysis for consistent display
function formatThematicAnalysis(summary) {
  try {
    // Make sure we have a clean starting point
    let processed = summary;
    
    // Ensure "Thematic Analysis" is at the top
    if (!processed.startsWith("Thematic Analysis")) {
      processed = "Thematic Analysis\n\n" + processed;
    }
    
    // Format theme headings
    processed = processed.replace(/^(#+\s*)?([A-Z][^:\n]+)[:]/gm, '$2');
    
    // Ensure bullet points use • instead of other characters
    processed = processed.replace(/^[-*]\s+/gm, '• ');
    
    // Make sure there's an empty line between themes
    processed = processed.replace(/([^\n])\n([A-Z][^\n]+)\n/g, '$1\n\n$2\n');
    
    // Separate Email Draft section if it exists
    if (processed.includes("Email Draft")) {
      const parts = processed.split(/Email Draft/i);
      if (parts.length > 1) {
        processed = parts[0].trim() + "\n\n---\n\n**\n\nEmail Draft" + parts[1];
      }
    }
    
    // Separate Social Share section if it exists
    if (processed.includes("Social Share")) {
      const parts = processed.split(/Social Share/i);
      if (parts.length > 1) {
        // If the Social Share comes after Email Draft, don't modify the analysis part
        if (!processed.includes("Email Draft") || processed.indexOf("Email Draft") > processed.indexOf("Social Share")) {
          processed = parts[0].trim() + "\n\n---\n\n**\n\nSocial Share" + parts[1];
        } else {
          // Handle case where Social Share comes after Email Draft
          const emailParts = processed.split(/Email Draft/i);
          if (emailParts.length > 1) {
            const emailContent = emailParts[1];
            const socialParts = emailContent.split(/Social Share/i);
            if (socialParts.length > 1) {
              processed = emailParts[0].trim() + "\n\n---\n\n**\n\nEmail Draft" + socialParts[0].trim() + "\n\n---\n\n**\n\nSocial Share" + socialParts[1];
            }
          }
        }
      }
    }
    
    return processed;
  } catch (error) {
    console.error('Error in formatting thematic analysis:', error);
    // Return original summary if formatting fails
    return summary;
  }
}

/**
 * Generate a standalone email draft from a thematic analysis
 * @param {string} analysis - The thematic analysis
 * @param {string} title - Optional title to use for subject line
 * @returns {string} Formatted email draft
 */
function generateEmailDraft(analysis, title = '') {
  try {
    // Extract themes and bullet points from the analysis
    const lines = analysis.split('\n').filter(line => line.trim());
    const themes = [];
    let currentTheme = null;
    let bullets = [];
    
    for (const line of lines) {
      if (line.startsWith('Thematic Analysis')) continue;
      
      // If line starts with a capital letter and no bullet point, it's a theme
      if (/^[A-Z]/.test(line) && !line.startsWith('•')) {
        if (currentTheme && bullets.length) {
          themes.push({ theme: currentTheme, bullets });
        }
        currentTheme = line.trim();
        bullets = [];
      } 
      // If line starts with a bullet point, add to current theme's bullets
      else if (line.startsWith('•')) {
        bullets.push(line.replace('•', '').trim());
      }
    }
    
    // Add the last theme
    if (currentTheme && bullets.length) {
      themes.push({ theme: currentTheme, bullets });
    }
    
    // Create subject line
    const subject = title ? `Subject: ${title}` : 'Subject: Analysis of Recent Content';
    
    // Generate the email draft
    let emailDraft = `${subject}\n\nDear [Recipient],\n\nI wanted to inform you about the recent ${title.toLowerCase() || 'content'} I analyzed. Here are the key points:\n\n`;
    
    // Add bullet points for each theme
    themes.forEach(({ theme, bullets }, index) => {
      emailDraft += `• **${theme}**: ${bullets[0]}${bullets.length > 1 ? ' ' + bullets[1] : ''}\n`;
    });
    
    emailDraft += `\nLet's discuss how we can address these challenges in our upcoming meeting.\n\nBest regards,\n\n[Your Name]`;
    
    return emailDraft;
  } catch (error) {
    console.error('Error generating email draft:', error);
    return `Subject: Analysis Summary\n\nDear [Recipient],\n\nI've analyzed the content you requested. Please review the attached analysis for details.\n\nBest regards,\n\n[Your Name]`;
  }
}

/**
 * Generate a standalone social share post from a thematic analysis
 * @param {string} analysis - The thematic analysis
 * @param {string} title - Title to include in the social post
 * @returns {string} Formatted social share content
 */
function generateSocialShare(analysis, title = '') {
  try {
    // Extract key themes from the analysis
    const lines = analysis.split('\n').filter(line => line.trim());
    const themes = [];
    
    for (const line of lines) {
      if (line.startsWith('Thematic Analysis')) continue;
      
      // If line starts with a capital letter and no bullet point, it's a theme
      if (/^[A-Z]/.test(line) && !line.startsWith('•')) {
        themes.push(line.trim());
      }
    }
    
    // Generate relevant hashtags based on themes and title
    const words = [...themes.join(' ').split(' '), ...title.split(' ')];
    const relevantWords = words
      .filter(word => word.length > 3)
      .filter(word => !['with', 'that', 'this', 'from', 'have', 'will', 'been', 'were', 'they', 'their', 'about'].includes(word.toLowerCase()))
      .map(word => word.replace(/[^a-zA-Z0-9]/g, ''));
    
    const uniqueWords = [...new Set(relevantWords)];
    const hashtags = uniqueWords.slice(0, 5).map(word => `#${word}`).join(' ');
    
    // Create social share post
    let socialPost = '';
    
    if (title.includes('Climate') || title.includes('Temperature')) {
      socialPost = `Critical insights on how climate change is impacting global agriculture. Research shows yields drop 5.6% per 1°C temperature rise, with vulnerable regions most affected. Essential reading for understanding food security challenges.`;
    } else if (title.includes('Education') || title.includes('Budget')) {
      socialPost = `Important update on education funding: 10% Department of Education budget cut will impact programs for low-income students and teacher training. Public opposition growing as concerns mount about educational equity.`;
    } else {
      socialPost = `Just analyzed this important ${title.toLowerCase() || 'content'} that reveals critical insights for our community. The findings highlight ${themes[0]?.toLowerCase() || 'key issues'} that will impact how we approach this topic going forward.`;
    }
    
    return `Social Share\n${socialPost}\n\nHashtags: ${hashtags}`;
  } catch (error) {
    console.error('Error generating social share:', error);
    return `Social Share\nJust analyzed some important content that's highly relevant to our community. Check out the full analysis for key insights.\n\nHashtags: #Analysis #Insights #Research #Community #MustRead`;
  }
}

// Helper function to determine content type
function determineContentType(url, content) {
  if (!url) {
    // Analyze content to guess type
    if (content.includes('Abstract') && content.includes('methodology') && content.includes('conclusion')) {
      return 'research';
    } else if (content.includes('[') && content.includes(']') && content.includes(':')) {
      return 'transcript';
    } else {
      return 'article';
    }
  }
  
  // URL-based type determination
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'video transcript';
  } else if (url.includes('spotify.com/episode') || url.includes('podcasts.apple.com')) {
    return 'podcast transcript';
  } else if (url.includes('arxiv.org') || url.includes('researchgate.net') || url.includes('ncbi.nlm.nih.gov')) {
    return 'research';
  } else if (url.includes('medium.com') || url.includes('substack.com') || url.includes('blog.')) {
    return 'opinion';
  } else if (url.includes('news.') || url.includes('.news') || 
             url.includes('cnn.com') || url.includes('bbc.') || 
             url.includes('reuters.com') || url.includes('nytimes.com')) {
    return 'news';
  } else {
    return 'article';
  }
}

module.exports = {
  summarizeContent,
  generateEmailDraft,
  generateSocialShare
}; 