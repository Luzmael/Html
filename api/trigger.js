export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Verificar si el generador ya está en ejecución (opcional)
    const statusResponse = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO}/actions/runs`,
      {
        headers: {
          'Authorization': `token ${process.env.GH_TOKEN}`,
          'Accept': 'application/vnd.github+json'
        }
      }
    );
    
    const { workflow_runs } = await statusResponse.json();
    const running = workflow_runs.some(run => 
      run.status === 'in_progress' && 
      run.name === '🛠️ Generador de Tiendas'
    );

    if (running) {
      return res.status(429).json({ 
        error: 'El generador ya está en ejecución. Por favor espera.' 
      });
    }

    // Disparar el workflow
    const dispatchResponse = await fetch(
      `https://api.github.com/repos/${process.env.GITHUB_REPO}/dispatches`,
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
            triggered_by: req.headers['x-forwarded-for'] || req.connection.remoteAddress
          }
        })
      }
    );

    if (!dispatchResponse.ok) {
      const errorText = await dispatchResponse.text();
      console.error('GitHub API Error:', errorText);
      throw new Error('Error al comunicarse con GitHub');
    }

    res.status(202).json({ 
      success: true,
      message: 'Generación iniciada. Los cambios aparecerán en 1-2 minutos.'
    });

  } catch (error) {
    console.error('Trigger Error:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
