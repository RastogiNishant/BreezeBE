#!/bin/bash

helpFunction()
{
   echo ""
   echo "Usage: $0 -e dev"
   echo -e "\t-e Set valid environment (dev,staging,prod)"
   exit 1 # Exit script after printing help
}


while getopts "e:" opt
do
   case "$opt" in
      e ) env="$OPTARG" ;;
      ? ) helpFunction ;; # Print helpFunction in case parameter is non-existent
   esac
done

if [ -z "$env" ]
then
   env="dev";
fi

# Print helpFunction in case parameters are empty
if [ -z "$env" ]
then
   echo "Some or all of the parameters are empty";
   helpFunction
fi

echo "Set PATH variables"
export PATH=$PATH:/usr/local/bin
export NODE_PATH=/usr/local/share/node
export USER=ubuntu
export HOME=/home/ubuntu

echo "Set Node version (12.x.x)"
source $HOME/.nvm/nvm.sh
nvm use 12

if [ "$env" == dev ]
then
   make update-development
fi

if [ "$env" == staging ]
then
   make update-staging
fi

if [ "$env" == prod ]
then
   make update-prod
fi

echo "End Script"