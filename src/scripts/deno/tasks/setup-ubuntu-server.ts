import { sshScript } from "./ssh.ts";
import { ps, path, dotenv } from "../deps.ts"

const dir = path.dirname(path.fromFileUrl(import.meta.url));
const src = path.resolve(dir, "..", "..", "..");
const secretsFile = path.resolve(src, "etc", "secrets.env");

const r = await ps.exec("sops", ["-d", secretsFile], { stdout: "piped" });
const secrets = dotenv.parse(r.stdoutAsString);


const baseUbuntuSetup = `
#!/bin/bash

export DEBIAN_FRONTEND=noninteractive

U=$USER
if [ -n "\${SUDO_USER}" ]; then 
    U=$SUDO_USER
fi

SUDOER_FILE="/etc/sudoers.d/$U"

if [ ! -f "$SUDOER_FILE" ]; then 
    echo "sudoer file does not exist $SUDOER_FILE, creating"
    PW=$(cat "/home/$U/pass")
    echo "$PW" | sudo -S touch "$SUDOER_FILE"
    echo "$U ALL=(ALL) NOPASSWD:ALL" | sudo tee -a "$SUDOER_FILE"
fi


if ! command -v "zoxide" &> /dev/null; then 
    sudo apt-get update && sudo apt-get upgrade -y
    sudo apt-get install -y zip \
        ca-certificates \
        curl \
        apt-transport-https \
        lsb-release \
        gnupg \
        pass \
        cifs-utils \
        wget \
        software-properties-common \
        bat \
        ripgrep \
        micro \
        unzip \
        net-tools \
        exa \
        age \
        mkcert \
        duff \
        btop \
        gh \
        neovim \
        tre-command \
        jq \
        zoxide \
        nnn 
fi

U=$USER
if [ -n "\${SUDO_USER}" ]; then 
    U=$SUDO_USER
fi

BASHRC="/home/$U/.bashrc"

if ! grep -q "## ZOXIDE" "$BASHRC"; then
  echo '## ZOXIDE
eval "$(zoxide init bash --cmd jd)"' | tee -a "$BASHRC"
fi

if ! command -v deno &> /dev/null; then 
    curl -fsSL https://deno.land/x/install/install.sh | sh
fi

if ! grep -q "## DENO" "$BASHRC"; then
   deno='## DENO
export DENO_INSTALL="/home/server_admin/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"
export DENO_TLS_CA_STORE="system"
'
    echo "$deno" | tee -a "$BASHRC"
fi

if ! grep -q "POWERSHELL_TELEMETRY_OPTOUT" "/etc/environment"; then
    echo "POWERSHELL_TELEMETRY_OPTOUT=1" | sudo tee -a /etc/environment
fi

if ! command -v pwsh &> /dev/null; then 
    source /etc/os-release
    echo $VERSION_ID

    wget -q https://packages.microsoft.com/config/ubuntu/$VERSION_ID/packages-microsoft-prod.deb

    # Register the Microsoft repository keys
    sudo dpkg -i packages-microsoft-prod.deb

    # Delete the the Microsoft repository keys file
    rm packages-microsoft-prod.deb
    sudo apt-get update -y
    sudo apt-get install powershell -y
fi


function install_az() {
    if ! command -v az &> /dev/null; then 
        KEY="/etc/apt/keyrings/microsoft.gpg"
        URL=https://packages.microsoft.com/repos/azure-cli/
        DEST="/etc/apt/sources.list.d/azure-cli.list"
        AZ_DIST=$(lsb_release -cs)
        echo "deb [arch=$(dpkg --print-architecture) signed-by=$KEY] $URL $AZ_DIST main" | sudo tee $DEST 
        sudo apt-get update -y
        sudo apt-get install azure-cli
    else
        echo "az already installed"
        return
    fi
}

# install_az

if ! command -v "oh-my-posh" &> /dev/null; then 
    curl -s https://ohmyposh.dev/install.sh | sudo bash -s
fi

OMG_THEME="$HOME/.config/omp/bubblesextra.omp.json"

if [ ! -f "$OMG_THEME" ]; then 
    mkdir -p ~/.config/omp
    curl "https://raw.githubusercontent.com/JanDeDobbeleer/oh-my-posh/main/themes/bubblesextra.omp.json" | tee "$OMG_THEME"
fi

if ! grep -q "## OHMYPOSH" "/home/$USER/.profile"; then
    echo '## OHMYPOSH
eval "$(oh-my-posh init bash --config ~/.config/omp/bubblesextra.omp.json)"' | tee -a ~/.profile
fi

function install_procs() {

    if [ -z "\${PROCS_VERSION}" ]; then 
        PROCS_VERSION="v0.14.0"
    fi

    if ! command -v procs &> /dev/null; then 
        echo "$PROCS_VERSION"

        wget "https://github.com/dalance/procs/releases/download/$PROCS_VERSION/procs-$PROCS_VERSION-x86_64-linux.zip" -O ~/Downloads/procs.zip
        sudo unzip ~/Downloads/procs.zip -d /usr/local/bin
    fi
}

# install_procs

if ! command -v pingme &> /dev/null; then 
    curl -sL https://bit.ly/installpm | sudo sh
fi

#if ! command -v osquery &> /dev/null; then 
#    mkdir -p ~/Downloads
#    wget https://pkg.osquery.io/deb/osquery_5.9.1-1.linux_amd64.deb -O ~/Downloads/osquery.deb
#    sudo dpkg -i ~/Downloads/osquery.deb
#    rm ~/Downloads/osquery.deb
#fi
`

const installDocker = `
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
`

const makeDirectories = `
#!/bin/bash

if [ ! -d "/home/$USER/.local/bin" ]; then
    mkdir -p "/home/$USER/.local/bin"
fi

DOCKER_DIR="/opt/docker"

if [ ! -d "$DOCKER_DIR" ]; then
    sudo mkdir -p "$DOCKER_DIR"
    sudo chown "\${USER}:docker" -R "$DOCKER_DIR"


    mkdir -p "$DOCKER_DIR/var/lib"
    mkdir -p "$DOCKER_DIR/var/run"
    mkdir -p "$DOCKER_DIR/var/log"
    mkdir -p "$DOCKER_DIR/var/tmp"
    mkdir -p "$DOCKER_DIR/etc"
    mkdir -p "$DOCKER_DIR/bin"

    sudo chown -R "$USER:docker" "$DOCKER_DIR"
fi
`;

export async function setupUbuntuServerBySecrets(secretPrefix: string) {
    const target = secrets[`${secretPrefix}_IP`];
    const password = secrets[`${secretPrefix}_PASS`];

    if (!target) {
        throw new Error(`No ${secretPrefix}_IP in secrets.env`);
    }

    if (!password) {
        throw new Error(`No ${secretPrefix}_PASS in secrets.env`);
    }

    await setupUbuntuServer(target, password);
}

export async function setupUbuntuServer(target: string, password: string) {

    const setpwScript = `echo '${password}' | tee ~/pass`

    await sshScript(target, setpwScript);
    await sshScript(target, baseUbuntuSetup);
    await sshScript(target, installDocker);
    await sshScript(target, makeDirectories);
    await sshScript(target, "rm ~/pass");
}