# Installation & Deployment Guide

## Local Setup (Windows)
**Warning**: These instructions need quite a bit of clarification.

These are rough instructions for setting up Mimic, assuming your have all the pre-requisits installed:

- using command line navigate to the mimic folder that contains manage.py
- python manage.py syncdb
- python manage.py migrate
- python manage.py loaddata media\export_data\surveyData_micallef-replication.json
- python manage.py runserver
- open browsers and navigate to http://localhost:8000/survey/admin
- defaults: username: admin, password: admin (can be chaned if you go to http://localhost:8000/admin)
- The first time you run mimic you and select dataset, you have to click a link to process user interactions, this may take a while, but does not have to be repeated.

## Deplyment Setup (ubuntu)

**TODO**: These instructions need quite a bit of clarification

Currently a working version of the system is deployed on Azure unix server, while the development is done on Windows.

gunicorn: 
nginx: 

### MySQL
/etc/init.d/mysqld restart

Add permissiong to mysql (not sure if this is needed)
	
	mysql -u root -p
	GRANT ALL ON mimic.* TO root@'127.0.0.1' IDENTIFIED BY 'password';


	GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';

GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'password' WITH GRANT OPTION;

### nginx
[http://wiki.nginx.org/Main](http://wiki.nginx.org/Main)

- Start: ``sudo /etc/init.d/nginx restart``
- Stop: ``sudo /etc/init.d/nginx stop``
- Restart: ``sudo /etc/init.d/nginx restart``
- View Logs: ``nano /var/log/nginx/error.log``
- Config location: ``/etc/nginx/sites-enabled``

proxy_set_header X-Real-IP $remote_addr;


### Gunicorn
[http://gunicorn.org/](http://gunicorn.org/)
Setup upstart process to make it easy to start and stop Gunicorn

- ``cp scripts/gunicorn_mimic_upstart.conf /etc/init/mimic.conf``
- replace ``<mimic folder that has wsgi.py file>`` with path e.g. ``/home/simon/mimic/mimic``
- Start: ``sudo start mimic``
- Check Status: ``sudo status mimic``
- Stop: ``sudo stop mimic``
- Log location: /var/log/upstart/mimic.log