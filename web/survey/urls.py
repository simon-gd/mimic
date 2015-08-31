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

    # Admin Pages
    url(r'^reset/', 'survey.views.reset', name='reset'),
    
)