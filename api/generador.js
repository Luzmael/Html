const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configura Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function generateStores() {
  console.log("📡 Conectando a Supabase...");
  const { data: products, error } = await supabase
    .from('products')
    .select('*');

  if (error) throw new Error(`Error Supabase: ${error.message}`);
  console.log(`✅ Obtenidos ${products.length} productos`);

  // Leer plantilla base
  const templatePath = path.join(__dirname, '../base/index.html');
  const template = fs.readFileSync(templatePath, 'utf8');

  // Generar archivos para cada tienda
  const publicDir = path.join(__dirname, '../public');
  const stores = fs.readdirSync(publicDir)
    .filter(folder => folder.startsWith('tienda'));

  stores.forEach(store => {
    const storePath = path.join(publicDir, store, 'index.html');
    const storeContent = template.replace(
      /<meta name="html-name" content=".*?">/,
      `<meta name="html-name" content="${store}">`
    );
    
    fs.writeFileSync(storePath, storeContent);
    console.log(`✨ Generado: public/${store}/index.html`);
  });
}

generateStores().catch(err => {
  console.error('💥 Error crítico:', err);
  process.exit(1);
});
