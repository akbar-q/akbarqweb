FROM node:20-alpine

WORKDIR /app

COPY attendance-backend/package*.json ./attendance-backend/
WORKDIR /app/attendance-backend
RUN npm ci --omit=dev

COPY attendance-backend ./
COPY attendance-demo ../attendance-demo
COPY assets ../assets

EXPOSE 3001

ENTRYPOINT ["npm", "run", "start"]
