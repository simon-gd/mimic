mimic
=====

D:\home\site\wwwroot;D:\home\site\wwwroot\mimic;D:\home\site\wwwroot\site-packages

# Add permissiong to mysql
mysql -u root -p
GRANT ALL ON mimic.* TO root@'23.96.32.128' IDENTIFIED BY 'password';
