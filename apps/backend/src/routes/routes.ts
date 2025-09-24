import express from 'express';
import { signin, signup } from '../controllers/authController';
import { tradeRoute } from './tradeRoute';
import { getUsdBalance, getAssetBalances, getSupportedAssets, getOpenTrades } from '../controllers/balanceController';

export const routes = express.Router();

routes.use('/signup', signup);
routes.use('/signin', signin);
routes.use('/trade', tradeRoute);

routes.get('/balance/usd', getUsdBalance);
routes.get('/balance', getAssetBalances);
routes.get('/supportedAssets', getSupportedAssets);
routes.get('/orders/balance', getAssetBalances);
routes.get('/trade/open', getOpenTrades);

