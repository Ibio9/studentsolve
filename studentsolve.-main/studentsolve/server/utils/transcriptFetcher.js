import axios from 'axios';

export async function fetchTranscript(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
    /(?:youtu\.be\/)([^?\s]+)/,
    /(?:youtube\.com\/embed\/)([^?\s]+)/,
  ];

  let videoId = null;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      videoId = match[1];
      break;
    }
  }

  if (!videoId) {
    throw new Error('Could not extract video ID. Please use a valid YouTube link.');
  }

  try {
    const response = await axios.get(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
      { timeout: 30000 }
    );

    const text = response.data?.content || response.data?.text || '';

    if (!text || text.length < 100) {
      throw new Error('Transcript too short or empty.');
    }

    return { videoId, text };
  } catch (err) {
    if (err.response?.status === 404 || err.response?.status === 400) {
      throw new Error('No captions available for this video. Try a video with English subtitles enabled.');
    }
    throw new Error('Could not retrieve transcript. Make sure the video has English captions enabled.');
  }
}