FROM node:21-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install
RUN npm install -g ts-node
COPY . .

EXPOSE 4000

ENV NODE_ENV=development
ENV PORT=4000

CMD ["npm", "run", "start"]
