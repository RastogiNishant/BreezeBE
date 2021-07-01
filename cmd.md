# dev
```
sudo -u postgres dropdb breeze
sudo -u postgres psql -c "CREATE DATABASE breeze OWNER database;"
sudo -u postgres psql breeze < dump_ready.sql
```
