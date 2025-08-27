/* ====== CONFIG ====== */
let API_URL = "https://TU-SERVICIO-EJEMPLO/api/precios";  // <-- tu endpoint real (JSON o CSV)
const WA_NUMBER = "54911XXXXXXXX";                        // <-- tu WhatsApp en formato E.164 SIN '+'
const STORE_NAME = "Corbalac";
const FIELD_MAP = { name: null, price: null, category: null, unit: null, image: null };
const qs = new URLSearchParams(location.search);
if (qs.get("api")) API_URL = qs.get("api");

/* ====== WHATSAPP ====== */
function waContactLink(customText) {
  const text = customText || `Hola ${STORE_NAME}, quiero consultar el listado de precios / hacer un pedido.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

/* ====== CARRUSEL ====== */
(function(){
  const items = Array.from(document.querySelectorAll('.carousel-item'));
  const dots = Array.from(document.querySelectorAll('.dot'));
  let idx = 0;
  let interval = setInterval(nextSlide, 5000); // Cambio automático cada 5 segundos
  
  function show(i) {
    // Detener el intervalo cuando el usuario interactúa manualmente
    clearInterval(interval);
    
    // Actualizar la visualización
    items.forEach(el => { 
      el.classList.remove('active', 'hidden');
      el.classList.add('hidden');
    });
    
    items[i].classList.remove('hidden');
    setTimeout(() => items[i].classList.add('active'), 10);
    
    // Actualizar indicadores
    dots.forEach((d, index) => {
      d.classList.toggle('bg-white', index === i);
      d.classList.toggle('w-3', true);
      d.classList.toggle('h-3', true);
      if (index === i) {
        d.classList.add('w-4', 'h-4');
      }
    });
    
    idx = i;
    
    // Reiniciar el intervalo
    clearInterval(interval);
    interval = setInterval(nextSlide, 5000);
  }
  
  function nextSlide() {
    show((idx + 1) % items.length);
  }
  
  function prevSlide() {
    show((idx - 1 + items.length) % items.length);
  }
  
  // Event listeners para controles
  document.getElementById('prev').addEventListener('click', prevSlide);
  document.getElementById('next').addEventListener('click', nextSlide);
  
  // Event listeners para indicadores
  dots.forEach((dot, i) => {
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      show(i);
    });
  });
  
  // Iniciar el carrusel
  show(0);
  
  // Pausar el carrusel al pasar el ratón
  const carousel = document.querySelector('#carousel .relative');
  carousel.addEventListener('mouseenter', () => clearInterval(interval));
  carousel.addEventListener('mouseleave', () => {
    clearInterval(interval);
    interval = setInterval(nextSlide, 5000);
  });
})();

/* ====== CATÁLOGO ====== */
const $search = document.getElementById('search');
const $grid = document.getElementById('grid');
const $updated = document.getElementById('updatedAt');

function fmtMoney(n) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
}

function normalize(items) {
  return items.map(item => {
    const obj = {};
    for (const [key, value] of Object.entries(FIELD_MAP)) {
      const k = value || key;
      obj[key] = item[k] || '';
    }
    return obj;
  });
}

async function fetchProducts() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al cargar los productos');
    
    let data = await res.json();
    if (data.data) data = data.data; // Si la respuesta tiene un objeto data
    
    // Si es un array de objetos, normalizar los campos
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      return normalize(data);
    }
    
    return [];
  } catch (err) {
    console.error('Error:', err);
    return [];
  }
}

function render(products, query = '') {
  if (!products || products.length === 0) {
    $grid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No se encontraron productos</div>';
    return;
  }

  const q = query.toLowerCase().trim();
  const filtered = q === '' 
    ? products 
    : products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.category && p.category.toLowerCase().includes(q))
      );

  if (filtered.length === 0) {
    $grid.innerHTML = `<div class="col-span-full text-center py-8 text-gray-500">No hay resultados para "${q}"</div>`;
    return;
  }

  $grid.innerHTML = filtered.map(p => `
    <div class="product-card bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300">
      <div class="h-48 bg-gray-100 overflow-hidden">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover">` : 
          `<div class="w-full h-full flex items-center justify-center text-gray-400">
            <i class="fas fa-image text-4xl"></i>
          </div>`}
      </div>
      <div class="p-4">
        <h4 class="font-semibold text-lg mb-1">${p.name}</h4>
        ${p.category ? `<p class="text-sm text-gray-500 mb-2">${p.category}</p>` : ''}
        <div class="flex justify-between items-center mt-3">
          <span class="text-brand-dark font-bold">${fmtMoney(p.price)}</span>
          <span class="text-sm text-gray-500">${p.unit || 'unidad'}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// Inicialización
(async () => {
  // Configuración de WhatsApp
  document.getElementById("waBtn").href = waContactLink();
  document.getElementById("shareBtn").href = `https://wa.me/?text=${encodeURIComponent(`Lista de precios – ${STORE_NAME}: ${location.href}`)}`;
  
  // Actualizar año del footer
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Cargar y mostrar productos
  const data = await fetchProducts();
  render(data);
  
  // Configurar búsqueda
  $search.addEventListener('input', (e) => {
    render(data, e.target.value);
  });
  
  // Actualizar fecha de actualización
  $updated.textContent = new Date().toLocaleString('es-AR', { 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
})();
