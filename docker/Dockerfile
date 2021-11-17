FROM node:lts-slim as setup
WORKDIR /home/app
RUN apt-get -y -qq update && apt-get -y -qq upgrade && apt-get -y -qq install git procps make > /dev/null
RUN git init

FROM setup as install
COPY scripts/install-browsers.sh scripts/install-browsers.sh
RUN bash scripts/install-browsers.sh
COPY package*.json ./
COPY patches patches
RUN npm ci --unsafe-perm=true
COPY . .

FROM install as build
CMD npm run build
