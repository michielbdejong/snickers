FROM michielbdejong/lamp-git

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update \
	&& apt-get -yq install \
		pwgen \
	&& rm -rf /var/lib/apt/lists/*

RUN cd /root && curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar

COPY init/wordpress.sh /init/wordpress.sh

CMD sh /init/wordpress.sh https://exampledomain.com/ "Example Domain" "example" "example@elsewhere.com"
