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

Snickers requires Docker, nodejs, and the packages it install when you run `npm install` in the root of this repo. I use screen to
run `node ./snickers` in a loop (configure the server to restart this screen on startup, in case it reboots).

The only configuration you need to give snickers is the location of its two backup servers. It will store data locally in `/data`, by default.

Copy `config.sample.js` to `config.js` and put in the two git servers to use for backups. Make sure these are private git servers, but
that the user as which you run snickers does have access to them.

To add a domain, you can use `node ./add` which will interactively ask you for the necessary info. Note that it's not necessary to
restart snickers for this. You don't even need to do it on the same server as where the domain will run, as long as they share the
same two backup servers.

By default, a LetsEncrypt cert will be used. To install a different TLS certificate (for instance from StartSSL),
concatenate the public cert, intermediate cert, and private key, into
`/data/domains/<example.com>/TLS/<example.com>.pem`.
