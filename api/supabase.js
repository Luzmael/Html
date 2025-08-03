import { createClient } from '@supabase/supabase-js'

// Conexión segura con variables de entorno
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default supabase
