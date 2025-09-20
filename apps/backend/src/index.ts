import express from 'express'
import dotenv from 'dotenv';
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

app.listen(3000, () => {
  console.log("Listening on http://localhost:5000");
});




