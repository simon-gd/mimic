# Mimic
---

An input capture and visual analytics system that records online user behavior to facilitate the discovery of micro-interactions that may affect problem understanding and decision making.

**Warning**: This is "research code", and requires some configuration and tweaking to get working.

## Requirements
---
* Python 2.7 (may work with other versions) 
* MySQL
* Lots of python libraries (see [stable-req.txt](https://github.com/sbreslav/mimic/blob/master/stable-req.txt))

## More Info
---
This code was used in experiments done for this paper:
http://autodeskresearch.com/publications/mimic

## Reference
---
If you want to reference this code in an academic paper, please use this reference:
	
	@inproceedings{ Breslav-AVI-2014,
		author  = {Simon Breslav and Azam Khan and Kasper Hornbaek},
		title   = {Mimic: Visual Analysis of Online Micro-interactions},
		booktitle = {Proceedings of the 13th International Working Conference on Advanced Visual Interfaces 2014},
		location = {Como, Italy},
		year    = {2014},
		numpages = {8},
		publisher = {ACM}}

## Licence
---
[The MIT Licence](https://github.com/sbreslav/mimic/blob/master/LICENSE)

## Installation
---
These are rough instructions for setting up Mimic, assuming your have all the pre-requisits installed:
- using command line navigate to the mimic folder that contains manage.py
- ``python manage.py syncdb``
- ``python manage.py migrate``
- ``python manage.py loaddata media\export_data\surveyData_micallef-replication.json``
- ``python manage.py runserver``
- open a browser and navigate to http://localhost:8000/survey/admin
- defaults: username: admin, password: admin

For more detailed information See [install.md](https://github.com/sbreslav/mimic/blob/master/install.md)
