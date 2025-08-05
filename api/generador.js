const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configura Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function generateStores() {
  console.log("🔄 Obteniendo productos...");
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true }); // Ordenar por nombre

  if (error) throw new Error(`Error Supabase: ${error.message}`);

  // Leer plantilla base
  const template = fs.readFileSync(path.join(__dirname, '../base/index.html'), 'utf8');
  const imagesDir = path.join(__dirname, '../public/products');

  // Procesar cada tienda
  const storesDir = path.join(__dirname, '../public');
  const stores = fs.readdirSync(storesDir).filter(folder => folder.startsWith('tienda'));

  stores.forEach(store => {
    let storeContent = template;
    
    // 1. Reemplazar metadatos
    storeContent = storeContent.replace(
      /<meta name="html-name" content=".*?">/,
      `<meta name="html-name" content="${store}">`
    );

    // 2. Insertar productos
    const productsHtml = products.map(product => {
      // Buscar imagen correspondiente (mismo nombre que el producto + .webp)
      const imageName = `${product.name.toLowerCase().replace(/\s+/g, '-')}.webp`;
      const imagePath = `/products/${imageName}`;
      
      return `
        <div class="product">
          <img src="${imagePath}" alt="${product.name}">
          <h3>${product.name}</h3>
          <p>Precio: ${product.price}</p>
        </div>
      `;
    }).join('');

    storeContent = storeContent.replace('<!-- PRODUCTS_PLACEHOLDER -->', productsHtml);

    // 3. Guardar archivo
    fs.writeFileSync(path.join(storesDir, store, 'index.html'), storeContent);
    console.log(`✅ ${store}/index.html generado con ${products.length} productos`);
  });
}

generateStores().catch(err => {
  console.error('💥 Error:', err);
  process.exit(1);
});
