# Ploxy

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

Now install nodejs 0.10 on the host, and run the ploxy with `npm install; node ploxy`,

Visit https://test.com/ with your browser. You will see that the proxy:

* Exposes a SPDY server
* Switches certs based on domain name, using SNI
* starts the stopped Docker container on-the-fly and proxies the request to its Docker IP address
