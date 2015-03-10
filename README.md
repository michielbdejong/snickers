# Snickers

## What I use this for

Snickers is what I use to host the personal servers of my ~ 30 IndieHosters customers.
I'm publishing this code mainly to set it free, and also to some extent in case it's useful for someone,
but I'm not implying that it will be usable for you, other than maybe
copying some of its ideas into your own piece of software. Especially the on-the-fly container activation is probably quite novel.

All the people for whom I manage a personal internet server
have their own domain name, although in a few cases I only manage a subdomain of a domain they own elsewhere themselves.
I run either Known, WordPress, ownCloud, Ghost, Cozy, or Trovebox as the main application on each domain.

I allow my customers to install any apps and plugins they want, although they only get access through the human-friendly admin
interface that is exposed by the application (no FTP or SSH access). The reason for this is that I believe that if a user of a
personal server application needs to perform systems administrator or web developer tasks, then this is a problem. Even editing html
code is something I think a user of a personal server application should never have to do. Proprietary silos also don't make you do
things like that! :) Of course, in cases where the customer runs into some limitation, we talk about it via email and find a solution,
but often this will be installing some extension that allows them to do what they want in a human-friendly way. In some cases (for
instance, importing existing blogposts into their Known application), I as their IndieHoster end up doing custom sysadmin and software
development tasks, but since I try to offer *managed* personal server hosting, I will always try to offer my users a human-friendly
user interface.

The applications run in Docker containers, because we can be pretty much sure that some of them have some sort of vulnerability
in them at any given time, so it would be too dangerous to host these things on a shared LAMP environment. To avoid wasting too much
resource (mainly virtual memory taken up by idle Apache and MySQL instances), I keep the containers stopped as much as possible. Some
domains get only a few hits a day. When a request comes in for a website whose container is stopped, snickers holds it queued,
quickly activates the necessary backend container (this takes about 100ms), queries its local IP address, checks that it's up, and proxies
the request to it.

Snickers also dumps the database of each container once an hour, and also just before it stops a container. These database dumps, plus
other user data (file uploads, custom plugins, but also the TLS certificate for the domain, the secondary email address to which email
should be forwarded), is committed to a private git repo, and pushed out to two independent backup servers.

If you request a website which snickers doesn't know about, it will query the backup servers and try to pull in the data for it, create
a backend (even build the image if necessary), start it, and proxy the request. If the git repo exists but is empty, it will initialize it.
This means migrations are as easy as switching the DNS and hitting the domain once on its new IP address.

## Usage

### WARNING: not all of this is implemented yet, so this will not yet currently work like this.

Snickers requires Docker 1.3+, nodejs, and the packages it installs when you run `npm install` in the root of this repo. I use screen to
run `node ./snickers` in a loop (configure the server to restart this screen on startup, in case it reboots).

The only configuration you need to give snickers is the location of its two backup servers. It will store data locally in `/data`, by default.

Copy `config.js.sample` to `config.js` and put in the two git servers to use for backups. Make sure these are private git servers, but
that the user as which you run snickers does have access to them.

Now run `node config.js` to generate `config.json`, which Snicker will load in once every minute.

To add a domain, it's not necessary to restart snickers. Just make sure it exists on the backup servers, add it in config.js,
run `node config`, and within the next 60 seconds, snickers will have picked it up and started the deploy.

By default, a LetsEncrypt cert will be used. To install a different TLS certificate (for instance from StartSSL),
concatenate the public cert into `/etc/letsencrypt/<example.com>/cert.pem`, the private key into
`/etc/letsencrypt/<example.com>/key.pem`, and the chain cert (if any) into
`/etc/letsencrypt/<example.com>/ca.pem`. Snickers will scan this folder every 10 minutes, and start using the new cert when it
finds it.

It's probably a good idea to save your config.js and/or config.json to a private git repo, and if you use StartSSL or other
hand-registered certs, you may want to do the same with /etc/letsencrypt.

Snickers distinguishes between the following states of a domain:

* Fresh: exists only in the config and on the backup servers
* Checked out: repo has been checked out locally but is still empty
* Installed: repo has been checked out locally and contains data

and the following states of a container:

* Built: the image for it exists
* Created: the container for it exists
* Started: the container is started
* Launched: where needed the data from the repo is loaded into the non-mounted parts of the container (db loaded from dump, etc)

If you migrate a domain from one server to another (by updating the config of the receiving server and pointing DNS),
then it will be in fresh state until the first http request for it comes in, and then it will automatically bring the domain to
checked-out state, then the container to started state, then since it detects that data is already there, it will go right ahead
and launch the application.

If you remove a stopped container with `docker rm` then it will be created, started, and launched again when a new hit comes in.

If you add a new domain, then it will install the application on first run (after starting the container, but before launching the
application).
