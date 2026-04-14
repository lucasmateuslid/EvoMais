import { Router } from 'express';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatWeekday(date: Date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' });
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export const metricsRouter = Router();
metricsRouter.use(requireAuth);

metricsRouter.get('/dashboard', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const [dealsResult, sellersResult, conversationsResult, messagesResult] = await Promise.all([
      supabase
        .from('deals')
        .select('id, stage, value, followup_status, days_in_stage, created_at, consultant_name, company')
        .eq('organization_id', request.organizationId),
      supabase
        .from('sellers')
        .select('id, name, status')
        .eq('organization_id', request.organizationId),
      supabase
        .from('conversations')
        .select('id, seller_id, status, started_at, last_message_at')
        .eq('organization_id', request.organizationId),
      supabase
        .from('messages')
        .select('id, seller_id, created_at')
        .eq('organization_id', request.organizationId),
    ]);

    if (dealsResult.error) return next(dealsResult.error);
    if (sellersResult.error) return next(sellersResult.error);
    if (conversationsResult.error) return next(conversationsResult.error);
    if (messagesResult.error) return next(messagesResult.error);

    const deals = dealsResult.data || [];
    const sellers = sellersResult.data || [];
    const conversations = conversationsResult.data || [];
    const messages = messagesResult.data || [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const monthlyDeals = deals.filter(deal => new Date(deal.created_at) >= thirtyDaysAgo);
    const monthlyRevenue = monthlyDeals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);

    const totalDeals = deals.length;
    const closedDeals = deals.filter(deal => deal.stage === 'fechamento').length;
    const conversionRate = totalDeals > 0 ? Number(((closedDeals / totalDeals) * 100).toFixed(1)) : 0;

    const avgCycleDays = totalDeals > 0
      ? Number((deals.reduce((sum, deal) => sum + Number(deal.days_in_stage || 0), 0) / totalDeals).toFixed(1))
      : 0;

    const followupsOverdue = deals.filter(deal => deal.followup_status === 'vencido').length;

    const weeklyPerformance = Array.from({ length: 7 }).map((_, idx) => {
      const baseDate = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - idx)));
      const nextDate = new Date(baseDate);
      nextDate.setDate(baseDate.getDate() + 1);

      const prospects = deals.filter(deal => {
        const createdAt = new Date(deal.created_at);
        return createdAt >= baseDate && createdAt < nextDate;
      }).length;

      const sales = deals.filter(deal => {
        if (deal.stage !== 'fechamento') return false;
        const createdAt = new Date(deal.created_at);
        return createdAt >= baseDate && createdAt < nextDate;
      }).length;

      return {
        name: formatWeekday(baseDate),
        sales,
        prospects,
      };
    });

    const pipelineByStage = {
      prospeccao: deals.filter(deal => deal.stage === 'prospeccao').length,
      qualificacao: deals.filter(deal => deal.stage === 'qualificacao').length,
      proposta: deals.filter(deal => deal.stage === 'proposta').length,
      negociacao: deals.filter(deal => deal.stage === 'negociacao').length,
      fechamento: deals.filter(deal => deal.stage === 'fechamento').length,
    };

    const hotLeads = [...deals]
      .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
      .slice(0, 5)
      .map(deal => ({
        id: deal.id,
        company: deal.company,
        value: Number(deal.value || 0),
      }));

    const sellerMap = new Map(sellers.map(seller => [seller.id, seller.name]));
    const topVendors = sellers
      .map(seller => {
        const sellerConversations = conversations.filter(conv => conv.seller_id === seller.id);
        const sellerMessages = messages.filter(msg => msg.seller_id === seller.id);

        return {
          id: seller.id,
          name: seller.name,
          conversations: sellerConversations.length,
          messages: sellerMessages.length,
          status: seller.status,
        };
      })
      .sort((a, b) => b.conversations - a.conversations)
      .slice(0, 5);

    const areaData = Array.from({ length: 6 }).map((_, idx) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short' });
      const monthDealsValue = deals
        .filter(deal => {
          const createdAt = new Date(deal.created_at);
          return createdAt.getMonth() === monthDate.getMonth() && createdAt.getFullYear() === monthDate.getFullYear();
        })
        .reduce((sum, deal) => sum + Number(deal.value || 0), 0);

      return {
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        value: monthDealsValue,
      };
    });

    res.json({
      summary: {
        monthlyRevenue,
        newLeads: monthlyDeals.length,
        conversionRate,
        avgCycleDays,
        followupsOverdue,
        totalConversations: conversations.length,
        totalMessages: messages.length,
        activeVendors: sellers.filter(seller => seller.status === 'active').length,
      },
      charts: {
        areaData,
        weeklyPerformance,
      },
      pipelineByStage,
      hotLeads,
      topVendors,
      generatedAt: now.toISOString(),
      sellerDirectory: Object.fromEntries(sellerMap),
    });
  } catch (error) {
    next(error);
  }
});

metricsRouter.get('/timeline', async (req, res, next) => {
  try {
    const request = req as AuthenticatedRequest;
    const supabase = request.supabase;

    if (!supabase || !request.organizationId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const [messagesResult, conversationsResult] = await Promise.all([
      supabase
        .from('messages')
        .select('created_at')
        .eq('organization_id', request.organizationId),
      supabase
        .from('conversations')
        .select('started_at')
        .eq('organization_id', request.organizationId),
    ]);

    if (messagesResult.error) return next(messagesResult.error);
    if (conversationsResult.error) return next(conversationsResult.error);

    const now = new Date();
    const weekStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));

    const dayBuckets = Array.from({ length: 7 }).map((_, idx) => {
      const date = startOfDay(new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + idx));
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const messages = (messagesResult.data || []).filter(row => {
        const created = new Date(row.created_at);
        return created >= date && created < nextDate;
      }).length;

      const conversations = (conversationsResult.data || []).filter(row => {
        const created = new Date(row.started_at);
        return created >= date && created < nextDate;
      }).length;

      return {
        name: formatWeekday(date),
        date: date.toISOString(),
        mensagens: messages,
        conversas: conversations,
      };
    });

    const hourBuckets = Array.from({ length: 24 }).map((_, hour) => {
      const messages = (messagesResult.data || []).filter(row => new Date(row.created_at).getHours() === hour).length;
      const conversations = (conversationsResult.data || []).filter(row => new Date(row.started_at).getHours() === hour).length;

      return {
        name: formatHour(hour),
        mensagens: messages,
        conversas: conversations,
      };
    });

    const totalMessages = dayBuckets.reduce((sum, row) => sum + row.mensagens, 0);
    const totalConversations = dayBuckets.reduce((sum, row) => sum + row.conversas, 0);

    const mostActiveDay = [...dayBuckets].sort((a, b) => b.mensagens - a.mensagens)[0]?.name || '-';
    const mostActiveHour = [...hourBuckets].sort((a, b) => b.mensagens - a.mensagens)[0]?.name || '-';

    res.json({
      daily: dayBuckets,
      hourly: hourBuckets,
      kpis: {
        totalMessages,
        totalConversations,
        mostActiveDay,
        mostActiveHour,
      },
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});
