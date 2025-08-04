const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Inicializar Supabase desde archivo .env
const supabase = createClient(
  'https://bekzfacymgaytpgfqrzg.supabase.co',
  process.env.SUPABASE_KEY_PRIVADA
);

// Ruta base segura
const rutaBase = path.resolve(__dirname, '../');

// Cargar plantilla base
const baseHTML = fs.readFileSync(path.join(rutaBase, 'base', 'index.html'), 'utf8');

// Verificar y listar imágenes locales .webp
const obtenerImagenesLocales = () => {
  const rutaImagenes = path.join(rutaBase, 'public', 'productos');
  if (!fs.existsSync(rutaImagenes)) {
    console.warn(`⚠️ Carpeta de productos no encontrada: ${rutaImagenes}`);
    return [];
  }
  return fs.readdirSync(rutaImagenes)
    .filter(file => file.toLowerCase().endsWith('.webp'))
    .sort();
};

async function generarParaTiendas() {
  const rutaTiendas = path.join(rutaBase, 'public');
  const carpetas = fs.readdirSync(rutaTiendas, { withFileTypes: true })
    .filter(dir => dir.isDirectory() && dir.name.startsWith('tienda-'))
    .map(dir => dir.name);

  const imagenesLocales = obtenerImagenesLocales();

  for (const nombreTienda of carpetas) {
    console.log(`🧪 Generando catálogo para: ${nombreTienda}...`);

    const { data: productos, error } = await supabase
      .from('productos')
      .select('*')
      .ilike('nombre', `%`)
      .order('nombre', { ascending: true });

    if (error || !productos) {
      console.error(`❌ Error con Supabase: ${error?.message}`);
      continue;
    }

    const productosFiltrados = productos.filter(p =>
      p.descripcion?.toLowerCase().includes(nombreTienda.replace('tienda-', '').toLowerCase())
    );

    const htmlFinal = productosFiltrados.map((producto, i) => {
      const imagen = imagenesLocales[i] || 'placeholder.webp';
      return `
        <div class="product-card">
          <div class="product-gallery">
            <img src="/productos/${imagen}" alt="${producto.nombre}">
          </div>
          <div class="product-info">
            <h3 class="product-name">${producto.nombre}</h3>
            <span class="product-category">${producto.descripcion}</span>
            <div class="product-price">Bs ${parseFloat(producto.precio).toFixed(2)}</div>
          </div>
        </div>
      `;
    }).join('\n');

    const rutaHTML = path.join(rutaTiendas, nombreTienda, 'index.html');
    const htmlCompleto = baseHTML.replace('<!-- Products will load here -->', htmlFinal);
    fs.writeFileSync(rutaHTML, htmlCompleto);
    console.log(`✅ Generado correctamente: ${rutaHTML}`);
  }
}

generarParaTiendas();

