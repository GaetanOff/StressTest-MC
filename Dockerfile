FROM node:23-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --production

COPY . .

CMD ["npm", "start"]
