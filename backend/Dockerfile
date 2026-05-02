FROM node:22-slim

RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-dejavu \
    fonts-liberation \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

RUN which soffice
RUN soffice --version

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 10000

CMD ["node", "src/server.js"]