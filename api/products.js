// 1. Importa el cliente de Supabase
import { createClient } from '@supabase/supabase-js';

// 2. Configura el cliente Supabase (usa variables de entorno)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// 3. Función principal de la API
export default async function handler(req, res) {
  try {
    // 4. Consulta todos los productos en Supabase
    const { data, error } = await supabase
      .from('products')
      .select('*');

    if (error) throw error;

    // 5. Configura el caché (1 hora = 3600 segundos)
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    
    // 6. Devuelve los datos en JSON
    res.status(200).json(data);
  } catch (error) {
    // 7. Manejo de errores
    res.status(500).json({ error: 'Error al cargar productos' });
  }
}
