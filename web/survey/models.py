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

from django.db import models
from django.utils.translation import ugettext_lazy as _
import datetime

VIS_TYPES = (
    (0, 'No Visualization'),
    (1, 'Tree Diagram'),
    (2, 'Icon Array'),
    (3, 'Venn Diagram'),
    (4, 'Sankey')
)

CONFIDENCE_TYPES = (
    (0, 'Unspecified'),
    (1, 'Highly Confident'),
    (2, 'Confident'),
    (3, 'Neutral'),
    (4, 'Unsure'),
    (5, 'Highly Unsure'),
)

EXP_STATE_TYPES = (
    (0, 'Valid'),
    (1, 'Invalid'),
    (2, 'Error'),
    (3, 'UserFlag'),
)

class QuestionManager(models.Manager):
    def get_by_natural_key(self, slug_key):
        return self.get(slug=slug_key)

class Question(models.Model):
    objects = QuestionManager()

    slug = models.SlugField(_('Slug'), max_length=255, unique=True)
    base_template = models.CharField(max_length=255, default="question_v2.html")
    template = models.CharField(max_length=255)
    correct_answer = models.TextField(blank=True, null=True)
    data = models.TextField()
    
    def natural_key(self):
        return (self.slug,)

    def __unicode__(self):
        return self.slug

class SurveyManager(models.Manager):
    def get_by_natural_key(self, slug):
        return self.get(slug=slug)

class Survey(models.Model):
    objects = SurveyManager()

    slug = models.SlugField(_('Slug'), max_length=255, unique=True)
    pub_date = models.DateTimeField(_('Date published'))
    questions = models.ManyToManyField(Question, blank=True, null=True, through='SurveyMembership')
    active = models.BooleanField(_('Survey is active'), default=False)
    survey_code = models.CharField(max_length=255,default="2lMGut4I4h")
    condition_count = models.IntegerField(default=4)
    user_data_version = models.CharField(max_length=255, default="1.4.0")
    
    def natural_key(self):
        return (self.slug,)

    def __unicode__(self):
        return self.slug
    
    @models.permalink
    def get_absolute_url(self):
        return ('survey-detail', (), {'survey_slug': self.slug })

class SurveyMembershipManager(models.Manager):
    def get_by_natural_key(self, survey_key, question_key):
        return self.get(survey=Survey.objects.get_by_natural_key(survey_key), question=Question.objects.get_by_natural_key(question_key))
        
class SurveyMembership(models.Model):
    objects = SurveyMembershipManager()

    survey = models.ForeignKey(Survey)
    question = models.ForeignKey(Question)
    order = models.IntegerField()
    desired_answers = models.IntegerField(default=1)

    def natural_key(self):
        return self.survey.natural_key() + self.question.natural_key()
    
    natural_key.dependencies = ['survey.Survey', 'survey.Question']

    def __unicode__(self):
        return self.survey.slug + " " + self.question.slug

    class Meta:
        unique_together = (('survey', 'question'),)

class ExperimentUserManager(models.Manager):
    def get_by_natural_key(self, worker_id):
        return self.get(worker_id=worker_id)

class ExperimentUser(models.Model):
    objects = ExperimentUserManager()
    worker_id = models.CharField(max_length=255, unique=True)
    
    def natural_key(self):
        return (self.worker_id,)

    def __unicode__(self):
        return self.worker_id

class ExperimentManager(models.Manager):
    def get_by_natural_key(self, user_key, survey_key):
        return self.get(user=ExperimentUser.objects.get_by_natural_key(user_key), survey=Survey.objects.get_by_natural_key(survey_key))    

class Experiment(models.Model):
    objects = ExperimentManager()
    user = models.ForeignKey(ExperimentUser)
    survey = models.ForeignKey(Survey)
    survey_condition = models.IntegerField(default=0)
    session_key = models.CharField(max_length=40, blank=True, editable=False)
    remote_address  = models.IPAddressField()
    remote_host  = models.CharField(max_length=255)
    http_referer = models.CharField(max_length=255)
    http_user_agent = models.TextField()
    allMetaData = models.TextField()
    finished = models.BooleanField(_('experiment is finished'), default=False)
    state = models.IntegerField(default=0, choices=EXP_STATE_TYPES)
    version = models.IntegerField(default=0)
    
    def natural_key(self):
        return self.user.natural_key() + self.survey.natural_key()
    natural_key.dependencies = ['survey.ExperimentUser', 'survey.Survey']

    def __unicode__(self):
        return str(self.pk)+ " "+self.survey.slug

    class Meta:
        unique_together = (('user', 'survey'),)

