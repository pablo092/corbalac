// Fuente de datos de sándwiches (fácil de migrar a API en el futuro)
// Estructura pensada para mapear 1:1 a una futura respuesta JSON
// Nota: mantener categorías en {clasicos|especiales|vegetarianos}

window.SANDWICHES = [
  {
    name: "Sándwich de Milanesa",
    category: "clasicos",
    description: "Pan casero, milanesa de ternera, lechuga, tomate y mayonesa casera.",
    price: 12000,
    badge: "Clásico",
    icon: "fas fa-hamburger",
    image: "images/sandwich_milanesa_1763739467407.png"
  },
  {
    name: "Sándwich Especial",
    category: "especiales",
    description: "Pan de campo, lomito, queso, huevo, jamón, lechuga, tomate y mayonesa.",
    price: 15000,
    badge: "Especial",
    icon: "fas fa-bacon",
    image: "images/sandwich_especial_1763739493051.png"
  },
  {
    name: "Vegetariano Especial",
    category: "vegetarianos",
    description: "Pan de semillas, berenjena grillada, zuchini, queso de cabra y pesto.",
    price: 13500,
    badge: "Vegetariano",
    icon: "fas fa-leaf",
    image: "images/sandwich_vegetariano_1763739512046.png"
  },
  {
    name: "Lomito Completo",
    category: "especiales",
    description: "Lomito, queso, jamón, huevo, lechuga, tomate y aderezos.",
    price: 15500,
    badge: "Especial",
    icon: "fas fa-drumstick-bite",
    image: "images/sandwich_lomito_1763739538592.png"
  },
  {
    name: "Milanesa Napolitana",
    category: "clasicos",
    description: "Milanesa con salsa de tomate, jamón y queso.",
    price: 14500,
    badge: "Clásico",
    icon: "fas fa-bread-slice",
    image: "images/sandwich_napolitana_1763739557079.png"
  },
  {
    name: "Caprese",
    category: "vegetarianos",
    description: "Pan ciabatta, tomate, mozzarella fresca, albahaca y oliva.",
    price: 12500,
    badge: "Vegetariano",
    icon: "fas fa-seedling",
    image: "images/sandwich_caprese_1763739574909.png"
  }
];
