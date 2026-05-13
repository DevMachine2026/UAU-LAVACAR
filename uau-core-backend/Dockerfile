# Etapa 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instala as dependências (incluindo dev dependencies para build)
RUN npm install

# Copia o resto do código
COPY . .

# Gera o Prisma Client e compila o código NestJS
RUN npx prisma generate
RUN npm run build

# Etapa 2: Produção
FROM node:20-alpine

WORKDIR /app

# Instala o openssl necessário para o prisma
RUN apk add --no-cache openssl

# Copia o package.json e package-lock.json
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm install --omit=dev

# Copia o schema do Prisma e o Prisma Client gerado na etapa anterior
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copia a build final
COPY --from=builder /app/dist ./dist

# Garante a geração final e os tipos corretos
RUN npx prisma generate

EXPOSE 3000

# Executa as migrations do Prisma (opcional, pode ser feito no start command do Render)
# e inicializa a aplicação
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
