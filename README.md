# GNOMESTACK homelab

![logo](./.eng/assets/icon.png)

A docker lab for self hosting applications.  The lab will eventually move to
kubernetes overtime.

## Setup

The following will create a path.env file to enable to sourc the ./bin directory
and it will add the directory to your bashrc file.

The bin folder holds a dkr and dkr.ps1 file that runs the deno commmand line
tool taylored to this repo.

```bash
bash setup.sh
source ./path.env
```

Under MIT License unless otherwise noted.
