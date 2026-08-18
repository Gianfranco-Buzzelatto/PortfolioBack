import Project from '../models/Project.js';

const SEED_PROJECTS = [
  {
    title: 'Sistema de gestión gastronómica',
    description:
      'El local manejaba pedidos y cuentas con herramientas dispersas y mucho margen de error. Centralicé mesas, pedidos y flujo de caja en un sistema a medida para que el equipo trabaje más rápido y con números claros.',
    longDescription:
      'Panel unificado para salón y cocina: estado de mesas en tiempo real, comandas digitales, cierre de cuenta y reporte diario de ventas.',
    category: 'fullstack',
    technologies: ['React', 'Node.js', 'Express', 'MongoDB'],
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    demoUrl: '/demo/gastronomia',
    featured: true,
    order: 1,
  },
  {
    title: 'Tienda online para perfumería',
    description:
      'La marca necesitaba vender 24/7 con una vitrina ordenada y una compra simple en celular. Desarrollé un e-commerce enfocado en catálogo, confianza y checkout claro para aumentar conversiones sin fricción.',
    longDescription:
      'Catálogo por familias olfativas, fichas de producto con variantes, carrito persistente y checkout optimizado para mobile.',
    category: 'web',
    technologies: ['React', 'Node.js', 'MongoDB', 'E-commerce'],
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80',
    demoUrl: '/demo/perfumeria',
    featured: true,
    order: 2,
  },
  {
    title: 'Web institucional para metalúrgica',
    description:
      'La empresa requería transmitir solidez y servicios industriales a nuevos clientes B2B. Entregué un sitio institucional rápido, con propuesta de valor explícita y contacto directo al área comercial.',
    longDescription:
      'Sitio corporativo con líneas de servicio, casos industriales, certificaciones y formulario de consulta comercial.',
    category: 'web',
    technologies: ['React', 'Responsive', 'Performance', 'Formularios de contacto'],
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80',
    demoUrl: '/demo/metalurgica',
    featured: true,
    order: 3,
  },
];

export async function seedProjectsIfEmpty() {
  const count = await Project.countDocuments();
  if (count > 0) return;
  await Project.insertMany(SEED_PROJECTS);
  console.log('📦 Proyectos demo cargados en la base de datos');
}
