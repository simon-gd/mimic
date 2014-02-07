# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Question'
        db.create_table(u'survey_question', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('slug', self.gf('django.db.models.fields.SlugField')(unique=True, max_length=255)),
            ('template', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('correct_answer', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('data', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal(u'survey', ['Question'])

        # Adding model 'Survey'
        db.create_table(u'survey_survey', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('slug', self.gf('django.db.models.fields.SlugField')(unique=True, max_length=255)),
            ('pub_date', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
            ('active', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('survey_code', self.gf('django.db.models.fields.CharField')(default='2lMGut4I4h', max_length=255)),
            ('condition_count', self.gf('django.db.models.fields.IntegerField')(default=4)),
        ))
        db.send_create_signal(u'survey', ['Survey'])

        # Adding model 'SurveyMembership'
        db.create_table(u'survey_surveymembership', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('survey', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.Survey'])),
            ('question', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.Question'])),
            ('order', self.gf('django.db.models.fields.IntegerField')()),
            ('desired_answers', self.gf('django.db.models.fields.IntegerField')(default=1)),
        ))
        db.send_create_signal(u'survey', ['SurveyMembership'])

        # Adding model 'ExperimentUser'
        db.create_table(u'survey_experimentuser', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('worker_id', self.gf('django.db.models.fields.CharField')(max_length=255)),
        ))
        db.send_create_signal(u'survey', ['ExperimentUser'])

        # Adding model 'Experiment'
        db.create_table(u'survey_experiment', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.ExperimentUser'])),
            ('survey', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.Survey'])),
            ('survey_condition', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('session_key', self.gf('django.db.models.fields.CharField')(max_length=40, blank=True)),
            ('remote_address', self.gf('django.db.models.fields.IPAddressField')(max_length=15)),
            ('remote_host', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('http_referer', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('http_user_agent', self.gf('django.db.models.fields.TextField')()),
            ('allMetaData', self.gf('django.db.models.fields.TextField')()),
            ('finished', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('state', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('version', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal(u'survey', ['Experiment'])

        # Adding model 'ExperimentAnswer'
        db.create_table(u'survey_experimentanswer', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('experiment', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.Experiment'])),
            ('question', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.Question'])),
            ('answer', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('confidence', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.ExperimentUser'])),
            ('submitted_at', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
            ('mouseData', self.gf('django.db.models.fields.TextField')()),
            ('finished', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal(u'survey', ['ExperimentAnswer'])

        # Adding model 'ExperimentAnswerProcessed'
        db.create_table(u'survey_experimentanswerprocessed', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('source_answer', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.ExperimentAnswer'])),
            ('experiment', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.Experiment'])),
            ('question', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.Question'])),
            ('answer', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('confidence', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.ExperimentUser'])),
            ('processed_at', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
            ('init_event', self.gf('django.db.models.fields.TextField')()),
            ('mouse_move_event', self.gf('django.db.models.fields.TextField')()),
            ('mouse_click_event', self.gf('django.db.models.fields.TextField')()),
            ('keydown_event', self.gf('django.db.models.fields.TextField')()),
            ('scroll_event', self.gf('django.db.models.fields.TextField')()),
            ('misc_event', self.gf('django.db.models.fields.TextField')()),
            ('time', self.gf('django.db.models.fields.DecimalField')(default=0.0, max_digits=19, decimal_places=10)),
            ('clicks_count', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('keys_count', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('scroll_count', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('cursor_y', self.gf('django.db.models.fields.TextField')()),
            ('window_h', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('window_w', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('bias', self.gf('django.db.models.fields.DecimalField')(default=0.0, max_digits=19, decimal_places=10)),
            ('error', self.gf('django.db.models.fields.DecimalField')(default=0.0, max_digits=19, decimal_places=10)),
        ))
        db.send_create_signal(u'survey', ['ExperimentAnswerProcessed'])


    def backwards(self, orm):
        # Deleting model 'Question'
        db.delete_table(u'survey_question')

        # Deleting model 'Survey'
        db.delete_table(u'survey_survey')

        # Deleting model 'SurveyMembership'
        db.delete_table(u'survey_surveymembership')

        # Deleting model 'ExperimentUser'
        db.delete_table(u'survey_experimentuser')

        # Deleting model 'Experiment'
        db.delete_table(u'survey_experiment')

        # Deleting model 'ExperimentAnswer'
        db.delete_table(u'survey_experimentanswer')

        # Deleting model 'ExperimentAnswerProcessed'
        db.delete_table(u'survey_experimentanswerprocessed')


    models = {
        u'survey.experiment': {
            'Meta': {'object_name': 'Experiment'},
            'allMetaData': ('django.db.models.fields.TextField', [], {}),
            'finished': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'http_referer': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'http_user_agent': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'remote_address': ('django.db.models.fields.IPAddressField', [], {'max_length': '15'}),
            'remote_host': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'session_key': ('django.db.models.fields.CharField', [], {'max_length': '40', 'blank': 'True'}),
            'state': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'survey': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.Survey']"}),
            'survey_condition': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.ExperimentUser']"}),
            'version': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'survey.experimentanswer': {
            'Meta': {'object_name': 'ExperimentAnswer'},
            'answer': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'confidence': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'experiment': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.Experiment']"}),
            'finished': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'mouseData': ('django.db.models.fields.TextField', [], {}),
            'question': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.Question']"}),
            'submitted_at': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.ExperimentUser']"})
        },
        u'survey.experimentanswerprocessed': {
            'Meta': {'object_name': 'ExperimentAnswerProcessed'},
            'answer': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'bias': ('django.db.models.fields.DecimalField', [], {'default': '0.0', 'max_digits': '19', 'decimal_places': '10'}),
            'clicks_count': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'confidence': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'cursor_y': ('django.db.models.fields.TextField', [], {}),
            'error': ('django.db.models.fields.DecimalField', [], {'default': '0.0', 'max_digits': '19', 'decimal_places': '10'}),
            'experiment': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.Experiment']"}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'init_event': ('django.db.models.fields.TextField', [], {}),
            'keydown_event': ('django.db.models.fields.TextField', [], {}),
            'keys_count': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'misc_event': ('django.db.models.fields.TextField', [], {}),
            'mouse_click_event': ('django.db.models.fields.TextField', [], {}),
            'mouse_move_event': ('django.db.models.fields.TextField', [], {}),
            'processed_at': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'question': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.Question']"}),
            'scroll_count': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'scroll_event': ('django.db.models.fields.TextField', [], {}),
            'source_answer': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.ExperimentAnswer']"}),
            'time': ('django.db.models.fields.DecimalField', [], {'default': '0.0', 'max_digits': '19', 'decimal_places': '10'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.ExperimentUser']"}),
            'window_h': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'window_w': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        u'survey.experimentuser': {
            'Meta': {'object_name': 'ExperimentUser'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'worker_id': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        u'survey.question': {
            'Meta': {'object_name': 'Question'},
            'correct_answer': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'data': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'slug': ('django.db.models.fields.SlugField', [], {'unique': 'True', 'max_length': '255'}),
            'template': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        u'survey.survey': {
            'Meta': {'object_name': 'Survey'},
            'active': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'condition_count': ('django.db.models.fields.IntegerField', [], {'default': '4'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'pub_date': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'questions': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['survey.Question']", 'null': 'True', 'through': u"orm['survey.SurveyMembership']", 'blank': 'True'}),
            'slug': ('django.db.models.fields.SlugField', [], {'unique': 'True', 'max_length': '255'}),
            'survey_code': ('django.db.models.fields.CharField', [], {'default': "'2lMGut4I4h'", 'max_length': '255'})
        },
        u'survey.surveymembership': {
            'Meta': {'object_name': 'SurveyMembership'},
            'desired_answers': ('django.db.models.fields.IntegerField', [], {'default': '1'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'order': ('django.db.models.fields.IntegerField', [], {}),
            'question': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.Question']"}),
            'survey': ('django.db.models.fields.related.ForeignKey', [], {'to': u"orm['survey.Survey']"})
        }
    }

    complete_apps = ['survey']