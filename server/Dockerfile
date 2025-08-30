FROM node:latest 
#working directory in image
WORKDIR /server 
COPY . . 

RUN npm install 

EXPOSE 3000

CMD ["node", "index.js"]