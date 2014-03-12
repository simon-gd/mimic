# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting model 'Comment'
        db.delete_table(u'survey_comment')

        # Removing M2M table for field categories on 'Comment'
        db.delete_table(db.shorten_name(u'survey_comment_categories'))

        # Deleting model 'AnswerCommentRelationship'
        db.delete_table(u'survey_answercommentrelationship')

        # Deleting model 'Category'
        db.delete_table(u'survey_category')

        # Adding field 'Question.base_template'
        db.add_column(u'survey_question', 'base_template',
                      self.gf('django.db.models.fields.CharField')(default='base.html', max_length=255),
                      keep_default=False)


    def backwards(self, orm):
        # Adding model 'Comment'
        db.create_table(u'survey_comment', (
            ('text', self.gf('django.db.models.fields.TextField')(blank=True)),
            ('creation_date', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal(u'survey', ['Comment'])

        # Adding M2M table for field categories on 'Comment'
        m2m_table_name = db.shorten_name(u'survey_comment_categories')
        db.create_table(m2m_table_name, (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('comment', models.ForeignKey(orm[u'survey.comment'], null=False)),
            ('category', models.ForeignKey(orm[u'survey.category'], null=False))
        ))
        db.create_unique(m2m_table_name, ['comment_id', 'category_id'])

        # Adding model 'AnswerCommentRelationship'
        db.create_table(u'survey_answercommentrelationship', (
            ('answer', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.ExperimentAnswerProcessed'])),
            ('comment', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['survey.Comment'])),
            ('events', self.gf('django.db.models.fields.TextField')()),
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal(u'survey', ['AnswerCommentRelationship'])

        # Adding model 'Category'
        db.create_table(u'survey_category', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
        ))
        db.send_create_signal(u'survey', ['Category'])

        # Deleting field 'Question.base_template'
        db.delete_column(u'survey_question', 'base_template')


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
            'base_template': ('django.db.models.fields.CharField', [], {'default': "'base.html'", 'max_length': '255'}),
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