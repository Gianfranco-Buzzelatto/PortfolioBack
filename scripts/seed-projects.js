import Project from '../models/Project.js';

const SEED_PROJECTS = [
  {
    title: 'Sistema de gestión para hamburguesería',
    slug: 'gestion-gastronomia',
    description:
      'El local operaba mesas, comandas y comunicación con el cliente en herramientas dispersas. Armé un sistema a medida con panel en tiempo real, reportes y aviso por WhatsApp para ordenar el salón y la cocina.',
    longDescription:
      'Panel unificado: mesas, comandas, cierre de caja, reportes y notificaciones. Pensado para que el equipo deje de depender de planillas y chats sueltos.',
    category: 'fullstack',
    technologies: ['React', 'Vite', 'Node.js', 'Express', 'MongoDB', 'Socket.io', 'Cloudinary', 'WhatsApp'],
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
    demoUrl: '/demo/gastronomia',
    featured: true,
    order: 1,
  },
  {
    title: 'Tienda online para perfumería',
    slug: 'tienda-perfumeria',
    description:
      'La marca necesitaba vender 24/7 con catálogo claro y compra simple desde el celular. Desarrollé un e-commerce con carrito, panel admin y experiencia pensada para conversión en mobile.',
    longDescription:
      'Catálogo por familias, fichas de producto, carrito, checkout y administración de stock/productos.',
    category: 'web',
    technologies: ['React', 'Vite', 'Tailwind', 'Zustand', 'React Query', 'Node.js', 'Express', 'MongoDB', 'Cloudinary', 'Socket.io'],
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
    demoUrl: '/demo/perfumeria',
    featured: true,
    order: 2,
  },
  {
    title: 'E-commerce y CRM para marca de velas',
    slug: 'ecommerce-velas',
    description:
      'La marca necesitaba vitrina online y orden interno (pedidos, clientes, catálogo). Entregué una plataforma con tienda + panel para operar el negocio sin perder el control del stock y las ventas.',
    longDescription:
      'Catálogo, carrito, gestión de pedidos y clientes, y generación de documentos.',
    category: 'fullstack',
    technologies: ['React', 'Vite', 'Tailwind', 'Node.js', 'Express', 'MongoDB', 'Cloudinary', 'PDF'],
    imageUrl: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80',
    demoUrl: '/demo/velas',
    featured: true,
    order: 3,
  },
  {
    title: 'Plataforma de pedidos para hamburguesería',
    slug: 'pedidos-hamburgueseria',
    description:
      'El negocio necesitaba tomar pedidos online con seguimiento en vivo y panel operativo. Armé una plataforma PWA con carrito, tiempo real y métricas para cocina y mostrador.',
    longDescription:
      'Pedidos online, estados en tiempo real, panel con métricas y experiencia mobile-first instalable como app.',
    category: 'fullstack',
    technologies: ['React', 'Vite', 'Tailwind', 'Zustand', 'React Query', 'PWA', 'Node.js', 'Express', 'MongoDB', 'Socket.io', 'Cloudinary'],
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    demoUrl: '/demo/gastronomia',
    featured: true,
    order: 4,
  },
];

export async function seedProjectsIfEmpty() {
  const count = await Project.countDocuments();
  if (count > 0) return;
  await Project.insertMany(SEED_PROJECTS);
  console.log('📦 Proyectos demo cargados en la base de datos');
}

export async function replaceShowcaseProjects() {
  await Project.deleteMany({});
  await Project.insertMany(SEED_PROJECTS);
  console.log('📦 Proyectos del portfolio reemplazados:', SEED_PROJECTS.length);
}

export { SEED_PROJECTS };
