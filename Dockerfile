FROM ubuntu
# ...
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && \
    apt-get -y install make python build-essential && \
    apt-get -y install gcc mono-mcs && \
    rm -rf /var/lib/apt/lists/*
#  RUN  aptitude install wine
# RUN apt-get update && \
    # apt-get install aptitude && \
FROM node:10.13.0

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .


EXPOSE 3000

CMD ["npm", "start"]
