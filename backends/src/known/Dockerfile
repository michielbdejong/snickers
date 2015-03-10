FROM lamp

RUN curl -O https://codeload.github.com/idno/Known/tar.gz/v0.7.5 && mv v0.7.5 known.tgz

COPY install-application.sh /install-application.sh
COPY config.ini /config.ini
