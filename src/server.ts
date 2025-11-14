import { testConnection } from './models/database.js';

async function startServer() {
  // Test database connection first
  console.log('🔌 Testing database connection...');
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('❌ Cannot start server without database connection');
    process.exit(1);
  }

  console.log('✅ Database connected successfully!');
  console.log('🚀 Starting Trading Calculator Backend...');
  
  // Dynamically import the app after database connection is confirmed
  const { default: app } = await import('./app.js');
  const PORT = process.env.PORT || 3001;
  
  app.listen(PORT, () => {
    console.log(`🎯 Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`💹 Trade API: http://localhost:${PORT}/api/trades/calculate`);
  });
}

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer().catch(console.error);