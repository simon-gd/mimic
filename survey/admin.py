from django.contrib import admin
from survey.models import Question, Survey, SurveyMembership, Experiment, ExperimentUser, ExperimentAnswer

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