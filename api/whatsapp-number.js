import supabase from './supabase'

export default async (req, res) => {
  try {
    const { uuid } = req.query
    if (!uuid) return res.status(400).json({ error: 'UUID requerido' })

    const { data, error } = await supabase
      .from('whatsapp_numbers')
      .select('phone_number, is_active')
      .eq('id', uuid)
      .single()

    if (error) throw error

    // Cache de 24 horas (cambia raramente)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    res.status(200).json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al obtener número' })
  }
}
