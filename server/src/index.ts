import app from './app.js';

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Document Editor Server running on http://localhost:${PORT}`);
  });
}

export default app;
