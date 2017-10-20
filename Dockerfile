FROM hub.c.163.com/public/nodejs:8.1.2
RUN mkdir -p /usr/src/node
WORKDIR /usr/src/node
COPY . /usr/src/node
RUN npm install --registry=https://registry.npm.taobao.org
RUN npm install -g typescript --registry=https://registry.npm.taobao.org
RUN npm install -g pm2
RUN tsc
EXPOSE 9016
ENTRYPOINT ["pm2","start","build/app.js","game_server/majiang/app.js"]