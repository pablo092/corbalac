/* ====== CONFIG ====== */
let API_URL = "https://TU-SERVICIO-EJEMPLO/api/precios";  // <-- tu endpoint real (JSON o CSV)
const WA_NUMBER = "5491164170916";                        // Número oficial de Corbalac en formato E.164 SIN '+'
const STORE_NAME = "Corbalac";
const CASH_DISCOUNT = 0.10; // 10% de descuento en efectivo
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
const $sandwichGrid = document.getElementById('sandwich-grid');

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

// Render dinámico de sándwiches a partir de window.SANDWICHES
function renderSandwiches(items) {
  if (!$sandwichGrid || !Array.isArray(items)) return;
  $sandwichGrid.innerHTML = items.map(item => {
    const icon = item.icon || 'fas fa-hamburger';
    const badge = item.badge || '';
    const price = typeof item.price === 'number' ? fmtMoney(item.price) : item.price;
    const hasNumericPrice = typeof item.price === 'number' && !isNaN(item.price);
    const cashPrice = hasNumericPrice ? fmtMoney(item.price * (1 - CASH_DISCOUNT)) : null;
    return `
      <div class="sandwich-item bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100" data-category="${item.category}">
        <div class="h-48 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
          <i class="${icon} text-6xl text-amber-400"></i>
        </div>
        <div class="p-5">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-xl font-bold text-gray-900">${item.name}</h3>
            ${badge ? `<span class="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-0.5 rounded-full">${badge}</span>` : ''}
          </div>
          <p class="text-gray-600 text-sm mb-4">${item.description || ''}</p>
          <div class="flex items-center justify-between">
            <div class="flex items-baseline gap-2">
              <span class="text-lg font-bold text-gray-900">${price}</span>
              <span class="text-xs text-gray-500">/unidad</span>
              ${cashPrice ? `<span class="text-sm text-green-600" title="Precio en efectivo">${cashPrice} en efectivo (-${Math.round(CASH_DISCOUNT*100)}%)</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
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
  const pdfUrl = window.location.origin + '/assets/pdfs/lista-precios-corbalac.pdf';
  const msg = `Hola, te comparto la lista de precios de Corbalac:\n${pdfUrl}`;
  window.open(waContactLink(msg), '_blank');
}

// Abrir WhatsApp para solicitar cotización de catering
function openCateringWhatsapp(event) {
  if (event) event.preventDefault();
  const today = new Date().toLocaleDateString('es-AR');
  const msg = `*Solicitud de Cotización - Servicio de Catering* (${today})\n\n` +
    `Hola ${STORE_NAME}, me gustaría solicitar una cotización para un evento:\n\n` +
    `*Tipo de evento*: \n` +
    `*Fecha y horario*: \n` +
    `*Cantidad de personas*: \n` +
    `*Lugar / Dirección*: \n` +
    `*Preferencias/Observaciones*: (ej. vegetarianos, sin TACC, bebidas, postres, etc.)\n\n` +
    `¿Podrían enviarme opciones de menú y precios? ¡Gracias!`;
  window.open(waContactLink(msg), '_blank');
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

// Filtros para sección de Sándwiches (global)
function initCategoryFilters() {
  const filterButtons = document.querySelectorAll('.category-filter');
  const sandwichItems = document.querySelectorAll('.sandwich-item');

  if (!filterButtons.length || !sandwichItems.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setActiveButton(activeBtn) {
    filterButtons.forEach(btn => {
      const isActive = btn === activeBtn;
      btn.setAttribute('aria-pressed', String(isActive));
      btn.tabIndex = isActive ? 0 : -1;
      if (isActive) {
        btn.classList.remove('bg-gray-100', 'text-gray-800', 'hover:bg-gray-200');
        btn.classList.add('bg-amber-500', 'text-white');
      } else {
        btn.classList.remove('bg-amber-500', 'text-white');
        btn.classList.add('bg-gray-100', 'text-gray-800', 'hover:bg-gray-200');
      }
    });
  }

  function applyFilter(category) {
    sandwichItems.forEach(item => {
      const show = (category === 'todos' || item.dataset.category === category);
      if (show) {
        item.classList.remove('hidden');
        if (!prefersReduced) item.style.animation = 'fadeIn 0.5s ease-in-out';
      } else {
        if (!prefersReduced) item.style.animation = 'fadeOut 0.25s ease-in-out';
        setTimeout(() => { item.classList.add('hidden'); }, prefersReduced ? 0 : 200);
      }
    });
  }

  // Default active: "todos" si existe, sino el primero
  const defaultBtn = Array.from(filterButtons).find(b => b.dataset.category === 'todos') || filterButtons[0];
  if (defaultBtn) {
    setActiveButton(defaultBtn);
    applyFilter(defaultBtn.dataset.category);
  }

  filterButtons.forEach(button => {
    // Inicializar atributos ARIA/rol si faltan
    if (!button.hasAttribute('role')) button.setAttribute('role', 'tab');
    if (!button.hasAttribute('aria-pressed')) button.setAttribute('aria-pressed', 'false');
    if (!button.hasAttribute('tabindex')) button.tabIndex = -1;

    button.addEventListener('click', () => {
      setActiveButton(button);
      applyFilter(button.dataset.category);
    });

    // Navegación por teclado (flechas y Home/End)
    button.addEventListener('keydown', (e) => {
      const idx = Array.from(filterButtons).indexOf(button);
      let nextIdx = idx;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % filterButtons.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + filterButtons.length) % filterButtons.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = filterButtons.length - 1;
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setActiveButton(button);
        applyFilter(button.dataset.category);
        return;
      } else { return; }
      e.preventDefault();
      const target = filterButtons[nextIdx];
      target.focus();
      setActiveButton(target);
      applyFilter(target.dataset.category);
    });
  });
}

// Botón flotante de WhatsApp
function initWhatsAppButton() {
  const whatsappBtn = document.createElement('a');
  const defaultMsg = 'Hola Corbalac, quisiera hacer una consulta:';
  whatsappBtn.href = waContactLink(defaultMsg);
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

// Navegación rápida móvil (botón flotante)
function initMobileQuickNav() {
  const toggle = document.getElementById('mqn-toggle');
  const panel = document.getElementById('mqn-panel');
  if (!toggle || !panel) return;

  function open() {
    panel.classList.remove('hidden');
    toggle.setAttribute('aria-expanded', 'true');
    const firstItem = panel.querySelector('a');
    if (firstItem) firstItem.focus();
    document.addEventListener('click', onDocClick, { capture: true });
    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    panel.classList.add('hidden');
    toggle.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onDocClick, { capture: true });
    document.removeEventListener('keydown', onKeydown);
  }

  function onDocClick(e) {
    if (!panel.contains(e.target) && e.target !== toggle) close();
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      close();
      toggle.focus();
    }
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    if (expanded) close(); else open();
  });

  panel.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => {
      close();
    });
  });
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

