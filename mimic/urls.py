from django.conf.urls import patterns, include, url
from django.views.generic import TemplateView

from django.contrib import admin
from django.conf import settings

from django.conf.urls.static import static

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', 'survey.views.home', name='home'),
    url(r'^survey/admin/', include('survey_admin.urls')),
    url(r'^survey/', include('survey.urls')),

    url(r'^admin/', include(admin.site.urls)),
    url(r'^admin/doc/', include('django.contrib.admindocs.urls')),
    
)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
