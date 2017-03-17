# Installation

1. Run `npm i -g babel-cli` to install Babel CLI toolset.

2. Clone `guacamole-initializer` to somewhere in your system (e.g. `/var/lib/guacamole-initializer`).

3. Create user and group `guacamole-initializer` with repository as home directory and `/bin/false` as shell.

4. Run `npm i` in `guacamole-initializer` directory (`/var/lib/guacamole-initializer`).

5. Install database driver for Guacamole database (only `mysql` has currently been tested).

6. Create configuration file `/etc/guacamole-initializer/config.json` similar to `config_sample.json`.

7. Change owner of configuration file to `root:guacamole-initializer` and mode to `640` to secure the file.

8. Create systemd unit file (e.g. `/usr/local/lib/systemd/system/guacamole-initializer.service`) similar to following:
```ini
[Unit]

[Install]
WantedBy=multi-user.target

[Service]
ExecStart=/var/lib/guacamole-initializer/index.js /etc/guacamole-initializer/config.json
Restart=always
RestartSec=3
User=guacamole-initializer
Group=guacamole-initializer
```

9. Start application
```sh
systemctl daemon-reload
systemctl enable guacamole-initializer
systemctl start guacamole-initializer
```

