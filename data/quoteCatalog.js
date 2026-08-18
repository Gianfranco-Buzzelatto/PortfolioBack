/** Catálogo GB.Dev 2026 — v1 precios de lanzamiento (Etapa 1) */

export const PAYMENT_TERMS = {
  label: '40% al arrancar · 30% a mitad de proyecto · 30% contra entrega',
  short: '40% / 30% / 30%',
  splits: [0.4, 0.3, 0.3],
}

export const PROJECT_CATEGORIES = {
  landing: {
    key: 'landing',
    label: 'Landing Page',
    fitFor: 'Una página simple para mostrar tu negocio, generar confianza y que te contacten (WhatsApp, formulario, llamada).',
    notFor: 'No sirve si necesitás vender productos online, recibir pedidos o manejar un catálogo — mirá E-commerce o Plataforma de Pedidos.',
    tiers: {
      base: {
        price: 200,
        priceRange: [180, 220],
        deadline: 4,
        revisions: 2,
        includes: [
          '1 página con diseño responsive',
          'Formulario de contacto',
          'Botón WhatsApp',
          'Deploy en Vercel / Railway',
        ],
      },
      media: {
        price: 315,
        priceRange: [280, 350],
        deadline: 6,
        revisions: 3,
        includes: [
          'Todo lo Básico',
          'Secciones extra (testimonios, galería, mapa)',
          'Google Analytics',
        ],
      },
      premium: {
        price: 440,
        priceRange: [400, 480],
        deadline: 9,
        revisions: 4,
        includes: [
          'Todo lo Intermedio',
          'Panel simple para editar textos e imágenes',
          'Optimización de velocidad avanzada',
        ],
      },
    },
  },
  institucional: {
    key: 'institucional',
    label: 'Sitio Institucional',
    fitFor: 'Varios servicios o áreas para mostrar (consultora, estudio, clínica, colegio) con varias secciones y, si hace falta, blog o novedades.',
    notFor: 'No es lo ideal si tu objetivo principal es vender productos — ahí conviene E-commerce.',
    tiers: {
      base: {
        price: 430,
        priceRange: [380, 480],
        deadline: 12,
        revisions: 2,
        includes: [
          '3-4 páginas (inicio, servicios, nosotros, contacto)',
          'Diseño responsive',
          'Formulario de contacto + WhatsApp',
          'Deploy en Vercel / Railway',
        ],
      },
      media: {
        price: 675,
        priceRange: [600, 750],
        deadline: 18,
        revisions: 3,
        includes: [
          'Todo lo Básico',
          'Panel admin para editar contenido e imágenes',
          'Blog con categorías',
        ],
      },
      premium: {
        price: 975,
        priceRange: [850, 1100],
        deadline: 25,
        revisions: 4,
        includes: [
          'Todo lo Intermedio',
          'Newsletter',
          'SEO avanzado',
          'Integración Google Business / redes',
        ],
      },
    },
  },
  ecommerce: {
    key: 'ecommerce',
    label: 'E-commerce',
    fitFor: 'Vendés productos y necesitás que el cliente pague online (Mercado Pago) sin gestionar el cobro a mano.',
    notFor: 'No sirve si recibís pedidos para preparar/entregar (comida, delivery) — ahí va Plataforma de Pedidos.',
    tiers: {
      base: {
        price: 825,
        priceRange: [700, 950],
        deadline: 25,
        revisions: 3,
        includes: [
          'Catálogo de productos',
          'Carrito de compras',
          'Checkout Mercado Pago',
          'Panel admin de productos y pedidos',
        ],
      },
      media: {
        price: 1300,
        priceRange: [1100, 1500],
        deadline: 35,
        revisions: 3,
        includes: [
          'Todo lo Básico',
          'Variantes (talle / color)',
          'Cupones de descuento',
          'Gestión de stock',
          'Emails automáticos de pedido',
        ],
      },
      premium: {
        price: 2100,
        priceRange: [1800, 2400],
        deadline: 50,
        revisions: 4,
        includes: [
          'Todo lo Intermedio',
          'Wishlist',
          'Tracking de pedido para el cliente',
          'Reseñas de productos',
          'Dashboard de ventas',
        ],
      },
    },
  },
  pedidos: {
    key: 'pedidos',
    label: 'Plataforma de Pedidos / Delivery',
    fitFor: 'Restaurant, kiosco, panadería u otro negocio donde el cliente hace un pedido que preparás y entregás/retira — gestión operativa de punta a punta.',
    notFor: 'No aplica si solo vendés productos que se envían por correo — un E-commerce estándar alcanza y sale más barato.',
    tiers: {
      base: {
        price: 1500,
        priceRange: [1300, 1700],
        deadline: 32,
        revisions: 3,
        includes: [
          'Menú / catálogo online',
          'Carrito y checkout Mercado Pago',
          'Panel admin de pedidos',
        ],
      },
      media: {
        price: 2350,
        priceRange: [2000, 2700],
        deadline: 45,
        revisions: 3,
        includes: [
          'Todo lo Básico',
          'Notificaciones automáticas por WhatsApp',
          'Cupones de descuento',
          'Estimación de tiempo de entrega',
        ],
      },
      premium: {
        price: 3500,
        priceRange: [3000, 4000],
        deadline: 60,
        revisions: 4,
        includes: [
          'Todo lo Intermedio',
          'Tracking en vivo con mapa',
          'Panel de reportes y ranking',
          'Sistema de reseñas',
        ],
      },
    },
  },
  sistema: {
    key: 'sistema',
    label: 'Sistema a Medida / Mini-ERP',
    fitFor: 'Procesos internos específicos (inventario, ventas, turnos, reportes) que no entran en un e-commerce ni un sitio institucional.',
    notFor: 'No es para vos si solo querés vender o mostrar el negocio — eso es más simple y barato con las categorías anteriores.',
    tiers: {
      base: {
        price: 2150,
        priceRange: [1800, 2500],
        deadline: 50,
        revisions: 3,
        includes: [
          '1-2 módulos core (ej. inventario + ventas)',
          'Login con roles básicos',
          'Panel de administración',
        ],
      },
      media: {
        price: 3850,
        priceRange: [3200, 4500],
        deadline: 75,
        revisions: 3,
        includes: [
          'Todo lo Básico',
          'Módulos adicionales',
          'Reportes y dashboard',
        ],
      },
      premium: {
        price: 6750,
        priceRange: [5500, 8000],
        deadline: 120,
        revisions: 4,
        includes: [
          'Todo lo Intermedio',
          'Integraciones externas',
          'Automatizaciones',
          'Roles y permisos avanzados',
        ],
      },
    },
  },
}

