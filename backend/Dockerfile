FROM node:22-slim

# 🔥 IMPORTANTE: evitar problemas de instalação
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-core \
    libreoffice-common \
    fonts-dejavu \
    fonts-liberation \
    fontconfig \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 🔎 FORÇA O BUILD A FALHAR SE NÃO INSTALAR
RUN which soffice || (echo "LibreOffice NÃO instalado!" && exit 1)
RUN soffice --version

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 10000

CMD ["sh", "-c", "npx prisma generate && node src/server.js"]