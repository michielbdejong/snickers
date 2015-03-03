FROM debian:jessie

ENV DEBIAN_FRONTEND noninteractive

# pwgen was the only package wordpress installed on top, and since it's so small, to keep the
# rebuilds fast, I moved it here. Now, this here is the only `apt-get update` we have to do when building
# the whole debian:jessie -> lamp -> wordpress dependency chain.
RUN apt-get update \
	&& echo "postfix postfix/main_mailer_type string 'Internet site'" | debconf-set-selections \
	&& echo "postfix postfix/mailname string 'HOSTNAME.EXAMPLE.COM'" | debconf-set-selections \
	&& echo "postfix postfix/root_address string 'ROOTMAIL@EXAMPLE.COM'" | debconf-set-selections \
	&& apt-get -yq install \
		apache2 \
		curl \
		git \
		libapache2-mod-php5 \
		mysql-client \
		mysql-server-5.5 \
		php-apc \
		php-pear \
		php5-curl \
		php5-gd \
		php5-imagick \
		php5-intl \
		php5-json \
		php5-mcrypt \
		php5-mysql \
		php5-xmlrpc \
		postfix \
		pwgen \
	&& rm -rf /var/lib/apt/lists/*

# Add image configuration and scripts
COPY apache.conf /etc/apache2/sites-enabled/000-default.conf
COPY run.sh /run.sh
COPY backup.sh /backup.sh
RUN sed -i "s/variables_order.*/variables_order = \"EGPCS\"/g" /etc/php5/apache2/php.ini \
	&& a2enmod rewrite

CMD ["/run.sh"]
EXPOSE 80
