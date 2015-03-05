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
		wget \
	&& rm -rf /var/lib/apt/lists/*
RUN a2enmod rewrite \
	&& a2enmod deflate \
	&& a2enmod expires \
	&& a2enmod headers \
	&& pecl install oauth && mkdir -p /etc/php5/apache2/conf.d/ && echo "extension=oauth.so" >> /etc/php5/apache2/conf.d/oauth.ini \
	&& wget https://github.com/photo/frontend/tarball/master -O openphoto.tar.gz \
	&& tar -zxvf openphoto.tar.gz > /dev/null 2>&1 \
	&& mv photo-frontend-* /var/www/openphoto \
	&& rm openphoto.tar.gz \
	&& mkdir /var/www/openphoto/src/userdata \
	&& chown www-data:www-data /var/www/openphoto/src/userdata \
	&& mkdir /var/www/openphoto/src/html/assets/cache  \
	&& chown www-data:www-data /var/www/openphoto/src/html/assets/cache \
	&& mkdir /var/www/openphoto/src/html/photos \
	&& chown www-data:www-data /var/www/openphoto/src/html/photos \
	&& cp /var/www/openphoto/src/configs/openphoto-vhost.conf /etc/apache2/sites-available/openphoto.conf \
	&& sed 's/\/path\/to\/openphoto\/html\/directory/\/var\/www\/openphoto\/src\/html/g' /var/www/openphoto/src/configs/openphoto-vhost.conf > /etc/apache2/sites-available/openphoto.conf \
	&& a2dissite 000-default \
	&& a2ensite openphoto \
	&& sed -e 's/file_uploads.*/file_uploads = On/g' -e 's/upload_max_filesize.*/upload_max_filesize = 16M/g' -e 's/post_max_size.*/post_max_size = 16M/g' /etc/php5/apache2/php.ini > /etc/php5/apache2/php.ini.tmp \
	&& mv /etc/php5/apache2/php.ini.tmp /etc/php5/apache2/php.ini


COPY run.sh /run.sh
COPY backup.sh /backup.sh

CMD ["/run.sh"]
EXPOSE 80
