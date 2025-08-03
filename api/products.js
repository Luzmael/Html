// products.js
import supabase from './supabase'

export default async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')

    if (error) throw error

    // Cache de 1 semana con revalidación de 1 hora
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=3600')
    res.status(200).json(data)
    
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Error al cargar productos' })
  }
}

