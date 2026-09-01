import express from 'express'
import rateLimit from 'express-rate-limit'
import Client from '../models/Client.js'
import { toPublicPortal } from '../utils/portal.js'
import { describeWarranty } from '../utils/warranty.js'

const router = express.Router()

const portalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Demasiados intentos. Probá más tarde.' },
})

router.get('/:token', async (req, res) => {
  try {
    const client = await Client.findOne({ portalToken: req.params.token })
    if (!client) return res.status(404).json({ message: 'Portal no encontrado o link inválido' })
    res.json(toPublicPortal(client))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/:token/revision', portalLimiter, async (req, res) => {
  try {
    const client = await Client.findOne({ portalToken: req.params.token })
    if (!client) return res.status(404).json({ message: 'Portal no encontrado o link inválido' })
    if (!['activo', 'revision'].includes(client.stage)) {
      return res.status(403).json({ message: 'En esta etapa los cambios se coordinan por WhatsApp' })
    }

    const description = String(req.body.description || '').trim().slice(0, 500)
    if (description.length < 8) {
      return res.status(400).json({ message: 'Contá el cambio con un poco más de detalle' })
    }

    client.revisionsList = client.revisionsList || []
    client.revisionsList.push({
      description,
      status: 'pendiente',
      date: new Date(),
      fromClient: true,
    })
    client.revisionsUsed = (client.revisionsUsed || 0) + 1
    await client.save()

    res.json({
      message: 'Pedido registrado',
      portal: toPublicPortal(client),
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/:token/warranty', portalLimiter, async (req, res) => {
  try {
    const client = await Client.findOne({ portalToken: req.params.token })
    if (!client) return res.status(404).json({ message: 'Portal no encontrado o link inválido' })
    if (!describeWarranty(client).active) {
      return res.status(403).json({ message: 'La garantía ya no está activa. Si hace falta un arreglo, lo vemos por el plan de cuidado o WhatsApp.' })
    }

    const description = String(req.body.description || '').trim().slice(0, 500)
    if (description.length < 8) {
      return res.status(400).json({ message: 'Contá el problema con un poco más de detalle' })
    }

    client.warrantyTickets = client.warrantyTickets || []
    client.warrantyTickets.push({
      description,
      status: 'pendiente',
      date: new Date(),
      fromClient: true,
    })
    await client.save()

    res.json({
      message: 'Pedido de garantía registrado',
      portal: toPublicPortal(client),
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

export default router
