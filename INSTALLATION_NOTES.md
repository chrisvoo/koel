# Installation notes

## Sync forked repo

You can just go to the main page of your repo, in the Code Section, and next to the indicator that says if your
branch is ahead or behind the source repo, you now have this "Fetch Upstream" button.

![ui_sync_fork.png](docs%2Fui_sync_fork.png)

You can also use [GitHub Actions](https://docs.github.com/en/actions).

## Requirements

* Database: MySQL / PostgreSQL
* Web Server: Apache / NGINX
* PHP 8+
* Node.js (Vue)
* [Certbot](https://certbot.eff.org/): follow the instructions based on the chosen Web server
* `sudo apt-get -y install inotify-tools` for automatically sync modifications of the file system with your database.
  See [the guide on Koel doc site](https://docs.koel.dev/watch.html#_2-set-up-a-watcher-script). Alternatively a
  [cronjob](https://docs.koel.dev/#music-discovery) to sync your files by night (slower)
* ~~[DuckDNS](https://www.duckdns.org/): DNS binding between a chosen subdomain and your local IP~~ Currently using [No-IP](https://www.noip.com/).
* Port forwarding of ports 80/443
* Store an entry for your domain in the /etc/hosts file, no need to pass through the Internet
when you'll using it locally

## Commands

* `php artisan koel:sync`: manual sync of the music directory

```bash
# Manual sync watch with inotify

chmod +x watch
./watch
# [Ctrl+z]
bg
disown -h
```

## Notes for Alexa integration

* [Caching in Lambda](https://www.sebastianhesse.de/2018/12/16/caching-in-aws-lambda/). Alternatively
it could be uses [AWS Secrets Manager](https://aws.amazon.com/secrets-manager/), not free but it's not that expensive
