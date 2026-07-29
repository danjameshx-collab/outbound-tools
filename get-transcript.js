const { YoutubeTranscript } = require('youtube-transcript');

function extractVideoId(input) {
  const match = input.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : input;
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node get-transcript.js <youtube-url-or-id>');
    process.exit(1);
  }

  const videoId = extractVideoId(url);
  const items = await YoutubeTranscript.fetchTranscript(videoId);
  const text = items.map(i => i.text).join(' ');
  console.log(text);
}

main().catch(err => {
  console.error('Failed to fetch transcript:', err.message);
  process.exit(1);
});
