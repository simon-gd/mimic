from django.conf.urls import patterns, include, url
from django.views.generic import TemplateView


urlpatterns = patterns('',
    # survey
    url(r'^$', 'survey.views.home', name='survey'),
    url(r'^save_question/$', 'survey.views.save_question', name='save_question'),
    url(r'^done/', 'survey.views.done', name='done'),
    
    # errors
    url(r'^no_active_survey/$', 'survey.views.no_active_survey', name='no_active_survey'),
    url(r'^not_supported/', 'survey.views.not_supported', name='not_supported'),
    url(r'^start/', 'survey.views.need_worker_id', name='need_worker_id'),
    
    # Admin Pages
    url(r'^reset/', 'survey.views.reset', name='reset'),
    
)
