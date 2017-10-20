FROM hub.c.163.com/public/nodejs:8.1.2

RUN apt-get update && apt-get install -y git

RUN mkdir -p /usr/src/node
WORKDIR /usr/src/node
COPY . /usr/src/node
RUN npm install
RUN npm install -g typescript 
RUN npm install -g pm2
RUN tsc
EXPOSE 9016
ENTRYPOINT ["pm2","start","build/app.js","game_server/majiang/app.js"]