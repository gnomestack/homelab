#!/bin/bash

if ! command -v docker &> /dev/null; then

	mkdir -p ~/scripts
	curl -fsSL https://get.docker.com -o ~/scripts/get-docker.sh
	sudo sh ~/scripts/get-docker.sh
fi

GROUP=$(getent group docker)


if [[ $GROUP == *"$USER"* ]]; then
  echo "docker group exists and has $USER."
else
  	sudo groupadd docker
	sudo usermod -aG docker "$USER"
	newgrp docker
fi

