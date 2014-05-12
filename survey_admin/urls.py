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
    url(r'^$', 'survey_admin.views.survey_admin', name='survey_admin'),
    #url(r'^save_csv_scroll/(?P<survey_id>\d+)/$', 'survey_admin.views.save_csv_scroll', name='save_csv_scroll'),
    #url(r'^save_csv/(?P<survey_id>\d+)/$', 'survey_admin.views.save_csv', name='save_csv'),
    #url(r'^analysis/$', 'survey_admin.views.survey_analysis', name='survey_analysis'),
    url(r'^debug_question/(?P<question_id>\d+)/$', 'survey_admin.views.debug_question', name='debug_question'),
    url(r'^debug_question/$', 'survey_admin.views.debug_question2', name='debug_question2'),
    url(r'^viz_debug/$', 'survey_admin.views.viz_debug', name='viz_debug'),
    url(r'^custom_viz/$', 'survey_admin.views.custom_viz', name='custom_viz'),
    
    # JSON API
    url(r'^questions/(?P<survey_id>\d+)/$', 'survey_admin.views.json_all_questions', name='json_all_questions'),
    url(r'^answers/(?P<survey_id>\d+)/(?P<question_id>\d+)/$', 'survey_admin.views.json_answers', name='json_answers'),
    url(r'^analysis/(?P<survey_id>\d+)/(?P<question_id>\d+)/$', 'survey_admin.views.json_analysis', name='json_analysis'),
    url(r'^experiment/(?P<survey_id>\d+)/(?P<user_id>\d+)/$', 'survey_admin.views.json_experiment', name='json_experiment'),
    url(r'^update_experiment_state/(?P<survey_id>\d+)/(?P<user_id>\d+)/(?P<state>\d+)/$', 'survey_admin.views.update_experiment_state', name='update_experiment_state'),
    url(r'^preprocess/(?P<survey_id>\d+)/$', 'survey_admin.views.json_preprocess_answers', name='json_preprocess_answers'),
    
    url(r'^get_stat_similarity$', 'survey_admin.views.get_stat_similarity', name='get_stat_similarity'),
    url(r'^get_stat_correlation$', 'survey_admin.views.get_stat_correlation', name='get_stat_correlation'),
    url(r'^save_file$', 'survey_admin.views.save_analysis_file', name='save_analysis_file'),
    url(r'^open_file$', 'survey_admin.views.open_analysis_file', name='open_analysis_file'),
    url(r'^get_file_list$', 'survey_admin.views.get_file_list', name='get_file_list'),
    
    # Composite Visualizations
    url(r'^comp/expmap/(?P<survey_id>\d+)/(?P<question_id>\d+)/$', 'survey_admin.views.comp_expmap', name='comp_expmap'),
    url(r'^comp/static_mouse_paths/(?P<survey_id>\d+)/(?P<question_id>\d+)/(?P<condition>\d+)/$', 'survey_admin.views.comp_mouse_paths', name='comp_static_mouse_paths'),
    url(r'^comp/animated_mouse_paths/(?P<survey_id>\d+)/(?P<question_id>\d+)/(?P<condition>\d+)/$', 'survey_admin.views.comp_animated_mouse_paths', name='comp_animated_mouse_paths'),
    url(r'^comp/heatmap/(?P<survey_id>\d+)/(?P<question_id>\d+)/(?P<condition>\d+)/(?P<ids>[\d.,/_\-]+)/$', 'survey_admin.views.comp_heatmap', name='comp_heatmap'),
    
    url(r'^expmap/(?P<experiment_id>\d+)/$', 'survey_admin.views.expmap', name='expmap'),
    url(r'^static_mouse_paths/(?P<answer_id>\d+)/$', 'survey_admin.views.static_mouse_paths', name='static_mouse_paths'),
    url(r'^animated_mouse_paths/(?P<answer_id>\d+)/$', 'survey_admin.views.animated_mouse_paths', name='animated_mouse_paths'),
    url(r'^heatmap/(?P<answer_id>\d+)/$', 'survey_admin.views.heatmap', name='heatmap'),
)
