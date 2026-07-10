#!/usr/bin/env bash
curl -L -o pmtiles.tar.gz https://github.com/protomaps/go-pmtiles/releases/download/v1.30.0/go-pmtiles_1.30.0_Linux_x86_64.tar.gz
tar -xzf pmtiles.tar.gz
chmod +x pmtiles
sudo mv pmtiles /usr/local/bin/
pmtiles version
