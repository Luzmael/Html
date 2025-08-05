const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configura Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function generateStores() {
    // 1. Cargar plantilla base
    const templatePath = path.join(__dirname, '../base/index.html');
    let html = fs.readFileSync(templatePath, 'utf8');

    // 2. Obtener datos dinámicos
    const { data: settings } = await supabase.from('app_settings').select('*').single();
    const { data: products } = await supabase.from('products').select('*');
    const whatsapp = settings?.whatsapp_number || '549123456789';

    // 3. Reemplazar marcadores globales
    html = html.replace(/%%%WHATSAPP_NUMBER%%%/g, whatsapp);

    // 4. Generar HTML de productos
    const productsHtml = products.map(product => {
        const imagePath = `/products/${product.slug}.webp`; // Ej: "camisa-roja.webp"
        
        return `
            <div class="product" data-id="${product.id}">
                <img src="${imagePath}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">${product.price} ${product.currency}</p>
                <p class="description">${product.description}</p>
            </div>
        `;
    }).join('');

    // 5. Insertar productos en placeholder
    html = html.replace('<!-- PRODUCTS_PLACEHOLDER -->', productsHtml);

    // 6. Guardar en cada tienda
    const storesDir = path.join(__dirname, '../public');
    const stores = fs.readdirSync(storesDir).filter(folder => folder.startsWith('tienda'));
    
    stores.forEach(store => {
        fs.writeFileSync(path.join(storesDir, store, 'index.html'), html);
        console.log(`✅ ${store}/index.html generado`);
    });
}

generateStores().catch(err => {
    console.error('💥 Error:', err);
    process.exit(1);
});