/* ====== Product Filtering ====== */
function initProductFiltering() {
  const filterButtons = document.querySelectorAll('.category-filter');
  const productCards = document.querySelectorAll('.product-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active state
      filterButtons.forEach(btn => {
        btn.classList.remove('bg-amber-500', 'text-white');
        btn.classList.add('bg-white', 'border', 'hover:bg-gray-50', 'text-gray-700');
      });
      button.classList.remove('bg-white', 'border', 'hover:bg-gray-50', 'text-gray-700');
      button.classList.add('bg-amber-500', 'text-white');

      // Filter products
      const category = button.dataset.category;
      productCards.forEach(card => {
        if (category === 'todos' || card.dataset.category === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ====== Shopping Cart ====== */
let cart = [];

function updateCartUI() {
  const cartCount = document.getElementById('cart-count');
  const cartBadge = document.getElementById('cart-badge');
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
 
  // Si la UI del carrito no existe en esta página, salir sin errores
  if (!cartCount || !cartBadge || !cartItems || !cartTotal || !checkoutBtn) {
    return;
  }
  
  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="text-gray-500 text-center py-4">Tu carrito está vacío</p>';
    cartCount.textContent = '0';
    cartBadge.classList.add('hidden');
    checkoutBtn.disabled = true;
    cartTotal.textContent = '$0';
    return;
  }

  // Update cart items list
  cartItems.innerHTML = '';
  let total = 0;
  
  const groupedItems = cart.reduce((acc, item) => {
    const key = `${item.name}-${item.price}`;
    if (!acc[key]) {
      acc[key] = { ...item, quantity: 1 };
    } else {
      acc[key].quantity += 1;
    }
    return acc;
  }, {});

  Object.values(groupedItems).forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    
    const itemElement = document.createElement('div');
    itemElement.className = 'flex justify-between items-center py-3 border-b border-gray-100';
    itemElement.innerHTML = `
      <div class="flex-1">
        <p class="font-medium text-gray-800">${item.name}</p>
        <p class="text-sm text-gray-500">${fmtMoney(item.price)} c/u</p>
      </div>
      <div class="flex items-center">
        <button class="decrease-item text-gray-500 hover:text-amber-600 p-1" data-name="${item.name}" data-price="${item.price}">
          <i class="fas fa-minus text-xs"></i>
        </button>
        <span class="mx-2 w-6 text-center">${item.quantity}</span>
        <button class="increase-item text-gray-500 hover:text-amber-600 p-1" data-name="${item.name}" data-price="${item.price}">
          <i class="fas fa-plus text-xs"></i>
        </button>
        <span class="ml-4 w-20 text-right font-medium">${fmtMoney(itemTotal)}</span>
      </div>
    `;
    cartItems.appendChild(itemElement);
  });

  // Update cart summary
  cartCount.textContent = cart.length;
  cartBadge.textContent = cart.length;
  cartBadge.classList.remove('hidden');
  cartTotal.textContent = fmtMoney(total);
  checkoutBtn.disabled = false;

  // Add event listeners to quantity buttons
  document.querySelectorAll('.increase-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const name = e.currentTarget.dataset.name;
      const price = parseFloat(e.currentTarget.dataset.price);
      addToCart({ name, price });
    });
  });

  document.querySelectorAll('.decrease-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const name = e.currentTarget.dataset.name;
      const price = parseFloat(e.currentTarget.dataset.price);
      removeFromCart({ name, price });
    });
  });
}

