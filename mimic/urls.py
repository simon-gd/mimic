from django.conf.urls import patterns, include, url
from django.views.generic import TemplateView

from django.contrib import admin
from mimic.settings.base import *

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', 'survey.views.home', name='home'),
    url(r'^survey/admin/', include('survey_admin.urls')),
    url(r'^survey/', include('survey.urls')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    
)

if DEBUG:
    urlpatterns += patterns('',
        (r'^static/(?P<path>.*)$', 'django.views.static.serve', {'document_root': STATIC_ROOT}),
    )
