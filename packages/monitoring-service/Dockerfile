FROM node:16 AS build
WORKDIR /usr/src/app
COPY ./ ./
RUN yarn install
RUN yarn build

FROM node:16-alpine
ENV NODE_ENV production
ENV BACKUP_FOLDER /tmp
RUN apk add --no-cache postgresql-client
RUN yarn global add typeorm@^0.3.7
WORKDIR /usr/src/app
COPY --from=build /usr/src/app/dist ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY dump.sh dump.sh
RUN dos2unix dump.sh
COPY restore.sh restore.sh
RUN dos2unix restore.sh
COPY migrate.sh migrate.sh
RUN dos2unix migrate.sh
COPY init.sh init.sh
RUN dos2unix init.sh
CMD ["sh", "./init.sh"]