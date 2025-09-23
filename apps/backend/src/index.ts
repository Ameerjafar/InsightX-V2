import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors';
import { routes } from './routes/routes';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/v1', routes);

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});




