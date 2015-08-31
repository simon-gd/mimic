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