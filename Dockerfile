FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY server/package.json server/tsconfig.json server/
RUN cd server && npm install

COPY client/package.json client/
RUN cd client && npm install

COPY server/src server/src
COPY client/src client/src
COPY client/index.html client/vite.config.ts client/tsconfig*.json client/
RUN cd client && npm run build
RUN cd server && npx tsc

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
