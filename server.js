require('dotenv').config();
const app = require('./src/interface/http/server');

// O Render define a porta automaticamente
const PORT = process.env.PORT || 3000;

// Inicia o servidor (Essencial para não dar erro de Exit)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Servidor rodando na porta ${PORT}`);
});