function addToCart(item) {
  cart.push(item);
  updateCartUI();
  showNotification(`${item.name} agregado al carrito`);
}

function removeFromCart(item) {
  const index = cart.findIndex(cartItem => 
    cartItem.name === item.name && cartItem.price === item.price
  );
  
  if (index > -1) {
    cart.splice(index, 1);
    updateCartUI();
  }
}

function initCart() {
  // Add to cart buttons
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      const name = card.querySelector('h3').textContent;
      const price = parseFloat(card.querySelector('span.text-lg').textContent.replace(/[^0-9.-]+/g,''));
      
      addToCart({ name, price });
    });
  });

  // (Función de filtros trasladada a nivel global)

// Cart toggle
const cartButton = document.getElementById('cart-button');
  const floatingCart = document.getElementById('floating-cart');
  const closeCart = document.getElementById('close-cart');
  const checkoutBtn = document.getElementById('checkout-btn');
  const cartOverlay = document.getElementById('cart-overlay');

  function toggleCart(show) {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      if (show) {
        document.body.style.overflow = 'hidden';
        floatingCart.classList.add('active');
        if (cartOverlay) cartOverlay.classList.remove('hidden');
      } else {
        document.body.style.overflow = '';
        floatingCart.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.add('hidden');
      }
    } else {
      if (show) {
        floatingCart.classList.remove('translate-y-20', 'opacity-0', 'invisible');
      } else {
        floatingCart.classList.add('translate-y-20', 'opacity-0', 'invisible');
      }
    }
  }

  if (cartButton && floatingCart) {
    // Toggle cart on button click
    cartButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMobile = window.innerWidth <= 768;
      const isOpen = isMobile 
        ? floatingCart.classList.contains('active')
        : !floatingCart.classList.contains('invisible');
      
      toggleCart(!isOpen);
    });

    // Close cart when clicking outside on desktop
    if (!cartOverlay) {
      document.addEventListener('click', (e) => {
        if (window.innerWidth > 768 && 
            !floatingCart.contains(e.target) && 
            !cartButton.contains(e.target)) {
          toggleCart(false);
        }
      });
    }
  }

  // Close cart when clicking overlay on mobile
  if (cartOverlay) {
    cartOverlay.addEventListener('click', () => toggleCart(false));
  }

  if (closeCart) {
    closeCart.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCart(false);
    });
  }

  // Checkout button
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      const today = new Date().toLocaleDateString('es-AR');
      let message = `*NUEVO PEDIDO* - ${today}\n\n`;
      message += `Hola ${STORE_NAME}, por favor necesito realizar el siguiente pedido:\n\n`;
      message += `*Producto* | *Cantidad* | *Precio*\n`;
      message += `--------------------------------\n`;
      
      const groupedItems = cart.reduce((acc, item) => {
        const key = `${item.name}-${item.price}`;
        if (!acc[key]) {
          acc[key] = { ...item, quantity: 1 };
        } else {
          acc[key].quantity += 1;
        }
        return acc;
      }, {});

      let total = 0;
      Object.values(groupedItems).forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        message += `${item.name} | ${item.quantity} ${item.quantity > 1 ? 'unidades' : 'unidad'} | ${fmtMoney(itemTotal)}\n`;
      });

      message += `\n*Total: ${fmtMoney(total)}*\n\n`;
      message += `*Datos de entrega:*\n`;
      message += `- Nombre: \n`;
      message += `- Dirección: \n`;
      message += `- Teléfono: \n`;
      message += `- Horario de entrega: \n\n`;
      message += `*Forma de pago:*\n`;
      message += `- Efectivo\n`;
      message += `- Transferencia\n`;
      message += `- Otro (especificar): \n\n`;
      message += `¡Muchas gracias!`;

      window.open(waContactLink(message), '_blank');
    });
  }
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in-up';
  notification.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('opacity-0', 'translate-y-2');
    notification.addEventListener('transitionend', () => {
      notification.remove();
    }, { once: true });
  }, 3000);
}

