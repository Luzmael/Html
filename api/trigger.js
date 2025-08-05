export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Verificar si ya hay una ejecución en progreso
    const statusRes = await fetch(
      `https://api.github.com/repos/${process.env.GH_REPO}/actions/runs?status=in_progress`,
      {
        headers: {
          'Authorization': `token ${process.env.GH_TOKEN}`,
          'Accept': 'application/vnd.github+json'
        }
      }
    );

    const { workflow_runs } = await statusRes.json();
    const hasRunning = workflow_runs.some(run => run.name === '🛠️ Generador de Tiendas Automático');

    if (hasRunning) {
      return res.status(429).json({ 
        error: 'El generador ya está en ejecución. Espere a que termine.' 
      });
    }

    // Disparar nuevo workflow
    const dispatchRes = await fetch(
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
            trigger_time: new Date().toISOString()
          }
        })
      }
    );

    if (!dispatchRes.ok) {
      const error = await dispatchRes.text();
      throw new Error(`GitHub API: ${error}`);
    }

    res.status(200).json({ 
      success: true,
      message: 'Generación iniciada. Los cambios aparecerán en 2-3 minutos.'
    });

  } catch (error) {
    console.error('Error en trigger:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
