FROM node:16.14 as build-stage

RUN apt update && apt install git -y

WORKDIR /var/
COPY . /var/

RUN npm install
RUN npm run build

FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /var/dist /usr/share/nginx/html
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
