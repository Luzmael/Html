const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Función para buscar imágenes locales
function getLocalImage(productName) {
  const baseName = productName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  const imagePath = `/products/${baseName}.webp`;
  const localPath = path.join(__dirname, '../public', imagePath);

  return fs.existsSync(localPath) ? imagePath : '/products/default.webp';
}

async function generateStores() {
  try {
    // 1. Cargar plantilla base
    const template = fs.readFileSync(path.join(__dirname, '../base/index.html'), 'utf8');
    
    // 2. Obtener datos de Supabase
    const { data: products, error: productsError } = await supabase
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
        colors
      `)
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;
    if (!products || products.length === 0) throw new Error('No se encontraron productos');

    // 3. Obtener configuración
    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('rate, shipping_cost')
      .single();

    if (settingsError) throw settingsError;

    const { data: whatsapp, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .select('phone_number, uuid')
      .eq('is_active', true)
      .single();

    if (whatsappError) throw whatsappError;

    // 4. Procesar tiendas
    const storesDir = path.join(__dirname, '../public');
    const stores = fs.readdirSync(storesDir)
      .filter(folder => folder.startsWith('tienda') && fs.statSync(path.join(storesDir, folder)).isDirectory());

    if (stores.length === 0) throw new Error('No se encontraron carpetas de tiendas (deben llamarse "tienda*")');

    stores.forEach(store => {
      const storeHtml = template
        .replace(/<meta name="whatsapp-uuid" content="[^"]*">/, 
          `<meta name="whatsapp-uuid" content="${whatsapp.uuid}">`)
        .replace(/<meta name="html-name" content="[^"]*">/,
          `<meta name="html-name" content="${store}">`)
        .replace('<!-- PRODUCTS_PLACEHOLDER -->', generateProductsSection(products, settings.rate));

      fs.writeFileSync(path.join(storesDir, store, 'index.html'), storeHtml);
    });

    console.log(`🔄 ${stores.length} tiendas actualizadas con ${products.length} productos`);

  } catch (error) {
    console.error('🚨 Error:', error);
    process.exit(1);
  }
}

function generateProductsSection(products, exchangeRate) {
  return products.map(product => {
    const mainImage = getLocalImage(product.name);
    const priceInBs = (product.price * exchangeRate).toFixed(2);

    return `
      <div class="product-card">
        ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
        <div class="product-gallery">
          <img src="${mainImage}" class="gallery-media">
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <span class="product-category">${product.category}</span>
          <div class="product-price">Bs ${priceInBs}</div>
          <div class="product-description">${product.description}</div>
        </div>
      </div>
    `;
  }).join('');
}

generateStores();
