#!/bin/bash

apt-get -y -qq update > /dev/null
apt-get -y -qq install wget bzip2 > /dev/null

echo "Installing Chrome"
wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt-get -y -qq install ./google-chrome-stable_current_amd64.deb > /dev/null

echo "Installing FireFox"
wget -q -O FirefoxSetup.tar.bz2 "https://download.mozilla.org/?product=firefox-latest&os=linux64&lang=en-US"
tar xf FirefoxSetup.tar.bz2
mv firefox/ /opt/
ln -s /opt/firefox/firefox /usr/bin/firefox
apt-get -y -qq install -y -q packagekit-gtk3-module > /dev/null
