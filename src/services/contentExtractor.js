const axios = require('axios');
const { google } = require('googleapis');
const Vimeo = require('@vimeo/vimeo').Vimeo;
const SpotifyWebApi = require('spotify-web-api-node');

class ContentExtractor {
  constructor() {
    this.youtube = google.youtube('v3');
    this.vimeo = new Vimeo(
      process.env.VIMEO_CLIENT_ID,
      process.env.VIMEO_CLIENT_SECRET,
      process.env.VIMEO_ACCESS_TOKEN
    );
    this.spotify = new SpotifyWebApi({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET
    });
  }

  async extractContent(url) {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return await this.extractYouTubeContent(url);
      } else if (url.includes('vimeo.com')) {
        return await this.extractVimeoContent(url);
      } else if (url.includes('spotify.com')) {
        return await this.extractSpotifyContent(url);
      } else {
        return await this.extractArticleContent(url);
      }
    } catch (error) {
      console.error('Content extraction error:', error);
      throw new Error('Failed to extract content from URL');
    }
  }

  async extractYouTubeContent(url) {
    const videoId = this.extractYouTubeId(url);
    const response = await this.youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,
      part: 'snippet,contentDetails',
      id: videoId
    });

    const video = response.data.items[0];
    return {
      title: video.snippet.title,
      content: video.snippet.description,
      sourceType: 'youtube',
      metadata: {
        duration: video.contentDetails.duration,
        channel: video.snippet.channelTitle
      }
    };
  }

  async extractVimeoContent(url) {
    const videoId = url.split('/').pop();
    const response = await this.vimeo.request({
      method: 'GET',
      path: `/videos/${videoId}`
    });

    return {
      title: response.body.name,
      content: response.body.description,
      sourceType: 'vimeo',
      metadata: {
        duration: response.body.duration
      }
    };
  }

  async extractSpotifyContent(url) {
    const trackId = url.split('/').pop();
    const response = await this.spotify.getTrack(trackId);

    return {
      title: response.body.name,
      content: response.body.description || '',
      sourceType: 'spotify',
      metadata: {
        artists: response.body.artists.map(artist => artist.name),
        album: response.body.album.name
      }
    };
  }

  async extractArticleContent(url) {
    const response = await axios.get(url);
    const html = response.data;
    
    // Basic HTML parsing to extract content
    const title = html.match(/<title>(.*?)<\/title>/i)?.[1] || '';
    const content = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
    
    return {
      title,
      content: this.cleanHtml(content),
      sourceType: 'article'
    };
  }

  extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  cleanHtml(html) {
    return html
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }
}

module.exports = new ContentExtractor(); 