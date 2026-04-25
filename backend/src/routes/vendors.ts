import { Router } from 'express';
import { z } from 'zod';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { logger } from '../logger.js';
import { emitTenantEvent } from '../realtime/socket.js';
import { provisionEvolutionInstance } from '../services/evolutionProvisioning.js';
import { generateUniqueConnectionInstanceName } from '../utils/instanceName.js';

export const vendorsRouter = Router();
vendorsRouter.use(requireAuth);

const createVendorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),
  avatar_url: z.string().url().optional().nullable(),
  connectWhatsApp: z.boolean().default(true),
  instance_name: z.string().min(1).optional(),
  api_provider: z.enum(['evolution', 'whatsmeow']).default('evolution'),
});

vendorsRouter.post('/', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const payload = createVendorSchema.parse(req.body);
    const sanitizedPhone = payload.phone.replace(/\D/g, '');

    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .insert({
        organization_id: request.organizationId,
        name: payload.name,
        email: payload.email,
        phone: sanitizedPhone,
        avatar_url: payload.avatar_url ?? null,
        status: payload.connectWhatsApp ? 'connecting' : 'inactive',
      })
      .select('id, name, email, phone, avatar_url, status, created_at')
      .single();

    if (sellerError) {
      return next(sellerError);
    }

    let createdConnection: Record<string, unknown> | null = null;

    if (payload.connectWhatsApp) {
      const instanceName = await generateUniqueConnectionInstanceName(supabase, request.organizationId, payload.name);

      const { data: connection, error: connectionError } = await supabase
        .from('connections')
        .insert({
          organization_id: request.organizationId,
          name: payload.name,
          phone: sanitizedPhone,
          instance_name: instanceName,
          api_provider: payload.api_provider,
          status: 'connecting',
        })
        .select('*')
        .single();

      if (connectionError) {
        return next(connectionError);
      }

      createdConnection = connection;

      if (payload.api_provider === 'evolution') {
        try {
          await provisionEvolutionInstance({
            supabase,
            organizationId: request.organizationId,
            connectionId: connection.id,
            instanceName,
            sellerId: seller.id,
          });
        } catch (provisioningError) {
          logger.warn({ provisioningError, instanceName, organizationId: request.organizationId }, 'Evolution provisioning failed during vendor creation');
        }
      }
    }

    emitTenantEvent(request.organizationId, 'vendors:created', {
      seller,
      connection: createdConnection,
    });

    emitTenantEvent(request.organizationId, 'connections:updated', {
      connection: createdConnection,
    });

    res.status(201).json({
      seller,
      connection: createdConnection,
    });
  } catch (error) {
    next(error);
  }
});

vendorsRouter.get('/', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const [sellersResult, dealsResult, conversationsResult, messagesResult, connectionsResult] = await Promise.all([
      supabase
        .from('sellers')
        .select('id, name, email, phone, avatar_url, status, created_at')
        .eq('organization_id', request.organizationId)
        .order('created_at', { ascending: false }),
      supabase
        .from('deals')
        .select('id, consultant_id, consultant_name, stage, created_at')
        .eq('organization_id', request.organizationId),
      supabase
        .from('conversations')
        .select('id, seller_id, contact_name, contact_phone, status, last_message_at, started_at')
        .eq('organization_id', request.organizationId)
        .order('last_message_at', { ascending: false }),
      supabase
        .from('messages')
        .select('id, conversation_id, seller_id, content, created_at, sender_type')
        .eq('organization_id', request.organizationId)
        .order('created_at', { ascending: false }),
      supabase
        .from('connections')
        .select('id, name, phone, status, created_at')
        .eq('organization_id', request.organizationId)
        .order('created_at', { ascending: false }),
    ]);

    if (sellersResult.error) return next(sellersResult.error);
    if (dealsResult.error) return next(dealsResult.error);
    if (conversationsResult.error) return next(conversationsResult.error);
    if (messagesResult.error) return next(messagesResult.error);
    if (connectionsResult.error) return next(connectionsResult.error);

    const sellers = sellersResult.data || [];
    const deals = dealsResult.data || [];
    const conversations = conversationsResult.data || [];
    const messages = messagesResult.data || [];
    const connections = connectionsResult.data || [];

    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);

    const vendors = sellers.map(seller => {
      const normalizedSellerPhone = (seller.phone || '').replace(/\D/g, '');
      const sellerConnection = connections.find(connection => {
        const normalizedConnectionPhone = (connection.phone || '').replace(/\D/g, '');
        return normalizedConnectionPhone && normalizedConnectionPhone === normalizedSellerPhone;
      });

      const sellerDeals = deals.filter(deal => deal.consultant_name === seller.name || deal.consultant_id === seller.id);
      const sellerConversations = conversations.filter(conv => conv.seller_id === seller.id);
      const sellerMessages = messages.filter(msg => msg.seller_id === seller.id);
      const sellerMessagesToday = sellerMessages.filter(msg => new Date(msg.created_at) >= startToday);

      const closed = sellerDeals.filter(deal => deal.stage === 'fechamento').length;
      const total = sellerDeals.length;
      const conversion = total > 0 ? Number(((closed / total) * 100).toFixed(1)) : 0;

      const latestConversation = sellerConversations[0] || null;
      const latestMessage = latestConversation
        ? sellerMessages.find(message => message.conversation_id === latestConversation.id)
        : null;

      const conversationPreview = sellerConversations.slice(0, 8).map(conv => ({
        id: conv.id,
        name: conv.contact_name || conv.contact_phone,
        phone: conv.contact_phone,
        time: conv.last_message_at || conv.started_at,
      }));

      return {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
        avatar_url: seller.avatar_url,
        status: sellerConnection?.status || seller.status,
        leadsHoje: sellerMessagesToday.length,
        conversao: conversion,
        ultimaConversa: latestConversation?.last_message_at || latestConversation?.started_at || null,
        ultimaMensagem: latestMessage?.content || null,
        conversations: conversationPreview,
        totals: {
          deals: sellerDeals.length,
          conversations: sellerConversations.length,
          messages: sellerMessages.length,
        },
      };
    });

    const activeNow = vendors.filter(vendor => vendor.status === 'active').length;
    const totalConversationsToday = conversations.filter(conv => {
      const dateRef = conv.last_message_at || conv.started_at;
      return dateRef ? new Date(dateRef) >= startToday : false;
    }).length;

    res.json({
      vendors,
      summary: {
        activeNow,
        totalVendors: vendors.length,
        totalConversationsToday,
      },
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});
