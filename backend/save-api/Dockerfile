FROM node:22-alpine
WORKDIR /workspace
COPY package.json package-lock.json* tsconfig.base.json ./
COPY backend/save-api/package.json backend/save-api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev", "--workspace=@moribito/save-api"]
