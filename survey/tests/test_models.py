"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase
from survey.models import Survey, Question, SurveyMembership
from django.utils import timezone

class SurveyTest(TestCase):
    def test_creating_a_new_survey_and_saving_it_to_the_database(self):
        survey = Survey()
        survey.slug = "whats-up"
        survey.pub_date = timezone.now()

        # check we can save it to the database
        survey.save()

        # now check we can find it in the database again
        all_surveys_in_database = Survey.objects.all()
        self.assertEquals(len(all_surveys_in_database), 1)
        only_survey_in_database = all_surveys_in_database[0]
        self.assertEquals(only_survey_in_database, survey)

        # and check that it's saved its two attributes: name and pub_date
        self.assertEquals(only_survey_in_database.slug, survey.slug)
        self.assertEquals(only_survey_in_database.pub_date, survey.pub_date)

    def test_verbose_name_for_pub_date(self):
        for field in Survey._meta.fields:
            if field.name ==  'pub_date':
                self.assertEquals(field.verbose_name, 'Date published')
                
    def test_survey_objects_are_named_after_their_name(self):
        p = Survey()
        p.slug = 'how-is-babby-formed'
        self.assertEquals(unicode(p), 'how-is-babby-formed')
    
    def test_survey_objects_have_unique_slug_and_url(self):
        pass
    
    def test_survey_success_code(self):
        pass
    
    def test_survey_status(self):
        pass

class QuestionModelTest(TestCase):
    def test_creating_some_questions_for_a_survey_with_order(self):
        survey1 = Survey.objects.create(slug="survey1", pub_date=timezone.now())
        question1 = Question.objects.create(data="{'question':'Question 1'}", slug="question-1")
        question2 = Question.objects.create(data="{'question':'Question 2'}", slug="question-2")
        m1 = SurveyMembership(survey=survey1, question=question1, order = 1)
        m1.save()
                
        survey_questions = survey1.questions.all()
        self.assertEquals(survey_questions.count(), 1)
        question_from_db = survey_questions[0]
        self.assertEquals(question_from_db, question1)
        
        #rest reverce lookup as well
        surveys_with_this_question = question1.survey_set.all()
        self.assertEquals(surveys_with_this_question.count(), 1)
        self.assertEquals(surveys_with_this_question[0], survey1)
        
        m2 = SurveyMembership.objects.create(survey=survey1, question=question1, order = 1)
        
        survey_questions = survey1.questions.all()
        self.assertEquals(survey_questions.count(), 2)
        
class ExperimentModelTest(TestCase):
    def test_creating_an_experiment(self):
        pass
    
class ExperimentAnswerModelTest(TestCase):
    def test_creating_an_experiment_answer(self):
        pass