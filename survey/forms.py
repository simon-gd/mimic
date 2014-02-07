from django import forms
from django.forms.util import ErrorList

class WorkerIDForm(forms.Form):
    worker_id = forms.CharField(max_length=255)

class DivErrorList(ErrorList):
     def __unicode__(self):
         return self.as_divs()
     def as_divs(self):
         if not self: return u''
         return u'%s' % ''.join([u'<div class="error">%s</div>' % e for e in self])
         #return u'<div class="errorlist">%s</div>' % ''.join([u'<div class="error">%s</div>' % e for e in self])

class QuestionChoiceForm(forms.Form):
    def __init__(self, choices, *args, **kwargs):
        kwargs_new = {'error_class': DivErrorList}
        kwargs_new.update(kwargs)
        super(QuestionChoiceForm, self).__init__(*args, **kwargs_new)
        group_count = len(choices)
        self.fields['groups'] = forms.CharField(initial=str(group_count),widget=forms.HiddenInput())
        count = 0
        for c in choices:
            name = 'choices_'+str(count)
            self.fields[name] = forms.ChoiceField(choices=[ (o.id, o.text) for o in c],
                                                   widget=forms.RadioSelect(),
                                                   required=True,
                                                   error_messages={'required': 'You must select an answer to continue.'})
            count += 1