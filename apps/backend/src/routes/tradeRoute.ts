import express from 'express';
import { closeTradeController, createTradeController } from '../controllers/tradeController';

export const tradeRoute = express.Router();
tradeRoute.use('/create', createTradeController)
tradeRoute.use('/close', closeTradeController)


