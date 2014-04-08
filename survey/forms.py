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