/* ====== Inicialización ====== */
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize core functionality
  initCart();
  updateCartUI();

  // Initialize category filters if they exist
  // Render sandwiches from data source (local array for now)
  if (window.SANDWICHES && Array.isArray(window.SANDWICHES)) {
    renderSandwiches(window.SANDWICHES);
  }
  if (document.querySelector('.category-filter')) initCategoryFilters();
  
  // Initialize other components
  // Se elimina initProductFiltering para evitar conflicto con filtros de sándwiches
  // No es necesario volver a llamar a initCart()
  if (document.getElementById('sandwiches')) setupDailySpecial();
  initWhatsAppButton();
  initMobileQuickNav();

  // Set up WhatsApp button
  if (document.getElementById("waBtn")) {
    document.getElementById("waBtn").href = waContactLink();
  }
  
  // Set up share button
  const shareBtn = document.getElementById("shareCatalog");
  if (shareBtn) shareBtn.addEventListener('click', shareOnWhatsApp);

  // Update footer year
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Load products asynchronously
  const loadProducts = async () => {
    try {
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
    } catch (error) {
      console.error('Error al cargar los productos:', error);
      if ($grid) {
        $grid.innerHTML = '<div class="col-span-full text-center py-8 text-red-500">Error al cargar los productos. Por favor, intente recargar la página.</div>';
      }
    }
  };
  
  // Execute the async function
  await loadProducts();

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
});
