"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from django.test import TestCase

class SurveyViewTest(TestCase):
    def test_no_active_survey_redirect(self):
        response = self.client.get('/')
        # if there is no active survey redirect to  no_active_survey
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, '/survey/no_active_survey/')
        
        response = self.client.get('/survey/')
        # if there is no active survey redirect to  no_active_survey
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, '/survey/no_active_survey/')
    

    def test_survey(self):
        response = self.client.get('/')
        
    
    def test_has_worker_id_in_url(self):
        #make a request with the workerId in the URL
        response = self.client.get('/survey/?hitId=2384239&assignmentId=ASD98ASDFADJKH&workerId=ASDFASD8')
        #start the survey
    
    def test_has_has_no_worker_id_in_url(self):
        #make a request with the workerId in the URL
        response = self.client.get('/survey/')
        #start the survey