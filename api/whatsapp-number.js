import supabase from './supabase'; // Asegúrate de que la ruta sea correcta

export default async (req, res) => {
  // Extrae el parámetro de la URL (ej: /api/whatsapp-number?url=tienda-miami)
  const { url } = req.query;

  // Consulta a Supabase usando la URL única
  const { data, error } = await supabase
    .from('whatsapp_numbers')
    .select('phone_number')
    .eq('url_unica', url)  // Filtra por la columna nueva
    .eq('is_active', true)
    .single();

  if (error) {
    return res.status(404).json({ error: 'Tienda no encontrada' });
  }

  // Cachea la respuesta por 1 día (86400 segundos)
  res.setHeader('Cache-Control', 's-maxage=86400');
  res.status(200).json({ whatsapp: data.phone_number });
};
