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

#import unittest
import sys
from django.test import LiveServerTestCase
from selenium import webdriver
from selenium.webdriver.common.keys import Keys

class AdminSiteTest(LiveServerTestCase): #
    fixtures = ['admin_user.json']
    @classmethod
    def setUpClass(cls):
        for arg in sys.argv:
            if 'liveserver' in arg:
                cls.server_url = 'http://' + arg.split('=')[1]
                return
        LiveServerTestCase.setUpClass()
        cls.server_url = cls.live_server_url

    @classmethod
    def tearDownClass(cls):
        if cls.server_url == cls.live_server_url:
            LiveServerTestCase.tearDownClass()

            
    def setUp(self): 
        self.browser = webdriver.Firefox()
        self.browser.implicitly_wait(4)

    def tearDown(self): 
        self.browser.quit()

    def test_login_into_admin_site(self):
        # Edith has heard about a cool new online to-do app. She goes
        # to check out its homepage
        self.browser.get(self.live_server_url + '/admin/')

        # She sees the familiar 'Django administration' heading
        body = self.browser.find_element_by_tag_name('body')
        self.assertIn('Django administration', body.text)

        # She types in her username and passwords and hits return
        username_field = self.browser.find_element_by_name('username')
        username_field.send_keys('admin')

        password_field = self.browser.find_element_by_name('password')
        password_field.send_keys('admin')
        password_field.send_keys(Keys.RETURN)

        # her username and password are accepted, and she is taken to
        # the Site Administration page
        body = self.browser.find_element_by_tag_name('body')
        self.assertIn('Site administration', body.text)
    
    def test_creating_new_survey(self):
        self.test_login_into_admin_site()
        # She now sees a of hyperlink that says "Surveys"
        survey_links = self.browser.find_elements_by_link_text('Surveys')
        self.assertEquals(len(survey_links), 1)
        
        # The first one looks good
        survey_links[0].click()
        
        body = self.browser.find_element_by_tag_name('body')
        self.assertIn('0 surveys', body.text)
        
        new_survey_link = self.browser.find_element_by_link_text('Add survey')
        new_survey_link.click()
        
        # She sees some input fields for "Question" and "Date published"
        body = self.browser.find_element_by_tag_name('body')
        self.assertIn('Slug:', body.text)
        self.assertIn('Date published:', body.text)
        
        # She types in an interesting question for the Poll
        question_field = self.browser.find_element_by_name('slug')
        question_field.send_keys("how-awesome-is")
    
        # She sets the date and time of publication - it'll be a new year's poll!
        #date_field = self.browser.find_element_by_name('pub_date_0')
        #date_field.send_keys('2013-07-22')
        #time_field = self.browser.find_element_by_name('pub_date_1')
        #time_field.send_keys('00:00')
        
        # Gertrude clicks the save button
        save_button = self.browser.find_element_by_css_selector("input[value='Save']")
        save_button.click()
        
        # Make sure we succeeded at saving the model so left Add survey page
        h1 = self.browser.find_element_by_tag_name('h1')
        self.assertNotEquals(h1.text, 'Add survey')
        
        # She is returned to the "Polls" listing, where she can see her
        # new poll, listed as a clickable link
        new_survey_links = self.browser.find_elements_by_link_text(
                "how-awesome-is"
        )
        self.assertEquals(len(new_survey_links), 1)

        
        