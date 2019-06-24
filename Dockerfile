FROM ubuntu
# ...
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && \
    apt-get -y install gcc mono-mcs && \
    rm -rf /var/lib/apt/lists/*
RUN apt-get update && \
    apt-get install aptitude && \
    aptitude install winehq-stable
FROM node:10.13.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .


EXPOSE 3000

CMD ["npm", "start"]