class ExperimentAnswerManager(models.Manager):
    def get_by_natural_key(self, experiment_key, question_key, user_key):
        return self.get(experiment=Experiment.objects.get_by_natural_key(experiment_key), question=Question.objects.get_by_natural_key(question_key), user=ExperimentUser.objects.get_by_natural_key(user_key))    

class ExperimentAnswer(models.Model):
    objects = ExperimentAnswerManager()

    experiment = models.ForeignKey(Experiment)
    question = models.ForeignKey(Question)
    answer = models.TextField(blank=True, null=True)
    confidence = models.IntegerField(default=0, choices=CONFIDENCE_TYPES, blank=True, null=True)
    user = models.ForeignKey(ExperimentUser)
    submitted_at = models.DateTimeField(default=datetime.datetime.now)
    mouseData = models.TextField()
    finished = models.BooleanField(_('question is finished'), default=False)
    #version = models.IntegerField(default=0)
    
    def natural_key(self):
        return self.experiment.natural_key() + self.question.natural_key() + self.user.natural_key()
    natural_key.dependencies = ['survey.Experiment', 'survey.Question', 'survey.ExperimentUser']

    def question_id(self):
        return self.question.pk
    def user_id(self):
        return self.user.pk
    def __unicode__(self):
        return str(self.question.pk)+" "+self.user.worker_id

    class Meta:
        unique_together = (('experiment', 'question', 'user'),)

class ExperimentAnswerProcessed(models.Model):
    source_answer = models.ForeignKey(ExperimentAnswer)
    # original data
    experiment = models.ForeignKey(Experiment)
    question = models.ForeignKey(Question)
    answer = models.TextField(blank=True, null=True)
    confidence = models.IntegerField(default=0, choices=CONFIDENCE_TYPES)
    user = models.ForeignKey(ExperimentUser)
    processed_at = models.DateTimeField(default=datetime.datetime.now)
    
    # compressed data
    init_event = models.TextField()
    mouse_move_event = models.TextField()
    mouse_click_event = models.TextField()
    keydown_event = models.TextField()
    scroll_event = models.TextField()
    misc_event = models.TextField()
    elements = models.TextField(null=True)
    
    #version = models.IntegerField(default=0)
    
    # analitic data
    time = models.DecimalField(default=0.0, max_digits=19, decimal_places=10)
    clicks_count = models.IntegerField(default=0)
    keys_count = models.IntegerField(default=0)
    scroll_count = models.IntegerField(default=0)
    cursor_y = models.TextField()
    window_h = models.IntegerField(default=0)
    window_w = models.IntegerField(default=0)
    bias = models.DecimalField(default=0.0, max_digits=19, decimal_places=10)
    error = models.DecimalField(default=0.0, max_digits=19, decimal_places=10)
    
    def __unicode__(self):
        return str(self.answer)
"""
class Category(models.Model):
    name = models.CharField(max_length=255, blank=False, null=False)
    def __unicode__(self):
        return str(self.text)

class Comment(models.Model):
    text = models.TextField(blank=True)
    answers = models.ManyToManyField(ExperimentAnswerProcessed, blank=True, null=True, through='AnswerCommentRelationship')
    categories = models.ManyToManyField(Category, blank=True, null=True)
    creation_date = models.DateTimeField(auto_now=True, blank=True)
    def __unicode__(self):
        return str(self.text)

class AnswerCommentRelationship(models.Model):
    answer = models.ForeignKey(ExperimentAnswerProcessed)
    comment = models.ForeignKey(Comment)
    events = models.TextField()
    
    def __unicode__(self):
        return self.answer.pk + " " + self.comment.pk
"""