import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend :${PORT}`));
