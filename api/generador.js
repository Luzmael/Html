const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function fetchTemplate() {
  try {
    // Carga el template exacto que compartiste
    return fs.readFileSync(path.join(__dirname, '../base/index.html'), 'utf8');
  } catch (error) {
    throw new Error(`Error al leer plantilla: ${error.message}`);
  }
}

async function generateStores() {
  try {
    const template = await fetchTemplate();
    
    // 1. Obtener todos los datos necesarios
    const { 
      data: products, 
      error: productsError 
    } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        category,
        badge,
        images,
        video,
        sizes,
        colors,
        min_order
      `)
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;

    const { 
      data: settings, 
      error: settingsError 
    } = await supabase
      .from('app_settings')
      .select('rate, shipping_cost')
      .single();

    if (settingsError) throw settingsError;

    const { 
      data: whatsapp, 
      error: whatsappError 
    } = await supabase
      .from('whatsapp_numbers')
      .select('phone_number, uuid')
      .eq('is_active', true)
      .single();

    if (whatsappError) throw whatsappError;

    // 2. Validar datos esenciales
    if (!products || products.length === 0) {
      throw new Error('No se encontraron productos en la base de datos');
    }

    // 3. Generar HTML para cada tienda
    const storesDir = path.join(__dirname, '../public');
    const stores = fs.readdirSync(storesDir)
      .filter(folder => folder.startsWith('tienda'))
      .map(folder => ({
        name: folder,
        path: path.join(storesDir, folder)
      }));

    if (stores.length === 0) {
      throw new Error('No se encontraron carpetas de tiendas (deben llamarse "tienda*")');
    }

    // 4. Procesar cada tienda
    await Promise.all(stores.map(async (store) => {
      const finalHtml = template
        .replace(/<meta name="whatsapp-uuid" content="[^"]*">/, 
          `<meta name="whatsapp-uuid" content="${whatsapp.uuid}">`)
        .replace(/<meta name="html-name" content="[^"]*">/,
          `<meta name="html-name" content="${store.name}">`)
        .replace('<!-- PRODUCTS_PLACEHOLDER -->', 
          generateProductsHtml(products, settings.rate));

      fs.writeFileSync(
        path.join(store.path, 'index.html'), 
        finalHtml
      );
    });

    console.log(`🔄 ${stores.length} tiendas actualizadas con ${products.length} productos`);
    
  } catch (error) {
    console.error('🚨 Error crítico:', error);
    process.exit(1);
  }
}

// Función auxiliar para generar el HTML de productos (adaptado a tu template)
function generateProductsHtml(products, exchangeRate) {
  return products.map(product => {
    const priceInBs = (product.price * exchangeRate).toFixed(2);
    
    return `
      <div class="product-card">
        ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
        <div class="product-gallery">
          <!-- Aquí iría tu lógica compleja de galería -->
          <img src="${product.images?.[0] || 'placeholder.jpg'}" class="gallery-media">
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <span class="product-category">${product.category}</span>
          <div class="product-price">Bs ${priceInBs}</div>
          <!-- Resto de campos según tu template -->
        </div>
      </div>
    `;
  }).join('');
}

generateStores();
