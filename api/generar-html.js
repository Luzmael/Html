const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const baseHTML = fs.readFileSync('html/base/index.html', 'utf8');
const supabase = createClient('https://bekzfacymgaytpgfqrzg.supabase.co', 'SUPABASE_KEY_PRIVADA');

async function generarParaTiendas() {
  const carpetas = fs.readdirSync('html/public', { withFileTypes: true })
    .filter(dir => dir.isDirectory() && dir.name.startsWith('tienda-'))
    .map(dir => dir.name);

  const imagenesLocales = (() => {
    try {
      return fs.readdirSync(path.join('html/public', 'productos'))
        .filter(file => file.toLowerCase().endsWith('.webp'))
        .sort();
    } catch (err) {
      console.warn('⚠️ Carpeta productos no encontrada o vacía:', err.message);
      return [];
    }
  })();

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

    const productosFiltrados = productos.filter(p => {
      return p.descripcion?.toLowerCase().includes(nombreTienda.replace('tienda-', '').toLowerCase());
    });

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

    const htmlCompleto = baseHTML.replace('<!-- Products will load here -->', htmlFinal);
    const rutaDestino = path.join('html/public', nombreTienda, 'index.html');
    fs.writeFileSync(rutaDestino, htmlCompleto);
    console.log(`✅ Generado correctamente: ${rutaDestino}`);
  }
}

generarParaTiendas();

