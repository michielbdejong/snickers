FROM lamp
RUN apt-get update \
	&& echo "postfix postfix/main_mailer_type string 'Internet site'" | debconf-set-selections \
	&& echo "postfix postfix/mailname string 'HOSTNAME.EXAMPLE.COM'" | debconf-set-selections \
	&& echo "postfix postfix/root_address string 'ROOTMAIL@EXAMPLE.COM'" | debconf-set-selections \
	&& apt-get install -yq \
		build-essential \
		exiftran \
		libpcre3-dev \
		php5 \
		php5-dev \
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


COPY install-app.sh /install-app.sh
COPY launch-app.sh /launch-app.sh
