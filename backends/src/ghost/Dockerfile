FROM node

RUN wget https://ghost.org/zip/ghost-0.5.8.zip
RUN apt-get update -yq \
	&& apt-get install -yq \
		zip
RUN mkdir /app && cd /app && unzip ../ghost-0.5.8.zip
RUN cd /app && npm install --production

COPY config.js /app/config.js
COPY run.sh /run.sh

EXPOSE 80

CMD /run.sh
