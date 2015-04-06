FROM node:0.10

COPY . /app
RUN cd /app && npm install

EXPOSE 80
EXPOSE 443
CMD cd /app && node snickers
