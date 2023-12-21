#!/bin/bash

set -x

# Google Chrome
sudo apt update -y && sudo apt upgrade -y

curl -fSsL https://dl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor | sudo tee /usr/share/keyrings/google-chrome.gpg >>/dev/null

echo deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main | sudo tee /etc/apt/sources.list.d/google-chrome.list

sudo apt update -y && sudo apt install -y \
  google-chrome-stable \
  # firefox-esr
