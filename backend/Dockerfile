ARG BUILD_SCRIPT=build

FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./
RUN npm install

FROM deps AS build
ARG BUILD_SCRIPT
COPY tsconfig.json ./
COPY tsconfig.admin.json ./
COPY src ./src
RUN npm run ${BUILD_SCRIPT}

FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/index.js"]
