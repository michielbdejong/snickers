FROM lamp

ENV DEBIAN_FRONTEND noninteractive

# You could argue that it is inefficient to download this file each time a rebuild is triggered,
# and maybe this file should be stored somewhere on the server.
# But on the other hand that would require extra complexity (I don't want to just add it into
# this repo), and it's also good to always have its latest version. So for now, I'll keep it this way
RUN cd /root && curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar

COPY install-application.sh /install-application.sh
