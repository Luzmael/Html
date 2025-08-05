import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async (req, res) => {
  // Configuración CORS esencial
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    if (!process.env.GH_REPO || !process.env.GH_PAT) {
      throw new Error('Configuración faltante');
    }

    const response = await fetch(
      `https://api.github.com/repos/${process.env.GH_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GH_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Vercel-Serverless-Function'
        },
        body: JSON.stringify({
          event_type: 'run-generator'
        })
      }
    );

    if (!response.ok) throw new Error(await response.text());

    return res.status(202).json({ success: true });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : null
    });
  }
};
