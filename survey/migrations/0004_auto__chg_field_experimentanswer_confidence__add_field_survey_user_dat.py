# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):

        # Changing field 'ExperimentAnswer.confidence'
        db.alter_column(u'survey_experimentanswer', 'confidence', self.gf('django.db.models.fields.IntegerField')(null=True))
        # Adding field 'Survey.user_data_version'
        db.add_column(u'survey_survey', 'user_data_version',
                      self.gf('django.db.models.fields.CharField')(default='1.4.0', max_length=255),
                      keep_default=False)


    def backwards(self, orm):

        # Changing field 'ExperimentAnswer.confidence'
        db.alter_column(u'survey_experimentanswer', 'confidence', self.gf('django.db.models.fields.IntegerField')())
        # Deleting field 'Survey.user_data_version'
        db.delete_column(u'survey_survey', 'user_data_version')


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
            'confidence': ('django.db.models.fields.IntegerField', [], {'default': '0', 'null': 'True', 'blank': 'True'}),
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
            'base_template': ('django.db.models.fields.CharField', [], {'default': "'question_v2.html'", 'max_length': '255'}),
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
            'pub_date': ('django.db.models.fields.DateTimeField', [], {}),
            'questions': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'to': u"orm['survey.Question']", 'null': 'True', 'through': u"orm['survey.SurveyMembership']", 'blank': 'True'}),
            'slug': ('django.db.models.fields.SlugField', [], {'unique': 'True', 'max_length': '255'}),
            'survey_code': ('django.db.models.fields.CharField', [], {'default': "'2lMGut4I4h'", 'max_length': '255'}),
            'user_data_version': ('django.db.models.fields.CharField', [], {'default': "'1.4.0'", 'max_length': '255'})
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