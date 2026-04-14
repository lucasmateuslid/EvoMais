import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';

import { config } from '../config.js';
import { logger } from '../logger.js';
import { adminSupabase } from '../services/supabase.js';

const tenantRoomPrefix = 'tenant:';

let io: Server | null = null;

export function initializeRealtime(server: HttpServer) {
  if (!config.ENABLE_WEBSOCKETS) {
    logger.info('realtime websocket disabled by configuration');
    return null;
  }

  io = new Server(server, {
    cors: {
      origin: config.CORS_ORIGIN,
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    const token = String(socket.handshake.auth?.token || '').trim();

    if (!token) {
      return next(new Error('unauthorized'));
    }

    const { data: authData, error: authError } = await adminSupabase.auth.getUser(token);

    if (authError || !authData.user) {
      return next(new Error('unauthorized'));
    }

    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('organization_id, role')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile?.organization_id) {
      return next(new Error('forbidden'));
    }

    socket.data.userId = authData.user.id;
    socket.data.organizationId = profile.organization_id;
    socket.data.role = profile.role;

    return next();
  });

  io.on('connection', socket => {
    const organizationId = socket.data.organizationId as string | undefined;

    if (!organizationId) {
      socket.disconnect(true);
      return;
    }

    socket.join(`${tenantRoomPrefix}${organizationId}`);

    logger.info(
      {
        socketId: socket.id,
        organizationId,
      },
      'realtime client connected',
    );

    socket.on('disconnect', reason => {
      logger.info(
        {
          socketId: socket.id,
          organizationId,
          reason,
        },
        'realtime client disconnected',
      );
    });
  });

  logger.info('realtime websocket initialized');
  return io;
}

export function emitTenantEvent(organizationId: string, event: string, payload: unknown) {
  if (!io || !organizationId) {
    return;
  }

  io.to(`${tenantRoomPrefix}${organizationId}`).emit(event, payload);
}

export async function shutdownRealtime() {
  if (!io) {
    return;
  }

  await io.close();
  io = null;
}
