import supabase from './supabase'

export default async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .limit(1)

    if (error) throw error

    // Cache de 12 horas
    res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate')
    res.status(200).json(data[0] || {})
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al cargar configuración' })
  }
}
