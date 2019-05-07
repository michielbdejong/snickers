# Snickers-proxy

[![Greenkeeper badge](https://badges.greenkeeper.io/michielbdejong/snickers.svg)](https://greenkeeper.io/)

This proxy takes its config from `./config.json`, and then listens on ports 443 and 80.
When a request comes in on http port 80, it is redirected to https port 443.
It will use certificates from `/etc/snitch/<domain.com>/`. If there is no TLS certificate
there, it will try to register one through [LetsEncrypt](https://letsencrypt.org/).

It will then pull the necessary
Docker image from https://registry.hub.docker.com/repos/indiehosters/ (e.g. 'indiehosters/lamp'
for application 'lamp'), and create and start a container. Once the container is started, it
will proxy the https request to port 80 on the container, which was still waiting to be proxied.

The important data of the container (for instance a dump of the database) will be stored on the
host system under /data/domains/<domain.com>.

Once a container is running for a domain name, it obviously proxies all traffic to it directly.
If this container exists but is stopped, it will start it before proxying the request.

In the current version containers will keep running forever, but the idea is to automatically stop
and destroy containers when:

* a container has been running for a long time without receiving any network requests
* there are too many containers running
* there is little free memory left on the host system

Before stopping a container, it will call `/snapshot.sh` inside the container, to give the container
a chance to dump its database to disk before it is stopped and destroyed.

## Usage

````bash
git clone https://github.com/michielbdejong/snickers-proxy
cd snickers-proxy
npm install
cp example/config.json .
sudo cp -r example/snitch /etc
sudo mkdir -p /data/domains
````

If you are trying this out on localhost, then add a line '127.0.0.1 test.com' into your /etc/hosts. If
you run this in production then you obviously want to configure the real domains in config.json, and
put real certificates under /etc/snitch.

Once all of this is set up, run:
````bash
sudo node snickers
````

Now run:

````bash
curl -kI https://test.com/ # you should see a 403 Forbidden response
sudo cp example/index.html /data/domains/test.com/lamp/www-content/
curl -kI https://test.com/ # you should see a 200 OK response
sudo docker ps # a container named 'test.com' should be running
````

# Requirements

Snickers requires Docker 1.3+, nodejs, and the packages it installs when you run `npm install` in the root of this repo. See my [hosting](https://github.com/michielbdejong/hosting) repo for more details on how I use this proxy to host static and dynamic sites. Use at your own risk.

Each time you configure a new domain, update `config.json`, which Snicker will load in once every minute.

To add a domain, it's not necessary to restart snickers. Just make sure it exists under `/data/domains`, add it in config.json,
and within the next 60 seconds, snickers will have picked it up and started the deploy.

By default, a LetsEncrypt cert will be used (this only works if the domain is a real FQDN and actually points to the server with
a DNS record). To install a different TLS certificate (for instance from StartSSL),
concatenate the public cert into `/etc/snitch/<example.com>/cert.pem`, the private key into
`/etc/snitch/<example.com>/key.pem`, and the chain cert (if any) into
`/etc/snitch/<example.com>/ca.pem`. Snickers will scan this folder every 10 minutes, and start using the new cert when it
finds it.

It's probably a good idea to save your config.json to a private git repo, and if you use StartSSL or other
hand-registered certs, you may want to do the same with /etc/snitch.
