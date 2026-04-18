import { Router } from 'express';

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function formatWeekday(date: Date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'short' });
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

function safeParseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildDateBuckets(start: Date, end: Date) {
  const buckets: Array<{ date: Date; next: Date; label: string; key: string }> = [];
  const cursor = startOfDay(start);
  const endDate = endOfDay(end);

  while (cursor <= endDate) {
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + 1);
    buckets.push({
      date: new Date(cursor),
      next,
      label: formatShortDate(cursor),
      key: cursor.toISOString().slice(0, 10),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}

function rollingAverage(values: number[], windowSize = 3) {
  return values.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = values.slice(start, index + 1).filter(value => value > 0);
    if (window.length === 0) return 0;
    return Number((window.reduce((sum, value) => sum + value, 0) / window.length).toFixed(1));
  });
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

    const now = new Date();
    const startParam = typeof req.query.start === 'string' ? req.query.start : undefined;
    const endParam = typeof req.query.end === 'string' ? req.query.end : undefined;
    const sellerParam = typeof req.query.sellerIds === 'string' ? req.query.sellerIds : undefined;

    const parsedStart = safeParseDate(startParam);
    const parsedEnd = safeParseDate(endParam);

    let rangeStart = parsedStart
      ? startOfDay(parsedStart)
      : startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
    let rangeEnd = parsedEnd ? endOfDay(parsedEnd) : endOfDay(now);

    if (rangeStart > rangeEnd) {
      const temp = rangeStart;
      rangeStart = rangeEnd;
      rangeEnd = temp;
    }

    const sellerIds = sellerParam
      ? sellerParam.split(',').map(value => value.trim()).filter(Boolean)
      : [];

    let conversationsQuery = supabase
      .from('conversations')
      .select('id, seller_id, status, started_at, last_message_at, closed_at, channel, tags')
      .eq('organization_id', request.organizationId)
      .lte('started_at', rangeEnd.toISOString());

    let messagesQuery = supabase
      .from('messages')
      .select('id, seller_id, conversation_id, sender_type, created_at')
      .eq('organization_id', request.organizationId);

    if (sellerIds.length > 0) {
      conversationsQuery = conversationsQuery.in('seller_id', sellerIds);
      messagesQuery = messagesQuery.in('seller_id', sellerIds);
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
      conversationsQuery,
      messagesQuery,
    ]);

    if (dealsResult.error) return next(dealsResult.error);
    if (sellersResult.error) return next(sellersResult.error);
    if (conversationsResult.error) return next(conversationsResult.error);
    if (messagesResult.error) return next(messagesResult.error);

    const deals = dealsResult.data || [];
    const sellers = sellersResult.data || [];
    const conversations = conversationsResult.data || [];
    const messages = messagesResult.data || [];

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

    const pendingStatuses = new Set(['open', 'in_progress']);
    const resolvedStatuses = new Set(['resolved', 'closed']);
    const normalizeStatus = (value?: string | null) => (value || '').toLowerCase();

    const normalizedConversations = conversations.map(conversation => {
      const startedAt = new Date(conversation.started_at);
      const lastMessageAt = conversation.last_message_at ? new Date(conversation.last_message_at) : null;
      const explicitClosedAt = conversation.closed_at ? new Date(conversation.closed_at) : null;
      const status = normalizeStatus(conversation.status);
      const fallbackClosedAt = !explicitClosedAt && resolvedStatuses.has(status) && lastMessageAt ? lastMessageAt : null;

      return {
        ...conversation,
        status,
        startedAt,
        lastMessageAt,
        closedAt: explicitClosedAt || fallbackClosedAt,
        channel: conversation.channel || 'whatsapp',
        tags: Array.isArray(conversation.tags) ? conversation.tags.filter(Boolean) : [],
      };
    });

    const buckets = buildDateBuckets(rangeStart, rangeEnd);
    const conversationsInRange = normalizedConversations.filter(conversation =>
      conversation.startedAt >= rangeStart && conversation.startedAt <= rangeEnd,
    );

    const pendingBefore = normalizedConversations.filter(conversation =>
      pendingStatuses.has(conversation.status) && conversation.startedAt < rangeStart,
    ).length;

    const pendingAfter = normalizedConversations.filter(conversation =>
      pendingStatuses.has(conversation.status) && conversation.startedAt <= rangeEnd,
    ).length;

    const newInPeriod = conversationsInRange.length;
    const resolvedInPeriod = normalizedConversations.filter(conversation => {
      if (!resolvedStatuses.has(conversation.status) || !conversation.closedAt) {
        return false;
      }
      return conversation.closedAt >= rangeStart && conversation.closedAt <= rangeEnd;
    }).length;

    const capacity = buckets.map(bucket => {
      const newCount = normalizedConversations.filter(conversation =>
        conversation.startedAt >= bucket.date && conversation.startedAt < bucket.next,
      ).length;

      const resolvedCount = normalizedConversations.filter(conversation =>
        conversation.closedAt && conversation.closedAt >= bucket.date && conversation.closedAt < bucket.next,
      ).length;

      const pendingCount = normalizedConversations.filter(conversation =>
        conversation.startedAt < bucket.next && (!conversation.closedAt || conversation.closedAt >= bucket.next),
      ).length;

      return {
        date: bucket.key,
        label: bucket.label,
        newCount,
        resolvedCount,
        pendingCount,
      };
    });

    const conversationIdsInRange = new Set(conversationsInRange.map(conversation => conversation.id));
    const messagesByConversation = new Map<string, Array<{ sender_type: string; created_at: string }>>();

    messages.forEach(message => {
      if (!message.conversation_id || !conversationIdsInRange.has(message.conversation_id)) {
        return;
      }

      const bucket = messagesByConversation.get(message.conversation_id) || [];
      bucket.push({ sender_type: message.sender_type, created_at: message.created_at });
      messagesByConversation.set(message.conversation_id, bucket);
    });

    const waitTimeByDay = new Map<string, number[]>();
    const waitTimesAll: number[] = [];

    conversationsInRange.forEach(conversation => {
      const conversationMessages = messagesByConversation.get(conversation.id) || [];
      let firstContact: Date | null = null;
      let firstSeller: Date | null = null;

      conversationMessages.forEach(message => {
        const createdAt = new Date(message.created_at);
        if (message.sender_type === 'contact') {
          if (!firstContact || createdAt < firstContact) {
            firstContact = createdAt;
          }
        }

        if (message.sender_type === 'seller') {
          if (!firstSeller || createdAt < firstSeller) {
            firstSeller = createdAt;
          }
        }
      });

      if (!firstContact || !firstSeller || firstSeller < firstContact) {
        return;
      }

      const waitMinutes = Number(((firstSeller.getTime() - firstContact.getTime()) / 60000).toFixed(1));
      waitTimesAll.push(waitMinutes);

      const dayKey = conversation.startedAt.toISOString().slice(0, 10);
      const dayBucket = waitTimeByDay.get(dayKey) || [];
      dayBucket.push(waitMinutes);
      waitTimeByDay.set(dayKey, dayBucket);
    });

    const waitDailyBase = buckets.map(bucket => {
      const values = waitTimeByDay.get(bucket.key) || [];
      const averageMinutes = values.length > 0
        ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
        : 0;

      return {
        date: bucket.key,
        label: bucket.label,
        averageMinutes,
      };
    });

    const waitTrends = rollingAverage(waitDailyBase.map(item => item.averageMinutes));
    const waitDaily = waitDailyBase.map((item, index) => ({
      ...item,
      trendMinutes: waitTrends[index] || 0,
    }));

    const waitAverage = waitTimesAll.length > 0
      ? Number((waitTimesAll.reduce((sum, value) => sum + value, 0) / waitTimesAll.length).toFixed(1))
      : 0;

    const durationByDay = new Map<string, number[]>();
    const durationsAll: number[] = [];

    normalizedConversations.forEach(conversation => {
      if (!conversation.closedAt) {
        return;
      }

      if (conversation.closedAt < rangeStart || conversation.closedAt > rangeEnd) {
        return;
      }

      const durationMinutes = Number(((conversation.closedAt.getTime() - conversation.startedAt.getTime()) / 60000).toFixed(1));
      if (durationMinutes < 0) {
        return;
      }

      durationsAll.push(durationMinutes);

      const dayKey = conversation.closedAt.toISOString().slice(0, 10);
      const dayBucket = durationByDay.get(dayKey) || [];
      dayBucket.push(durationMinutes);
      durationByDay.set(dayKey, dayBucket);
    });

    const durationDailyBase = buckets.map(bucket => {
      const values = durationByDay.get(bucket.key) || [];
      const averageMinutes = values.length > 0
        ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1))
        : 0;

      return {
        date: bucket.key,
        label: bucket.label,
        averageMinutes,
      };
    });

    const durationTrends = rollingAverage(durationDailyBase.map(item => item.averageMinutes));
    const durationDaily = durationDailyBase.map((item, index) => ({
      ...item,
      trendMinutes: durationTrends[index] || 0,
    }));

    const durationAverage = durationsAll.length > 0
      ? Number((durationsAll.reduce((sum, value) => sum + value, 0) / durationsAll.length).toFixed(1))
      : 0;

    const channelCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();

    conversationsInRange.forEach(conversation => {
      const channel = conversation.channel || 'whatsapp';
      channelCounts.set(channel, (channelCounts.get(channel) || 0) + 1);

      conversation.tags.forEach(tag => {
        const normalizedTag = String(tag).trim();
        if (!normalizedTag) {
          return;
        }
        tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
      });
    });

    const channels = [...channelCounts.entries()]
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => b.count - a.count);

    const tags = [...tagCounts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);

    const hourlyVolume = Array.from({ length: 24 }).map((_, hour) => ({
      hour: formatHour(hour),
      count: 0,
    }));

    conversationsInRange.forEach(conversation => {
      const hour = conversation.startedAt.getHours();
      hourlyVolume[hour].count += 1;
    });

    const peakHour = hourlyVolume.reduce((max, entry) => (entry.count > max.count ? entry : max), hourlyVolume[0] || { hour: '-', count: 0 });
    const peakHourLabel = peakHour.count > 0 ? peakHour.hour : '-';

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
      attendance: {
        range: {
          start: rangeStart.toISOString(),
          end: rangeEnd.toISOString(),
        },
        filters: {
          sellerIds,
        },
        kpis: {
          pendingBefore,
          newInPeriod,
          resolvedInPeriod,
          pendingAfter,
        },
        capacity,
        waitTime: {
          averageMinutes: waitAverage,
          daily: waitDaily,
          totalConversations: conversationsInRange.length,
          respondedConversations: waitTimesAll.length,
        },
        duration: {
          averageMinutes: durationAverage,
          daily: durationDaily,
          concludedConversations: durationsAll.length,
        },
        channels,
        tags,
        hourlyVolume,
        peakHour: peakHourLabel,
      },
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
