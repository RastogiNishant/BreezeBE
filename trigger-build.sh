#!/bin/bash
export PATH=$PATH:/usr/local/bin
export NODE_PATH=/usr/local/share/node
export USER=ubuntu
export HOME=/home/ubuntu
source $HOME/.nvm/nvm.sh
cd /home/ubuntu/source/core/trigger-build
nvm use 12
make update-development