export const CARE_PLANS = {
  basico: {
    key: 'basico',
    label: 'Básico',
    price: 30,
    priceRange: [25, 35],
    includes: [
      'Backups y actualización de dependencias',
      'Monitoreo de disponibilidad',
      'Hasta 1 cambio chico al mes',
    ],
  },
  intermedio: {
    key: 'intermedio',
    label: 'Intermedio',
    price: 55,
    priceRange: [45, 70],
    recommended: true,
    includes: [
      'Todo lo Básico',
      'Soporte prioritario (<48 h)',
      'Hasta 3 cambios chicos al mes',
      'Hosting, dominio y base de datos incluidos',
    ],
  },
  premium: {
    key: 'premium',
    label: 'Premium',
    price: 130,
    priceRange: [100, 160],
    includes: [
      'Todo lo Intermedio',
      'Hasta 5 h de desarrollo incluidas al mes',
      'Prioridad total',
    ],
  },
}

/** Add-ons opcionales para ajustes finos en el wizard */
export const ADDON_CATALOG = {
  'Diseño & UI': [
    { name: 'Diseño UI personalizado (Figma)', price: 140 },
    { name: 'Animaciones y micro-interacciones', price: 50 },
    { name: 'Dark mode / Light mode', price: 40 },
  ],
  'Páginas & Contenido': [
    { name: 'Páginas adicionales (x5)', price: 80 },
    { name: 'Galería de imágenes / portfolio', price: 55 },
    { name: 'FAQ', price: 30 },
  ],
  'E-commerce extra': [
    { name: 'Gestión de stock avanzada', price: 70 },
    { name: 'Cupones y descuento avanzado', price: 45 },
    { name: 'Integración envíos (Andreani / OCA)', price: 120 },
  ],
  'Integraciones': [
    { name: 'Google Analytics 4', price: 25 },
    { name: 'Email marketing (Mailchimp/Brevo)', price: 55 },
    { name: 'CRM (HubSpot / Zoho)', price: 90 },
    { name: 'API externa personalizada', price: 140 },
  ],
  'Funciones Avanzadas': [
    { name: 'Buscador interno', price: 70 },
    { name: 'Multilenguaje (i18n)', price: 100 },
    { name: 'Módulo a medida adicional', price: 500 },
    { name: 'Login con Google', price: 70 },
    { name: 'Roles y permisos avanzados', price: 90 },
  ],
}

export const CATEGORY_KEYS = Object.keys(PROJECT_CATEGORIES)

export function getCategory(key) {
  return PROJECT_CATEGORIES[key] || PROJECT_CATEGORIES.landing
}

export function formatPriceRange([min, max]) {
  return `USD ${min.toLocaleString('en-US')} – ${max.toLocaleString('en-US')}`
}
