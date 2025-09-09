/* ====== CONFIG ====== */
let API_URL = "https://TU-SERVICIO-EJEMPLO/api/precios";  // <-- tu endpoint real (JSON o CSV)
const WA_NUMBER = "54911XXXXXXXX";                        // <-- tu WhatsApp en formato E.164 SIN '+'
const STORE_NAME = "Corbalac";
const FIELD_MAP = { name: null, price: null, category: null, unit: null, image: null };
const qs = new URLSearchParams(location.search);
if (qs.get("api")) API_URL = qs.get("api");

/* ====== WHATSAPP ====== */
function waContactLink(customText) {
  const today = new Date().toLocaleDateString('es-AR');
  const text = customText || `*NUEVO PEDIDO* - ${today}

Hola ${STORE_NAME}, por favor necesito realizar el siguiente pedido:

*Producto* | *Cantidad* | *Observaciones*
--------------------------------
Ej: Jamón Cocido | 1 kg | Sin sal
Ej: Queso Tybo | 2 kg | 

*Datos de entrega:*
- Nombre: 
- Dirección: 
- Teléfono: 
- Horario de entrega: 

*Forma de pago:*
- Efectivo
- Transferencia
- Otro (especificar): 

¡Muchas gracias!`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

/* ====== CATÁLOGO ====== */
const $search  = document.getElementById('search');
const $grid    = document.getElementById('grid');
const $updated = document.getElementById('updatedAt');

function fmtMoney(n) {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
  } catch { return `$${n}`; }
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
    const resHead = await fetch(API_URL, { method: 'HEAD' }).catch(() => null);
    const lastModified = resHead?.headers?.get('last-modified');

    const dataRes = await fetch(API_URL);
    if (!dataRes.ok) throw new Error('Error al cargar los productos');

    let data = await dataRes.json();
    if (data.data) data = data.data;

    const target = document.getElementById('updatedAt');
    if (target) {
      if (lastModified) {
        const lastUpdate = new Date(lastModified);
        target.textContent = lastUpdate.toLocaleString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      } else {
        target.textContent = new Date().toLocaleString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
      }
    }

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
  if (!$grid) return; // si no existe grilla en esta página, salir

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

/* ====== PDF GENERATION ====== */
async function generatePDF(products) {
  try {
    const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(44, 44, 44);
    doc.text(`Lista de Precios - ${STORE_NAME}`, 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 105, 22, { align: 'center' });

    let y = 35;
    const grouped = {};
    products.forEach(p => {
      const cat = p.category || 'Sin categoría';
      (grouped[cat] ||= []).push(p);
    });

    for (const [category, items] of Object.entries(grouped)) {
      if (y > 250) { doc.addPage(); y = 20; }

      doc.setFontSize(14);
      doc.setTextColor(44, 44, 44);
      doc.setFont('helvetica', 'bold');
      doc.text(category, 14, y); y += 8;

      doc.setDrawColor(246, 224, 141);
      doc.setLineWidth(0.5);
      doc.line(14, y, 196, y); y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      items.forEach(item => {
        if (y > 270) { doc.addPage(); y = 20; }

        doc.setTextColor(0, 0, 0);
        doc.text(item.name, 20, y);

        const price = fmtMoney(item.price);
        const priceWidth = doc.getStringUnitWidth(price) * doc.getFontSize() / doc.internal.scaleFactor;
        doc.text(price, 196 - priceWidth, y);

        doc.setTextColor(100, 100, 100);
        doc.text(`/${item.unit || 'unidad'}`, 196 - priceWidth - 25, y);
        y += 7;
      });

      y += 5;
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('© ' + new Date().getFullYear() + ' ' + STORE_NAME + ' - Todos los derechos reservados', 105, 287, { align: 'center' });

    doc.save(`Lista-de-Precios-${STORE_NAME}-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    alert('Error al generar el PDF. Por favor, intente nuevamente.');
  }
}

// Compartir por WhatsApp (catálogo)
function shareOnWhatsApp(event) {
  event.preventDefault();
  const message = encodeURIComponent('Hola, te comparto la lista de precios de Corbalac:');
  const pdfUrl = encodeURIComponent(window.location.origin + '/assets/pdfs/lista-precios-corbalac.pdf');
  window.open(`https://wa.me/?text=${message}%20${pdfUrl}`, '_blank');
}

/* ====== SANDWICH MENU ====== */
function setupDailySpecial() {
  const specials = [
    { name: 'Milanesa Clásica',      description: '¡Todos los Lunes!',     price: '2,880', originalPrice: '3,200', discount: '10%' },
    { name: 'Jamón Crudo y Queso',   description: '¡Todos los Martes!',    price: '3,150', originalPrice: '3,500', discount: '10%' },
    { name: 'Pollo Grillado',        description: '¡Miércoles de Pollo!',  price: '2,790', originalPrice: '3,100', discount: '10%' },
    { name: 'Vegetariano Especial',  description: '¡Jueves Verde!',        price: '2,970', originalPrice: '3,300', discount: '10%' },
    { name: 'Milanesa Napolitana',   description: '¡Viernes de Milanesa!', price: '3,150', originalPrice: '3,500', discount: '10%' },
    { name: 'Lomito Completo',       description: '¡Sábado Especial!',     price: '3,510', originalPrice: '3,900', discount: '10%' },
    { name: 'Sandwich de Bondiola',  description: '¡Domingo Familiar!',    price: '3,240', originalPrice: '3,600', discount: '10%' }
  ];

  const todaySpecial = specials[new Date().getDay()];
  const specialElement = document.getElementById('specialItem');
  if (specialElement) {
    specialElement.innerHTML = `
      <p class="font-medium">${todaySpecial.name} - <span class="text-amber-600">${todaySpecial.description}</span></p>
      <p class="text-sm">Precio especial: <span class="line-through text-gray-500">$${todaySpecial.originalPrice}</span> <span class="font-bold">$${todaySpecial.price}</span> (${todaySpecial.discount} OFF)</p>
    `;
  }

  const menuItems = document.querySelectorAll('.sandwich-item');
  menuItems.forEach(item => {
    const title = item.querySelector('h4');
    if (title && title.textContent.includes(todaySpecial.name)) {
      item.classList.add('ring-2', 'ring-amber-400');
      const cash = item.querySelector('.text-green-600');
      if (cash) cash.classList.add('font-bold', 'text-base');
    }
  });
}

// Botón flotante de WhatsApp
function initWhatsAppButton() {
  const whatsappBtn = document.createElement('a');
  whatsappBtn.href = 'https://wa.me/5491164170916?text=' + encodeURIComponent(
    'Hola Corbalac, quisiera hacer un pedido de sándwiches:\n\n' +
    '*Sabor*: \n' +
    '*Cantidad*: \n' +
    '*Dirección*: \n' +
    '*Horario*: \n\n' +
    '🍔🍟 ¡Gracias!'
  );
  whatsappBtn.target = '_blank';
  whatsappBtn.className = 'whatsapp-button';
  whatsappBtn.innerHTML = `
    <i class="fab fa-whatsapp"></i>
    <span class="whatsapp-notification">!</span>
  `;
  whatsappBtn.addEventListener('mouseenter', function(){ this.classList.add('float-animation'); });
  whatsappBtn.addEventListener('mouseleave', function(){ this.classList.remove('float-animation'); });
  document.body.appendChild(whatsappBtn);
}

/* ====== NAVBAR: efecto "pill/notch" ====== */
function initNavPill() {
  const host = document.querySelector('#mainNav .fx-nav');
  if (!host) return;

  const notch = host.querySelector('.fx-notch');
  const items = Array.from(host.querySelectorAll('.fx-item'));

  function moveTo(el){
    const nb = host.getBoundingClientRect();
    const b  = el.getBoundingClientRect();
    const x  = (b.left - nb.left) + host.scrollLeft; // soporta overflow-x
    notch.style.setProperty('--x', x + 'px');
    notch.style.setProperty('--w', b.width + 'px');
    items.forEach(a => a.classList.remove('active'));
    el.classList.add('active');
  }

  // Inicial (por hash si coincide, o primer link)
  const initial = items.find(a => a.getAttribute('href') === location.hash) || items[0];
  if (initial) moveTo(initial);

  // Click
  items.forEach(a => a.addEventListener('click', () => moveTo(a)));

  // Resize/reflow
  window.addEventListener('resize', () => {
    const active = host.querySelector('.fx-item.active') || items[0];
    if (active) moveTo(active);
  });
}

/* ====== Inicialización ====== */
(async () => {
  if (document.getElementById('sandwiches')) setupDailySpecial();
  initWhatsAppButton();

  if (document.getElementById("waBtn")) {
    document.getElementById("waBtn").href = waContactLink();
  }
  const shareBtn = document.getElementById("shareCatalog");
  if (shareBtn) shareBtn.addEventListener('click', shareOnWhatsApp);

  // Año del footer
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Productos (solo si hay grilla/buscador en esta página)
  const data = await fetchProducts();
  if ($grid) render(data);

  const dl = document.getElementById('downloadPdf');
  if (dl) {
    dl.addEventListener('click', (e) => {
      e.preventDefault();
      generatePDF(data);
    });
  }

  if ($search) {
    $search.addEventListener('input', (e) => render(data, e.target.value));
  }

  // Smooth scroll nav (manteniendo tu offset de header)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        window.scrollTo({ top: targetElement.offsetTop - 80, behavior: 'smooth' });
      }
    });
  });

  // Navbar animación
  initNavPill();
})();
