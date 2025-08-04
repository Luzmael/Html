// Para Vercel/Netlify Functions
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'tu-usuario';
  const REPO_NAME = 'tu-repo';

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.everest-preview+json'
        },
        body: JSON.stringify({
          event_type: 'trigger-generate'
        })
      }
    );

    if (!response.ok) throw new Error(await response.text());
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
