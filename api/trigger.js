import { createClient } from '@supabase/supabase-js';

// Configuración inicial
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async (req, res) => {
  // 1. Configurar CORS (Critical para Vercel)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Manejar preflight (necesario para CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Validar método HTTP
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      error: 'Método no permitido',
      allowed: ['POST']
    });
  }

  try {
    // 4. Validar datos esenciales
    if (!process.env.GH_REPO || !process.env.GH_TOKEN) {
      throw new Error('Configuración de GitHub incompleta');
    }

    // 5. Disparar GitHub Action
    const response = await fetch(
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
            source: 'vercel-interface',
            time: new Date().toISOString()
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`GitHub API: ${errorData.message || 'Error desconocido'}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Generación iniciada correctamente',
      repo: process.env.GH_REPO
    });

  } catch (error) {
    console.error('Error en API:', error);
    return res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
