# Snickers-proxy

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
sudo docker exec -i -t test.com /bin/bash # you can go into the container and run `ls /data/ ; mysqldump --all-databases > /data/dump.sql`
````

# Requirements

Snickers requires Docker 1.3+, nodejs, and the packages it installs when you run `npm install` in the root of this repo. I use screen to
run `node ./snickers` in a loop (configure the server to restart this screen on startup, in case it reboots).

For instance on a Ubuntu 14.10-x64 (2 CPUs, 2Gb RAM, 40Gb disk, from [Vultr](https://www.vultr.com/pricing/)), run:

````bash
apt-get update && apt-get upgrade
apt-get -y install git nodejs npm nodejs-legacy

dpkg-reconfigure -plow unattended-upgrades
# set unattended upgrades to 'Yes'

# Install Docker:
curl -sSL https://get.docker.com/ | sh
````

# Running in production

To make sure a node process keeps running on the server after you log out and restart the server,
I recommend using a tool like pm2:

````bash
npm install -g pm2
sudo su
pm2 start snickers.js
pm2 startup
pm2 list
````

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
