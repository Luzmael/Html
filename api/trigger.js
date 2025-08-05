export default async (req, res) => {
  // 1. Solo permitir método POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      error: 'Método no permitido',
      allowed_methods: ['POST']
    });
  }

  // 2. Validar cabeceras CORS (si es necesario)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 3. Manejar preflight para CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 4. Configurar cliente GitHub
    const repo = process.env.GH_REPO; // Formato: usuario/repo
    const token = process.env.GH_TOKEN;

    if (!repo || !token) {
      throw new Error('Configuración de GitHub incompleta');
    }

    // 5. Disparar el workflow
    const response = await fetch(
      `https://api.github.com/repos/${repo}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.everest-preview+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'run-generator',
          client_payload: {
            trigger_source: 'web-interface'
          }
        })
      }
    );

    if (!response.ok) {
      const errorDetails = await response.text();
      throw new Error(`GitHub API: ${errorDetails}`);
    }

    // 6. Respuesta exitosa
    return res.status(200).json({
      success: true,
      message: 'Workflow disparado exitosamente',
      repo: repo
    });

  } catch (error) {
    console.error('Error en trigger:', error);
    return res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
