FROM lamp

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update \
	&& apt-get -yq install \
		pwgen \
	&& rm -rf /var/lib/apt/lists/*

RUN cd /root && curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar

COPY init/wordpress.sh /init/do.sh
