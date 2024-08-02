FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
EXPOSE 9090
CMD [ "npm","start" ]