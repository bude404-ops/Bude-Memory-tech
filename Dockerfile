FROM node:20-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN npm install

COPY src ./src
RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV DATABASE_URL=postgresql://localhost:5432/budememory

CMD ["node", "dist/api/server.js"]
