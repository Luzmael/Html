const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Función para convertir nombre a formato imagen
function getImagePath(productName) {
    const baseName = productName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    return `/products/${baseName}.webp`;
}

async function generateStores() {
    try {
        // 1. Cargar plantilla base
        const template = fs.readFileSync(path.join(__dirname, '../base/index.html'), 'utf8');
        
        // 2. Obtener datos de Supabase
        const { data: products } = await supabase
            .from('products')
            .select('id, name, description, price, category, stock, min_order, badge')
            .order('created_at', { ascending: false });

        const { data: settings } = await supabase.from('app_settings').select('*').single();
        const { data: whatsapp } = await supabase
            .from('whatsapp_numbers')
            .select('phone_number')
            .eq('is_active', true)
            .single();

        // 3. Generar HTML de productos (manteniendo tu estructura exacta)
        let productsHtml = '';
        products.forEach(product => {
            productsHtml += `
                <div class="product-card">
                    <div class="product-badge">${product.badge || ''}</div>
                    <img src="${getImagePath(product.name)}" alt="${product.name}" class="product-image">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-price">Bs ${(product.price * settings.rate).toFixed(2)}</div>
                    <div class="product-meta">
                        <span class="category">${product.category}</span>
                        <span class="stock">${product.stock > 0 ? 'Disponible' : 'Agotado'}</span>
                    </div>
                </div>
            `;
        });

        // 4. Reemplazar en la plantilla
        let finalHtml = template
            .replace('<!-- PRODUCTS_PLACEHOLDER -->', productsHtml)
            .replace('%%%WHATSAPP_NUMBER%%%', whatsapp?.phone_number || '')
            .replace('%%%EXCHANGE_RATE%%%', settings?.rate || '1.0');

        // 5. Guardar en cada tienda
        const storesDir = path.join(__dirname, '../public');
        const stores = fs.readdirSync(storesDir).filter(folder => folder.startsWith('tienda'));
        
        stores.forEach(store => {
            fs.writeFileSync(path.join(storesDir, store, 'index.html'), finalHtml);
            console.log(`✅ ${store}/index.html generado con ${products.length} productos`);
        });

    } catch (error) {
        console.error('🚨 Error:', error);
        process.exit(1);
    }
}

generateStores();
