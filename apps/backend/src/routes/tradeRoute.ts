import express from 'express';
import { closeTradeController, createTradeController, getAllTrades } from '../controllers/tradeController';
export const tradeRoute = express.Router();
tradeRoute.post('/create', createTradeController);
tradeRoute.post('/close', closeTradeController);
tradeRoute.get("/getTrade", getAllTrades)

