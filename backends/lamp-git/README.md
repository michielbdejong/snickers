# lamp-git

This image pulls in a database dump and a www-content folder from a git repo, and hosts it as a lamp application.


````
sudo docker build -t indiehosters/lamp-git .
sudo docker run -d -v $(pwd)/data:/data indiehosters/lamp-git
````
