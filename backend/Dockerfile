FROM node:22-slim

RUN apt-get update && apt-get install -y \
    openssl \
    libreoffice \
    libreoffice-writer \
    fonts-dejavu \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=10000
ENV LIBREOFFICE_PATH=soffice

EXPOSE 10000

CMD ["sh", "-c", "npx prisma generate && node src/server.js"]