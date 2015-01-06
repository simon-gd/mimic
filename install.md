# Installation & Deployment Guide

## Local Setup (Windows)
**Warning**: These instructions need quite a bit of clarification.

These are rough instructions for setting sup Mimic, assuming your have all the pre-requisits installed:

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
sudo service mysql start

Add permissiong to mysql (not sure if this is needed)
	
	mysql -u root -p
	GRANT ALL ON mimic.* TO root@'127.0.0.1' IDENTIFIED BY 'password';

	GRANT ALL ON mimic.* TO root@'localhost' IDENTIFIED BY 'password';


	GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';


	GRANT ALL ON mimic.* TO root@'127.0.0.1' IDENTIFIED BY 'password';
	

GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY 'password' WITH GRANT OPTION;

SHOW GRANTS FOR 'root'@'localhost';

### nginx
[http://wiki.nginx.org/Main](http://wiki.nginx.org/Main)

- Start: ``sudo /etc/init.d/nginx restart``
- Stop: ``sudo /etc/init.d/nginx stop``
- Restart: ``sudo /etc/init.d/nginx restart``
- Restart: ``sudo /etc/init.d/nginx reload``
- service nginx realod
- View Logs: ``nano /var/log/nginx/error.log``
- Config location: ``/etc/nginx/sites-enabled``

service nginx stop

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

http://omaralzabir.com/how-to-setup-a-rock-solid-vm-on-windows-azure-for-your-wordpress-blogs/
http://blog.bekijkhet.com/2014/08/add-swap-space-to-azure-ubuntu-iaas-vm.html
http://blogs.msdn.com/b/piyushranjan/archive/2013/05/31/swap-space-in-linux-vm-s-on-windows-azure-part-1.aspx

### Add swap file to get virtual memory
- Run the command “swapon –s” to check if there’s any swap file. If none, it will look like this:
edit the file /etc/waagent.conf

Toggle the option ResourceDisk.Format from 'n' to 'y'
Toggle the option ResourceDisk.EnableSwap from 'n' to 'y'
Add the swapspace size to the option ResourceDisk.SwapSizeMB. In my case 1000 for 1000MB.


# Format if unformatted. If 'n', resource disk will not be mounted.
ResourceDisk.Format=y

# File system on the resource disk
# Typically ext3 or ext4. FreeBSD images should use 'ufs2' here.
ResourceDisk.Filesystem=ext4

# Mount point for the resource disk
ResourceDisk.MountPoint=/mnt

# Create and use swapfile on resource disk.
ResourceDisk.EnableSwap=y

# Size of the swapfile.
ResourceDisk.SwapSizeMB=1000

Also edit the file /etc/fstab and remove the line:

/dev/sdb1 /mnt auto defaults,nobootwait,comment=cloudconfig 0 2

Now after a reboot the waagent starts creating a swap file and after a while it is enabled:

swapon -s
Filename    Type  Size Used Priority
/mnt/swapfile                           file  1023996 0 -1


log_error = /var/log/mysql/error.log


sudo nano /etc/sysctl.conf
append: fs.file-max = 100000

sysctl -p



proxy_connect_timeout 120s;
proxy_read_timeout 120s;

sudo update-rc.d -f  apache2 remove
