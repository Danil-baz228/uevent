FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY apps/api apps/api

RUN npm run build:api

ENV NODE_ENV=production
ENV PORT=4000

CMD ["npm", "--workspace", "@uevent/api", "run", "start"]

