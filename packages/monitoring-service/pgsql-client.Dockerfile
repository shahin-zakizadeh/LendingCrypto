FROM alpine:latest

RUN mkdir -p /home/hovoh

WORKDIR /home/hovoh/

RUN apk add --no-cache postgresql-client
