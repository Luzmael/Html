import { createClient } from '@supabase/supabase-js';

export default async (req, res) => {
  // Configuración CORS esencial
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Solo método POST permitido' });
  }

  try {
    // 1. Validar variables críticas
    const requiredEnvs = ['SUPABASE_URL', 'SUPABASE_KEY', 'GH_REPO', 'GH_TOKEN'];
    const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
    
    if (missingEnvs.length > 0) {
      throw new Error(`Faltan variables: ${missingEnvs.join(', ')}`);
    }

    // 2. Inicializar Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    // 3. Disparar GitHub Action
    const githubResponse = await fetch(
      `https://api.github.com/repos/${process.env.GH_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GH_TOKEN}`,
          'Accept': 'application/vnd.github.everest-preview+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'run-generator',
          client_payload: {
            source: 'vercel-web-interface'
          }
        })
      }
    );

    if (!githubResponse.ok) {
      const errorDetails = await githubResponse.json();
      console.error('GitHub API Error:', errorDetails);
      throw new Error(`GitHub API: ${errorDetails.message || 'Error desconocido'}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Trigger ejecutado correctamente',
      repo: process.env.GH_REPO
    });

  } catch (error) {
    console.error('Error completo:', error);
    return res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : 'Habilita modo desarrollo para ver detalles'
    });
  }
};
