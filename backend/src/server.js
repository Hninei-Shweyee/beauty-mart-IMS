import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'beauty-mart-inventory-api' });
});

app.use('/api', routes);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});
