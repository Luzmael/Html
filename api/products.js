import supabase from './supabase'

export default async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')

    if (error) throw error

    // Cache de 1 hora + fondo de actualización
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600')
    res.status(200).json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al cargar productos' })
  }
}
