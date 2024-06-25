FROM node

RUN npm install -g typescript

WORKDIR /Backend

COPY Backend/package*.json ./
COPY Backend/tsconfig.json ./
RUN npm install
COPY ./Backend .

WORKDIR /SimpleVideo

COPY SimpleVideo/package*.json ./ 
COPY SimpleVideo/tsconfig.json ./
RUN npm install
COPY ./SimpleVideo .



CMD ["sh", "-c", "(cd /Backend && npm run start)"]

EXPOSE 3000
