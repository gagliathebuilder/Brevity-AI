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
      throw new Error('Invalid YouTube URL');
    }

    console.log('Fetching YouTube transcript for video:', videoId);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Get video title using YouTube Data API
    const videoDetails = await axios.get(`https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet`);
    const videoTitle = videoDetails.data.items[0]?.snippet?.title || 'YouTube Video';
    
    // Combine transcript text
    const fullText = transcript
      .map(item => item.text)
      .join(' ');

    return {
      title: videoTitle,
      content: fullText
    };
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    throw new Error('Unable to fetch YouTube transcript. The video might not have captions available.');
  }
}

async function fetchWebContent(url) {
  try {
    console.log('Fetching web content from:', url);
    const response = await axios.get(url);
    const html = response.data;
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

    // Get the title
    const title = $('title').text() || $('h1').first().text() || '';

    // Get the main content
    let content = '';
    
    // Try to find the main content area
    const mainContent = $('article').first() || 
                       $('main').first() || 
                       $('.article-content').first() ||
                       $('.post-content').first() ||
                       $('.content').first();

    if (mainContent.length) {
      content = mainContent.text();
    } else {
      // Fallback to getting all paragraph text
      content = $('p').map((i, el) => $(el).text()).get().join('\n\n');
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    return {
      title,
      content
    };
  } catch (error) {
    console.error('Error fetching web content:', error);
    throw new Error('Unable to fetch content from the provided URL');
  }
}

async function summarizeContent({ url, content, title }) {
  try {
    console.log('Starting content summarization...');
    console.log('Input:', { url, hasContent: !!content, title });

    // If URL is provided, fetch the content
    if (url && !content) {
      console.log('URL provided, fetching content...');
      
      // Determine content type and fetch accordingly
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoContent = await fetchYouTubeTranscript(url);
        content = videoContent.content;
        title = title || videoContent.title;
      } else if (url.includes('spotify.com/episode')) {
        const podcastContent = await fetchSpotifyTranscript(url);
        content = podcastContent.content;
        title = title || podcastContent.title;
      } else if (url.includes('podcasts.apple.com')) {
        const podcastContent = await fetchApplePodcastContent(url);
        content = podcastContent.content;
        title = title || podcastContent.title;
      } else {
        const webContent = await fetchWebContent(url);
        content = webContent.content;
        title = title || webContent.title;
      }
    }

    if (!content) {
      throw new Error('No content provided for summarization');
    }

    console.log('Content length:', content.length);
    console.log('Sending request to OpenAI...');
    console.log('OpenAI API Key present:', !!process.env.OPENAI_API_KEY);

    // Generate summary using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise summaries of content."
        },
        {
          role: "user",
          content: `Please summarize the following content in 3-5 bullet points:\n\n${content}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    console.log('Received response from OpenAI');
    const summary = completion.choices[0].message.content;

    const result = {
      id: Date.now().toString(),
      title: title || 'Untitled Summary',
      content,
      summary,
      url,
      createdAt: new Date().toISOString()
    };

    console.log('Summary generated successfully:', {
      id: result.id,
      title: result.title,
      summaryLength: result.summary.length
    });

    return result;
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
    throw new Error(`Failed to generate summary: ${error.message}`);
  }
}

module.exports = {
  summarizeContent
}; 