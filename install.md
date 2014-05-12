mimic
=====

python manage.py syncdb
python manage.py migrate
python manage.py loaddata media\export_data\surveyData_micallef-replication.json

django
mysql
gunicorn: http://gunicorn.org/
nginx: http://wiki.nginx.org/Main
ubuntu

# Add permissiong to mysql
mysql -u root -p
GRANT ALL ON mimic.* TO root@'23.96.32.128' IDENTIFIED BY 'password';
GRANT ALL ON mimic.* TO root@'127.0.0.1' IDENTIFIED BY 'root';
# nginx
sudo /etc/init.d/nginx restart
Logs
nano /var/log/nginx/error.log
Configs
/etc/nginx/sites-enabled

# Gunicorn
upstart:
/etc/init/mimic.conf
"""
description "myapp"

start on (filesystem)
stop on runlevel [016]

respawn
console log
setuid nobody
setgid nogroup
chdir /home/simon/mimic/mimic

exec gunicorn wsgi:application
"""

sudo start mimic
sudo status mimic
sudo stop mimic

/var/log/upstart/mimic.log