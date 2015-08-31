# The MIT License (MIT)
#
# Copyright (c) 2014 Autodesk, Inc.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.
#
# http://opensource.org/licenses/MIT

"""Development settings and globals."""
from os.path import join, normpath

from base import *


########## DEBUG CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#debug
DEBUG = True

# See: https://docs.djangoproject.com/en/dev/ref/settings/#template-debug
TEMPLATE_DEBUG = DEBUG
########## END DEBUG CONFIGURATION


########## EMAIL CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#email-backend
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
########## END EMAIL CONFIGURATION

ALLOWED_HOSTS = ['.azurewebsites.net', '.cloudapp.net', 'localhost', '127.0.0.1']

########## DATABASE CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#databases

DATABASES = {
    'default': {
   	'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASS'],
        'HOST': os.environ['DB_SERVICE'],
        'PORT': os.environ['DB_PORT']
    }
    #'default': {
    #    'ENGINE': 'django.db.backends.mysql',
    #    'NAME': '<db_name>',
    #    'HOST': '127.0.0.1',
    #    'PORT': '3306',
    #    'USER': '<db_username>',
    #    'PASSWORD': 'db_password',
    #    "CONN_MAX_AGE": 600,
    #},
}


########## END DATABASE CONFIGURATION


########## CACHE CONFIGURATION
# See: https://docs.djangoproject.com/en/dev/ref/settings/#caches
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}
########## END CACHE CONFIGURATION


########## TOOLBAR CONFIGURATION
# See: https://github.com/django-debug-toolbar/django-debug-toolbar#installation
#INSTALLED_APPS += (
#    'debug_toolbar',
#)

# See: https://github.com/django-debug-toolbar/django-debug-toolbar#installation
INTERNAL_IPS = ('127.0.0.1',)

# See: https://github.com/django-debug-toolbar/django-debug-toolbar#installation
#MIDDLEWARE_CLASSES += (
#    'debug_toolbar.middleware.DebugToolbarMiddleware',
#)

DEBUG_TOOLBAR_CONFIG = { 'INTERCEPT_REDIRECTS': False }
########## END TOOLBAR CONFIGURATION

########## Azure
MIMIC_USE_AZURE_BLOB = False
AZURE_STORAGE_ACCOUNT = "<azure_account_name>"
AZURE_STORAGE_KEY = "<azure storage key>"
