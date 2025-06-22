# MapExplorer

Uma aplicação Vue.js + Node.js para exploração de mapas com dados de pontos de carregamento elétrico.

## 🚀 Tecnologias

- **Frontend**: Vue 3 + Vite + TypeScript + Tailwind CSS + DaisyUI
- **Backend**: Node.js + Express + MySQL
- **Mapas**: Leaflet.js

## 🛠️ Configuração para Desenvolvimento

### Pré-requisitos
- Node.js (versão 16 ou superior)
- Acesso a servidor MySQL remoto

### Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
cd backend && npm install
```

3. Configure o arquivo `.env` no diretório `backend/` com as credenciais do banco:
```env
PORT=3015
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_HOST=seu_host
DB_PORT=3306
DB_NAME=nome_do_banco
DB_TABLE=fast2025_mobie_cross
```

### Executar

**Desenvolvimento (frontend + backend):**
```bash
npm run start:dev
```

**Apenas frontend (porta 3010):**
```bash
npm run dev
```

**Apenas backend (porta 3015):**
```bash
npm run dev:backend
```

## 🌐 URLs

- Frontend: http://localhost:3010
- Backend: http://localhost:3015
- API Status: http://localhost:3015/api/connection-status

## 📁 Estrutura do Projeto

```
├── src/                    # Frontend Vue.js
│   ├── components/         # Componentes Vue
│   ├── composables/       # Composables Vue
│   ├── services/          # Serviços de API
│   └── hooks/             # Hooks customizados
├── backend/               # Backend Node.js
│   ├── database/          # Servidor e configuração DB
│   └── .env              # Configurações do banco (não versionado)
├── public/               # Arquivos públicos
└── package.json          # Configurações do projeto
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o frontend
- `npm run build` - Build do frontend
- `npm run dev:backend` - Inicia o backend
- `npm run start:dev` - Inicia frontend + backend simultaneamente

## 📝 Notas

- O arquivo `.env` no backend contém credenciais sensíveis e não deve ser versionado
- A aplicação usa MySQL remoto configurado via variáveis de ambiente
- Frontend usa proxy para redirecionar `/api` para o backend na porta 3015
