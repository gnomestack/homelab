#!/bin/bash

if [ ! -d "/home/$USER/.local/bin" ]; then
    mkdir -p "/home/$USER/.local/bin"
fi

DOCKER_DIR="/home/$USER/opt/docker"

if [ ! -d "$DOCKER_DIR" ]; then
    mkdir -p "$DOCKER_DIR"
    mkdir -p "$DOCKER_DIR/var/lib"
    mkdir -p "$DOCKER_DIR/var/run"
    mkdir -p "$DOCKER_DIR/var/log"
    mkdir -p "$DOCKER_DIR/etc"
    mkdir -p "$DOCKER_DIR/bin"

    sudo chown -R "$USER:$USER" "$DOCKER_DIR"
fi