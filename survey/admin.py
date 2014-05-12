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

from django.contrib import admin
from survey.models import Question, Survey, SurveyMembership, Experiment, ExperimentUser, ExperimentAnswer, ExperimentAnswerProcessed

class SurveyAdmin(admin.ModelAdmin):
    list_display = ('slug', 'pub_date')
    
class SurveyMembershipAdmin(admin.ModelAdmin):
    list_display = ('survey', 'question','order', 'desired_answers')
    raw_id_fields = ('question',)
    list_filter = ('survey', 'order')
    list_editable = ('order','desired_answers')

#class ExperimentAnswerAdmin(admin.ModelAdmin):
#    list_display = ('question_id', 'user_id', 'submitted_at')

admin.site.register(Question)
admin.site.register(Survey, SurveyAdmin)
admin.site.register(SurveyMembership, SurveyMembershipAdmin)
admin.site.register(Experiment)
admin.site.register(ExperimentUser)
admin.site.register(ExperimentAnswer)
admin.site.register(ExperimentAnswerProcessed)