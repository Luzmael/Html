import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async (req, res) => {
  // 1. Configuración CORS esencial
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 2. Manejo de preflight REQUERIDO
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Validar método POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      error: 'Método no permitido',
      allowed_methods: ['POST']
    });
  }

  try {
    console.log('🔔 Petición recibida - Validando variables...');
    
    // 4. Validar variables críticas
    if (!process.env.GH_REPO || !process.env.GH_TOKEN) {
      throw new Error('Configuración de GitHub incompleta');
    }

    // 5. Disparar GitHub Action
    console.log('🚀 Disparando GitHub Action...');
    const response = await fetch(
      `https://api.github.com/repos/${process.env.GH_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GH_TOKEN}`,
          'Accept': 'application/vnd.github.everest-preview+json',
          'Content-Type': 'application/json',
          'User-Agent': 'DigitalCatalogPro'
        },
        body: JSON.stringify({
          event_type: 'run-generator',
          client_payload: {
            trigger_source: 'vercel-web-interface',
            timestamp: new Date().toISOString()
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Error GitHub API:', errorData);
      throw new Error(errorData.message || 'Error al comunicarse con GitHub');
    }

    console.log('✅ GitHub Action disparado correctamente');
    return res.status(200).json({
      success: true,
      message: 'Generación iniciada con éxito',
      next_steps: 'Los cambios aparecerán en 2-3 minutos'
    });

  } catch (error) {
    console.error('🔥 Error crítico:', error);
    return res.status(500).json({
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        env: {
          GH_REPO: process.env.GH_REPO ? '✅ Configurado' : '❌ Faltante',
          GH_TOKEN: process.env.GH_TOKEN ? '✅ Configurado' : '❌ Faltante'
        }
      } : undefined
    });
  }
};
