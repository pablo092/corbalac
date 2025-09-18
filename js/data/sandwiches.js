// Fuente de datos de sándwiches (fácil de migrar a API en el futuro)
// Estructura pensada para mapear 1:1 a una futura respuesta JSON
// Nota: mantener categorías en {clasicos|especiales|vegetarianos}

window.SANDWICHES = [
  {
    name: "Sándwich de Milanesa",
    category: "clasicos",
    description: "Pan casero, milanesa de ternera, lechuga, tomate y mayonesa casera.",
    price: 1200,
    badge: "Clásico",
    icon: "fas fa-hamburger"
  },
  {
    name: "Sándwich Especial",
    category: "especiales",
    description: "Pan de campo, lomito, queso, huevo, jamón, lechuga, tomate y mayonesa.",
    price: 1500,
    badge: "Especial",
    icon: "fas fa-bacon"
  },
  {
    name: "Vegetariano Especial",
    category: "vegetarianos",
    description: "Pan de semillas, berenjena grillada, zuchini, queso de cabra y pesto.",
    price: 1350,
    badge: "Vegetariano",
    icon: "fas fa-leaf"
  },
  {
    name: "Lomito Completo",
    category: "especiales",
    description: "Lomito, queso, jamón, huevo, lechuga, tomate y aderezos.",
    price: 1550,
    badge: "Especial",
    icon: "fas fa-drumstick-bite"
  },
  {
    name: "Milanesa Napolitana",
    category: "clasicos",
    description: "Milanesa con salsa de tomate, jamón y queso.",
    price: 1450,
    badge: "Clásico",
    icon: "fas fa-bread-slice"
  },
  {
    name: "Caprese",
    category: "vegetarianos",
    description: "Pan ciabatta, tomate, mozzarella fresca, albahaca y oliva.",
    price: 1250,
    badge: "Vegetariano",
    icon: "fas fa-seedling"
  }
];
