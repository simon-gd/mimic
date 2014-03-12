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


class Question(models.Model):
    slug = models.SlugField(_('Slug'), max_length=255, unique=True)
    base_template = models.CharField(max_length=255, default="question_v2.html")
    template = models.CharField(max_length=255)
    correct_answer = models.TextField(blank=True, null=True)
    data = models.TextField()
    def __unicode__(self):
        return self.slug

class Survey(models.Model):
    slug = models.SlugField(_('Slug'), max_length=255, unique=True)
    pub_date = models.DateTimeField(_('Date published'))
    questions = models.ManyToManyField(Question, blank=True, null=True, through='SurveyMembership')
    active = models.BooleanField(_('Survey is active'), default=False)
    survey_code = models.CharField(max_length=255,default="2lMGut4I4h")
    condition_count = models.IntegerField(default=4)
     
    def __unicode__(self):
        return self.slug
    
    @models.permalink
    def get_absolute_url(self):
        return ('survey-detail', (), {'survey_slug': self.slug })
    
class SurveyMembership(models.Model):
    survey = models.ForeignKey(Survey)
    question = models.ForeignKey(Question)
    order = models.IntegerField()
    desired_answers = models.IntegerField(default=1)
    
    def __unicode__(self):
        return self.survey.slug + " " + self.question.slug
    
class ExperimentUser(models.Model):
    worker_id = models.CharField(max_length=255)
    def __unicode__(self):
        return self.worker_id
    
class Experiment(models.Model):
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
    
    def __unicode__(self):
        return self.user.worker_id+ " "+self.survey.slug

class ExperimentAnswer(models.Model):
    experiment = models.ForeignKey(Experiment)
    question = models.ForeignKey(Question)
    answer = models.TextField(blank=True, null=True)
    confidence = models.IntegerField(default=0, choices=CONFIDENCE_TYPES)
    user = models.ForeignKey(ExperimentUser)
    submitted_at = models.DateTimeField(default=datetime.datetime.now)
    mouseData = models.TextField()
    finished = models.BooleanField(_('question is finished'), default=False)
    #version = models.IntegerField(default=0)
    
    def question_id(self):
        return self.question.pk
    def user_id(self):
        return self.user.pk
    def __unicode__(self):
        return str(self.question.pk)+" "+self.user.worker_id

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