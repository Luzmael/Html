// /api/image-proxy.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export const config = {
  runtime: 'edge', // Esto hace que funcione en Edge Network
}

export default async function handler(request) {
  try {
    const url = new URL(request.url)
    const imagePath = url.searchParams.get('path')
    
    if (!imagePath) {
      return new Response('Falta el parámetro "path"', { status: 400 })
    }

    // 1. Verificar si la imagen está en caché
    const cache = caches.default
    const cacheKey = new Request(url.toString(), request)
    let response = await cache.match(cacheKey)

    if (!response) {
      // 2. Si no está en caché, obtener de Supabase
      const { data, error } = await supabase.storage
        .from('product-images') // Ajusta este nombre al tuyo
        .createSignedUrl(imagePath, 3600) // URL válida por 1 hora

      if (error || !data?.signedUrl) {
        return new Response('Imagen no encontrada', { status: 404 })
      }

      // 3. Descargar la imagen desde Supabase
      const imageResponse = await fetch(data.signedUrl)
      
      if (!imageResponse.ok) {
        return new Response('Error al cargar imagen', { status: 500 })
      }

      // 4. Crear respuesta con cabeceras de caché
      response = new Response(imageResponse.body, {
        status: 200,
        headers: {
          'Content-Type': imageResponse.headers.get('Content-Type'),
          'Cache-Control': 'public, max-age=604800', // 1 semana en caché
          'CDN-Cache-Control': 'public, max-age=604800'
        }
      })

      // 5. Almacenar en caché para futuras peticiones
      context.waitUntil(cache.put(cacheKey, response.clone()))
    }

    return response
  } catch (error) {
    return new Response('Error interno', { status: 500 })
  }
}
