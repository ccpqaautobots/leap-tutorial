# Dockerizing NodeJS: Dockerfile for building NodeJS images
# Based on node:boron (node -v 6.10.3)
FROM node:boron

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

EXPOSE 8080

CMD ["npm", "run", "start"]