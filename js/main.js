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
    const res = await fetch(API_URL, { method: 'HEAD' });
    const lastModified = res.headers.get('last-modified');
    
    // Si no hay encabezado last-modified, hacemos una petición normal
    const dataRes = await fetch(API_URL);
    if (!dataRes.ok) throw new Error('Error al cargar los productos');
    
    let data = await dataRes.json();
    if (data.data) data = data.data; // Si la respuesta tiene un objeto data
    
    // Si hay fecha de última modificación, actualizamos la interfaz
    if (lastModified) {
      const lastUpdate = new Date(lastModified);
      document.getElementById('updatedAt').textContent = lastUpdate.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // Si no hay fecha de última modificación, usamos la actual
      document.getElementById('updatedAt').textContent = new Date().toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
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

/* ====== PDF GENERATION ====== */
async function generatePDF(products) {
  try {
    // Importar jsPDF dinámicamente
    const { jsPDF } = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const doc = new jsPDF();
    
    // Agregar título
    doc.setFontSize(20);
    doc.setTextColor(44, 44, 44); // Color brand-dark
    doc.text(`Lista de Precios - ${STORE_NAME}`, 105, 15, { align: 'center' });
    
    // Fecha de generación
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleString('es-AR')}`, 105, 22, { align: 'center' });
    
    let y = 35;
    let currentCategory = '';
    
    // Agrupar productos por categoría
    const groupedProducts = {};
    products.forEach(product => {
      const category = product.category || 'Sin categoría';
      if (!groupedProducts[category]) {
        groupedProducts[category] = [];
      }
      groupedProducts[category].push(product);
    });
    
    // Agregar productos al PDF
    Object.entries(groupedProducts).forEach(([category, items]) => {
      // Verificar si necesitamos una nueva página
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      // Título de categoría
      doc.setFontSize(14);
      doc.setTextColor(44, 44, 44);
      doc.setFont('helvetica', 'bold');
      doc.text(category, 14, y);
      y += 8;
      
      // Línea divisoria
      doc.setDrawColor(246, 224, 141); // Color brand-amber
      doc.setLineWidth(0.5);
      doc.line(14, y, 196, y);
      y += 5;
      
      // Productos
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      items.forEach((item, index) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        // Nombre del producto
        doc.setTextColor(0, 0, 0);
        doc.text(item.name, 20, y);
        
        // Precio alineado a la derecha
        const price = fmtMoney(item.price);
        const priceWidth = doc.getStringUnitWidth(price) * doc.getFontSize() / doc.internal.scaleFactor;
        doc.text(price, 196 - priceWidth, y);
        
        // Unidad en gris
        doc.setTextColor(100, 100, 100);
        doc.text(`/${item.unit || 'unidad'}`, 196 - priceWidth - 25, y);
        
        y += 7;
      });
      
      y += 5; // Espacio después de cada categoría
    });
    
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('© ' + new Date().getFullYear() + ' ' + STORE_NAME + ' - Todos los derechos reservados', 105, 287, { align: 'center' });
    
    // Guardar el PDF
    doc.save(`Lista-de-Precios-${STORE_NAME}-${new Date().toISOString().split('T')[0]}.pdf`);
    
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    alert('Error al generar el PDF. Por favor, intente nuevamente.');
  }
}

// Función para compartir lista de precios por WhatsApp
function shareOnWhatsApp(event) {
  event.preventDefault();
  const message = encodeURIComponent('Hola, te comparto la lista de precios de Corbalac:');
  const pdfUrl = encodeURIComponent(window.location.origin + '/assets/pdfs/lista-precios-corbalac.pdf');
  window.open(`https://wa.me/?text=${message}%20${pdfUrl}`, '_blank');
}

// Función para mostrar mensajes de retroalimentación
function showFeedback(element, message, type) {
  element.textContent = message;
  element.className = `p-3 rounded-lg text-sm mb-4 ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
  element.classList.remove('hidden');
}

/* ====== SANDWICH MENU ====== */
function setupDailySpecial() {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const specials = [
    { 
      name: 'Milanesa Clásica', 
      description: '¡Todos los Lunes!',
      price: '2,880', 
      originalPrice: '3,200',
      discount: '10%'
    },
    { 
      name: 'Jamón Crudo y Queso', 
      description: '¡Todos los Martes!',
      price: '3,150', 
      originalPrice: '3,500',
      discount: '10%'
    },
    { 
      name: 'Pollo Grillado', 
      description: '¡Miércoles de Pollo!',
      price: '2,790', 
      originalPrice: '3,100',
      discount: '10%'
    },
    { 
      name: 'Vegetariano Especial', 
      description: '¡Jueves Verde!',
      price: '2,970', 
      originalPrice: '3,300',
      discount: '10%'
    },
    { 
      name: 'Milanesa Napolitana', 
      description: '¡Viernes de Milanesa!',
      price: '3,150', 
      originalPrice: '3,500',
      discount: '10%'
    },
    { 
      name: 'Lomito Completo', 
      description: '¡Sábado Especial!',
      price: '3,510', 
      originalPrice: '3,900',
      discount: '10%'
    },
    { 
      name: 'Sandwich de Bondiola', 
      description: '¡Domingo Familiar!',
      price: '3,240', 
      originalPrice: '3,600',
      discount: '10%'
    }
  ];

  const today = new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const todaySpecial = specials[today];
  
  const specialElement = document.getElementById('specialItem');
  if (specialElement) {
    specialElement.innerHTML = `
      <p class="font-medium">${todaySpecial.name} - <span class="text-amber-600">${todaySpecial.description}</span></p>
      <p class="text-sm">Precio especial: <span class="line-through text-gray-500">$${todaySpecial.originalPrice}</span> <span class="font-bold">$${todaySpecial.price}</span> (${todaySpecial.discount} OFF)</p>
    `;
  }

  // Resaltar el ítem del día en el menú
  const menuItems = document.querySelectorAll('.sandwich-item');
  menuItems.forEach(item => {
    const title = item.querySelector('h4');
    if (title && title.textContent.includes(todaySpecial.name)) {
      item.classList.add('ring-2', 'ring-amber-400');
      item.querySelector('.text-green-600').classList.add('font-bold', 'text-base');
    }
  });
}

// Initialize WhatsApp button
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
  
  // Add floating animation on hover
  whatsappBtn.addEventListener('mouseenter', function() {
    this.classList.add('float-animation');
  });
  
  whatsappBtn.addEventListener('mouseleave', function() {
    this.classList.remove('float-animation');
  });
  
  // Add to body
  document.body.appendChild(whatsappBtn);
}

// Inicialización
(async () => {
  // Configuración del menú de sándwiches
  if (document.getElementById('sandwiches')) {
    setupDailySpecial();
  }
  
  // Initialize WhatsApp button
  initWhatsAppButton();
  
  // Configuración de WhatsApp
  if (document.getElementById("waBtn")) {
    document.getElementById("waBtn").href = waContactLink();
  }
  document.getElementById("shareBtn").href = `https://wa.me/?text=${encodeURIComponent(`Lista de precios – ${STORE_NAME}: ${location.href}`)}`;
  
  // Actualizar año del footer
  document.getElementById('year').textContent = new Date().getFullYear();
  
  // Cargar y mostrar productos
  const data = await fetchProducts();
  render(data);
  
  // Configurar botón de descarga PDF
  document.getElementById('downloadPdf').addEventListener('click', (e) => {
    e.preventDefault();
    generatePDF(data);
  });
  
  // Función para compartir lista de precios por WhatsApp
  function shareOnWhatsApp(event) {
    event.preventDefault();
    const message = 'Hola, te comparto la lista de precios de Corbalac:';
    const pdfUrl = window.location.origin + '/assets/pdfs/lista-precios-corbalac.pdf';
    
    // Usar la API de compartir del navegador si está disponible
    if (navigator.share) {
      navigator.share({
        title: `Lista de precios - ${STORE_NAME}`,
        text: message,
        url: pdfUrl
      }).catch(console.error);
    } else {
      // Si no soporta la API de compartir, abrir WhatsApp con el mensaje
      const whatsappMessage = encodeURIComponent(`${message} ${pdfUrl}`);
      window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
    }
  }
  
  // Configurar botón de compartir por WhatsApp
  document.getElementById('shareCatalog').addEventListener('click', shareOnWhatsApp);
  
  // Configurar búsqueda
  $search.addEventListener('input', (e) => {
    render(data, e.target.value);
  });
  
  // Smooth scroll para enlaces de navegación
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80, // Ajuste para el header fijo
          behavior: 'smooth'
        });
      }
    });
  });
  
  // La fecha de actualización ahora se establece en fetchProducts
})();
