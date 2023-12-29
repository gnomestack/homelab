#!/usr/bin/env bash

WD=$(dirname "$0")
WD=$(realpath "$WD")
PATH="$PATH:${WD}/bin"
echo "export PATH=\"$PATH\"" > ./path.env

if ! grep -q "## DRK" ~/.bash_env; then
  echo "" | tee -a ~./.bash_env
  echo "## DRK" | tee -a ~/.bash_env
  echo "export PATH=\"\$PATH:\${WD}/bin\"" | tee -a ~/.bashrc
fi

echo "export PATH=\"$PATH\"" > ./path.env

echo "run:"
echo "source $WD/path.env"

# shellcheck disable=SC1091
source "${WD}/path.env"
export PATH="$PATH:${WD}/bin"

sudo chmod +x -R "${WD}/bin"
sudo chmod +x -R "${WD}/setup.sh"