import express from 'express';
import { signin, signup } from '../auth/authController';
export const routes = express.Router();

routes.use('/signup', signup);

routes.use('signin', signin);



