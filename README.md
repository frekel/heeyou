# heeyou
James the butler on a Raspberry Pi II


#install:
sudo apt-get update && sudo apt-get upgrade

https://www.npmjs.com/package/jvspiglow

wget https://nodejs.org/dist/latest-v4.x/node-v4.2.6-linux-armv7l.tar.xz
tar -xvf node-v4.2.6-linux-armv7l.tar.xz
cd node-v4.2.6-linux-armv7l.tar.xz
sudo cp -R * /usr/local/

git clone https://github.com/frekel/heeyou /var/www/node/heeyou
cd /var/www/node/heeyou

sudo npm install nodemon -g
sudo npm install express -g
sudo npm install 

DEBUG=heeyou:* npm start


