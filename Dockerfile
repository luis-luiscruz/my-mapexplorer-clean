# Dockerfile simplificado usando imagem base com Chrome e ChromeDriver
FROM selenium/standalone-chrome:latest

# Instala Python e pip
USER root
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    ln -sf python3 /usr/bin/python && \
    ln -sf pip3 /usr/bin/pip

# Instala Node.js e npm
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && \
    apt-get install -y nodejs && \
    node -v && npm -v

# Set workdir
WORKDIR /app

# Copia backend e scripts
COPY backend/ ./backend/

# Instala dependências Python
RUN pip install --upgrade pip && \
    pip install -r backend/scripts/requirements.txt

# Expose porta 3010 (backend e frontend juntos)
EXPOSE 3010

# Instalar dependências do frontend
COPY package.json package-lock.json ./
RUN npm install

# Copia arquivos do frontend após instalar dependências
COPY index.html ./
COPY src/ ./src/
COPY vite.config.ts ./

# Build do frontend
RUN npm run build

# Copiar build do frontend para backend/public
RUN mkdir -p backend/public && cp -r dist/* backend/public/

# Start backend (Node.js) e manter container ativo
CMD ["node", "backend/database/server.js"]
