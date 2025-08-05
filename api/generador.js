const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuración
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const BASE_DIR = path.join(__dirname, '..');
const PRODUCTS_IMG_DIR = '/products';

// Función mejorada para buscar imágenes
function getProductImage(productName) {
  const validName = productName
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const possibleNames = [
    `${validName}.webp`,
    `${validName.split('-')[0]}.webp`, // Intenta con la primera palabra
    'default.webp'
  ];

  for (const name of possibleNames) {
    const imgPath = path.join(BASE_DIR, 'public', PRODUCTS_IMG_DIR, name);
    if (fs.existsSync(imgPath)) {
      return `${PRODUCTS_IMG_DIR}/${name}`;
    }
  }

  return `${PRODUCTS_IMG_DIR}/default.webp`;
}

async function generateStores() {
  try {
    console.log('⏳ Iniciando generación de tiendas...');
    
    // 1. Cargar plantilla base
    const templatePath = path.join(BASE_DIR, 'base', 'index.html');
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // 2. Obtener datos de Supabase
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;
    if (!products?.length) throw new Error('No se encontraron productos');

    const { data: settings, error: settingsError } = await supabase
      .from('app_settings')
      .select('*')
      .single();

    if (settingsError) throw settingsError;

    const { data: whatsapp, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .select('*')
      .eq('is_active', true)
      .single();

    if (whatsappError) throw whatsappError;

    // 3. Procesar cada tienda
    const storesDir = path.join(BASE_DIR, 'public');
    const stores = fs.readdirSync(storesDir)
      .filter(folder => folder.startsWith('tienda'))
      .filter(folder => fs.statSync(path.join(storesDir, folder)).isDirectory());

    if (!stores.length) throw new Error('No se encontraron carpetas de tiendas');

    stores.forEach(store => {
      const storePath = path.join(storesDir, store);
      const productsHtml = products.map(product => `
        <div class="product-card">
          ${product.badge ? `<div class="product-badge">${product.badge}</div>` : ''}
          <div class="product-gallery">
            <img src="${getProductImage(product.name)}" class="gallery-media">
          </div>
          <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <span class="product-category">${product.category}</span>
            <div class="product-price">Bs ${(product.price * settings.rate).toFixed(2)}</div>
          </div>
        </div>
      `).join('');

      const finalHtml = template
        .replace(/<meta name="whatsapp-uuid" content="[^"]*">/, 
          `<meta name="whatsapp-uuid" content="${whatsapp.uuid}">`)
        .replace(/<meta name="html-name" content="[^"]*">/,
          `<meta name="html-name" content="${store}">`)
        .replace('<!-- PRODUCTS_PLACEHOLDER -->', productsHtml);

      fs.writeFileSync(path.join(storePath, 'index.html'), finalHtml);
    });

    console.log(`✅ ${stores.length} tiendas actualizadas con ${products.length} productos`);

  } catch (error) {
    console.error('🚨 Error crítico:', error);
    process.exit(1);
  }
}

generateStores();
