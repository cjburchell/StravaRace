FROM node:10-alpine

RUN mkdir -p /usr/src/app

# Install app dependencies
COPY package.json /src/package.json
RUN cd /src; npm install

# Bundle app source
COPY . /src

EXPOSE 3000

CMD ["node", "./src/processor/processor.js"]