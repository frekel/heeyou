# heeyou
James the butler on a Raspberry Pi II


#install:
echo "deb http://ftp.de.debian.org/debian jessie main non-free" >> /etc/apt/sources.list
sudo apt-get update && sudo apt-get upgrade

https://www.npmjs.com/package/jvspiglow

sudo apt-get install libttspico*
	- installs:
		- libttspico-utils
		- libttspico-dev
		- libttspico-data
		- libttspico0						

sudo apt-get install mongodb

wget https://nodejs.org/dist/latest-v4.x/node-v4.2.6-linux-armv7l.tar.xz
tar -xvf node-v4.2.6-linux-armv7l.tar.xz
cd node-v4.2.6-linux-armv7l.tar.xz
sudo cp -R * /usr/local/

git clone https://github.com/frekel/heeyou /var/www/node/heeyou
cd /var/www/node/heeyou

sudo npm install nodemon -g
sudo npm install express -g
sudo npm install express-theme -g
sudo npm install 

DEBUG=heeyou:* npm start


