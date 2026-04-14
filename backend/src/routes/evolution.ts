import { Router } from 'express';
import { z } from 'zod';

import { createEvolutionInstance, sendEvolutionMessage } from '../services/evolutionService.js';
import type { EvolutionInstanceRequest, EvolutionMessageRequest } from '../types/evolution.js';

const createInstanceSchema = z.object({
  instanceName: z.string().min(1),
});

const sendMessageSchema = z.object({
  instanceName: z.string().min(1),
  number: z.string().min(1),
  text: z.string().min(1),
});

export const evolutionRouter = Router();

evolutionRouter.post('/instances', async (req, res, next) => {
  try {
    const payload: EvolutionInstanceRequest = createInstanceSchema.parse(req.body);
    const response = await createEvolutionInstance(payload);

    res.json(response);
  } catch (error) {
    next(error);
  }
});

evolutionRouter.post('/messages', async (req, res, next) => {
  try {
    const payload: EvolutionMessageRequest = sendMessageSchema.parse(req.body);
    const response = await sendEvolutionMessage(payload);

    res.json(response);
  } catch (error) {
    next(error);
  }
});