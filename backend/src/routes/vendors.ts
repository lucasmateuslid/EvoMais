import { Router } from 'express';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

export const vendorsRouter = Router();
vendorsRouter.use(requireAuth);

vendorsRouter.get('/', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const [sellersResult, dealsResult, conversationsResult, messagesResult] = await Promise.all([
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
    ]);

    if (sellersResult.error) return next(sellersResult.error);
    if (dealsResult.error) return next(dealsResult.error);
    if (conversationsResult.error) return next(conversationsResult.error);
    if (messagesResult.error) return next(messagesResult.error);

    const sellers = sellersResult.data || [];
    const deals = dealsResult.data || [];
    const conversations = conversationsResult.data || [];
    const messages = messagesResult.data || [];

    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);

    const vendors = sellers.map(seller => {
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
        status: seller.status,
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
