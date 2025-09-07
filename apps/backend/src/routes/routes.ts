import express from 'express';
import { signin, signup } from '../controllers/authController';
import { tradeRoute } from './tradeRoute';
export const routes = express.Router();

routes.use('/signup', signup);

routes.use('/signin', signin);

routes.use('/trade', tradeRoute);

