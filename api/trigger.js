export default async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const response = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GH_TOKEN}`,
          'Accept': 'application/vnd.github.everest-preview+json'
        },
        body: JSON.stringify({
          event_type: 'run-generator'
        })
      }
    );

    if (!response.ok) throw new Error(await response.text());
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
