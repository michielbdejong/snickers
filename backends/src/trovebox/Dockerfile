FROM ubuntu
RUN apt-get update \
	&& echo "postfix postfix/main_mailer_type string 'Internet site'" | debconf-set-selections \
	&& echo "postfix postfix/mailname string 'HOSTNAME.EXAMPLE.COM'" | debconf-set-selections \
	&& echo "postfix postfix/root_address string 'ROOTMAIL@EXAMPLE.COM'" | debconf-set-selections \
	&& apt-get install -yq \
		apache2 \
		build-essential \
		curl \
		exiftran \
		git \
		libapache2-mod-php5 \
		libpcre3-dev \
		mysql-server \
		mysql-client \
		php5 \
		php5-curl \
		php5-dev \
		php5-imagick \
		php5-gd \
		php5-mcrypt \
		php5-mysql \
		php-pear \
		php-apc \
		postfix \
		pwgen \
		wget \
	&& rm -rf /var/lib/apt/lists/*
RUN a2enmod rewrite \
	&& a2enmod deflate \
	&& a2enmod expires \
	&& a2enmod headers \
	&& pecl install oauth && mkdir -p /etc/php5/apache2/conf.d/ && echo "extension=oauth.so" >> /etc/php5/apache2/conf.d/oauth.ini \
	&& wget https://github.com/photo/frontend/tarball/master -O openphoto.tar.gz \
	&& sed -e 's/file_uploads.*/file_uploads = On/g' -e 's/upload_max_filesize.*/upload_max_filesize = 16M/g' -e 's/post_max_size.*/post_max_size = 16M/g' /etc/php5/apache2/php.ini > /etc/php5/apache2/php.ini.tmp \
	&& mv /etc/php5/apache2/php.ini.tmp /etc/php5/apache2/php.ini

COPY run.sh /run.sh
COPY backup.sh /backup.sh
COPY install-application.sh /install-application.sh
COPY launch-application.sh /launch-application.sh
COPY config.ini /config.ini
COPY apache.conf /apache.conf
RUN sed 's/\/path\/to\/openphoto\/html\/directory/\/data\/www-content\/src\/html/g' apache.conf > /etc/apache2/sites-available/openphoto.conf \
	&& a2dissite 000-default \
	&& a2ensite openphoto
RUN ln -s /etc/php5/mods-available/mcrypt.ini /etc/php5/apache2/conf.d/20-mcrypt.ini

CMD ["/run.sh"]
EXPOSE 80
