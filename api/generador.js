// generador.js
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuración
const BASE_DIR = path.join(__dirname, '..', 'main');
const PUBLIC_DIR = path.join(BASE_DIR, 'public');
const BASE_TEMPLATE = path.join(BASE_DIR, 'base', 'index.html');
const PRODUCTS_IMG_DIR = path.join(PUBLIC_DIR, 'products');
const STORES_PREFIX = 'tienda';
const IMAGE_EXTENSION = '.webp';

// Configuración de Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'your-supabase-key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Función principal
async function generateStoreFiles() {
    try {
        console.log('Iniciando generación de archivos para tiendas...');
        
        // 1. Leer el template base
        const templateContent = fs.readFileSync(BASE_TEMPLATE, 'utf8');
        console.log('Template base leído correctamente');
        
        // 2. Obtener todas las carpetas de tiendas
        const storeDirs = getStoreDirectories();
        if (storeDirs.length === 0) {
            console.log('No se encontraron carpetas de tiendas para procesar');
            return;
        }
        
        console.log(`Encontradas ${storeDirs.length} tiendas para procesar`);
        
        // 3. Obtener productos de Supabase
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });
            
        if (error) {
            throw new Error(`Error al obtener productos de Supabase: ${error.message}`);
        }
        
        if (!products || products.length === 0) {
            console.log('No se encontraron productos en Supabase');
            return;
        }
        
        console.log(`Obtenidos ${products.length} productos de Supabase`);
        
        // 4. Procesar cada tienda
        for (const storeDir of storeDirs) {
            await processStore(storeDir, templateContent, products);
        }
        
        console.log('Proceso completado exitosamente');
        
    } catch (error) {
        console.error('Error en el proceso principal:', error);
    }
}

// Obtener directorios de tiendas
function getStoreDirectories() {
    try {
        const allItems = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true });
        return allItems
            .filter(dirent => dirent.isDirectory() && dirent.name.startsWith(STORES_PREFIX))
            .map(dirent => path.join(PUBLIC_DIR, dirent.name));
    } catch (error) {
        console.error('Error al leer directorios de tiendas:', error);
        return [];
    }
}

// Procesar una tienda específica
async function processStore(storeDir, templateContent, products) {
    const storeName = path.basename(storeDir);
    console.log(`Procesando tienda: ${storeName}`);
    
    try {
        // 1. Crear el archivo index.html para la tienda
        const storeIndexPath = path.join(storeDir, 'index.html');
        
        // 2. Modificar el template para esta tienda específica
        let storeContent = templateContent;
        
        // Reemplazar metadatos específicos
        storeContent = storeContent.replace(
            /<meta name="html-name" content="[^"]*">/,
            `<meta name="html-name" content="${storeName}">`
        );
        
        // 3. Obtener imágenes locales para cada producto
        const productsWithLocalImages = products.map(product => {
            const localImages = findLocalImages(product.id);
            
            return {
                ...product,
                // Usar primera imagen como principal
                image: localImages.length > 0 ? `/products/${path.basename(localImages[0])}` : '',
                // Ordenar imágenes alfabéticamente
                images: localImages.slice(1).map(img => `/products/${path.basename(img)}`)
            };
        });
        
        // 4. Insertar datos de productos en el template
        // (Aquí necesitarías implementar la lógica específica para insertar los productos en el HTML)
        
        // 5. Escribir el archivo
        fs.writeFileSync(storeIndexPath, storeContent, 'utf8');
        console.log(`Archivo index.html creado para ${storeName}`);
        
    } catch (error) {
        console.error(`Error al procesar la tienda ${storeName}:`, error);
    }
}

// Buscar imágenes locales para un producto (ordenadas alfabéticamente)
function findLocalImages(productId) {
    try {
        const files = fs.readdirSync(PRODUCTS_IMG_DIR);
        
        // Filtrar imágenes que correspondan al producto
        const productImages = files
            .filter(file => {
                const fileName = path.basename(file, IMAGE_EXTENSION);
                return (
                    file.endsWith(IMAGE_EXTENSION) && (
                    fileName === productId.toString() ||
                    fileName.startsWith(`${productId}_`) ||
                    fileName.startsWith(`${productId}-`)
                );
            })
            // Ordenar alfabéticamente
            .sort((a, b) => a.localeCompare(b))
            .map(file => path.join(PRODUCTS_IMG_DIR, file));
        
        return productImages;
    } catch (error) {
        console.error('Error al buscar imágenes locales:', error);
        return [];
    }
}

// Programar ejecuciones (3 veces al día)
function scheduleExecutions() {
    // Ejecución inmediata
    generateStoreFiles();
    
    // Programar ejecuciones adicionales
    const intervals = [
        8 * 60 * 60 * 1000,  // 8 horas después
        16 * 60 * 60 * 1000   // 16 horas después
    ];
    
    intervals.forEach(interval => {
        setTimeout(() => {
            console.log(`\nEjecución programada a las ${new Date().toLocaleTimeString()}`);
            generateStoreFiles();
        }, interval);
    });
}

// Iniciar el programa
scheduleExecutions();

// Exportar funciones para testing
module.exports = {
    getStoreDirectories,
    findLocalImages,
    processStore
};
