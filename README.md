# Snickers

To try it out:

* add '127.0.0.1 test.com' to your /etc/hosts
* get a key pair and save it as:
  * approved-certs/default.key
  * approved-certs/default.cert
  * approved-certs/default.ca
* get a key pair for test.com and save it as
  * approved-certs/test.com.key
  * approved-certs/test.com.cert
  * approved-certs/test.com.ca

Then create a backend, by either:

````
sudo docker create -d --name test.com-443 indiehosters/nginx
````

or:


````
sudo docker run -d --name test.com-443 indiehosters/nginx
sudo docker stop test.com
````

Now install nodejs on the host, and start the SNI offloader with `npm install; node snickers`,

Visit https://test.com/ with your browser. You will see that Snickers will:

* Expose a SPDY server
* Switch certs based on domain name, using SNI
* Start the stopped Docker container on-the-fly and proxy the request to its Docker IP address
