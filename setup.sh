#!/usr/bin/env bash

WD=$(dirname "$0")
WD=$(realpath "$WD")
PATH="$PATH:${WD}/bin"
echo "export PATH=\"$PATH\"" > ./path.env

if ! grep -q "## DRK" ~/.bashrc; then
  echo "## DRK" | tee -a ~/.bashrc
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