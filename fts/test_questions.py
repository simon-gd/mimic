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
import time

class QuestionsTest(LiveServerTestCase): #
    fixtures = ['admin_user.json', 'survey_data.json']
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
        self.browser.implicitly_wait(5)
        
    def tearDown(self):
        self.browser.quit()
    
    def render_questions(self, number):
        surl = self.server_url
        surl = surl.replace('localhost', '127.0.0.1')
        self.browser.get(surl + '/survey/admin/debug_question/'+str(number)+'/')
        
        username_field = self.browser.find_element_by_name('username')
        username_field.send_keys('admin')

        password_field = self.browser.find_element_by_name('password')
        password_field.send_keys('admin')
        password_field.send_keys(Keys.RETURN)
        
        #self.browser.implicitly_wait(10)
        time.sleep(5) # Let the page load, will be added to the API
        #self.browser.save_screenshot('fts/media/question'+str(number)+'.png')
        self.browser.save_screenshot('C:\\research\\sandbox\\src\\websites\\experiscope_project\\experiscope\\fts\\media\\question'+str(number)+'.png')
        time.sleep(5)
    
    def render_questions2(self, name, template, data):
        surl = self.server_url
        surl = surl.replace('localhost', '127.0.0.1')
    
        self.browser.get(surl + '/survey/admin/debug_question/?template='+template+'&data='+data)
        
        username_field = self.browser.find_element_by_name('username')
        username_field.send_keys('admin')

        password_field = self.browser.find_element_by_name('password')
        password_field.send_keys('admin')
        password_field.send_keys(Keys.RETURN)
        
        #self.browser.implicitly_wait(10)
        time.sleep(5) # Let the page load, will be added to the API
        #self.browser.save_screenshot('fts/media/'+name+'.png')
        self.browser.save_screenshot('C:\\research\\sandbox\\src\\websites\\experiscope_project\\experiscope\\fts\\media\\'+name+'.png')
        time.sleep(5)

    def test_questions1(self): 
        self.render_questions(1)

    def test_questions2(self): 
        self.render_questions(2)
    
    def test_questions3(self): 
        self.render_questions(3)
    
    def test_questions4(self): 
        self.render_questions(4)
    
    def test_questions5_tree(self):
        #/survey/admin/debug_question/?template=canvas_simple_question.html&data={question: [{p: "Who is the email message sent to?"}],answers: ["Ginger Holmes", "John Stone", "Pat Jones", "Edward Downs", "Sadie Stinfeld"]}
        template = 'canvas_simple_question.html'
        data = '{question: [{p: "Who is the email message sent to?"}],answers: ["Ginger Holmes", "John Stone", "Pat Jones", "Edward Downs", "Sadie Stinfeld"]}'
        self.render_questions2("question5_tree", template, data)
    
    def test_questions6_icon_array(self):
        #/survey/admin/debug_question/?template=canvas_simple_question.html&data={question: [{image: {url:"img/email.png", width:678, height:523}},{p: "Who is the email message sent to?"}],answers: ["Ginger Holmes", "John Stone", "Pat Jones", "Edward Downs", "Sadie Stinfeld"]}
        template = 'canvas_simple_question.html'
        data = '{question: [{p: "Who is the email message sent to?"}],answers: ["Ginger Holmes", "John Stone", "Pat Jones", "Edward Downs", "Sadie Stinfeld"]}'
        self.render_questions2("question5_icon_array", template, data)
    
    def test_questions7_venn(self):
        #/survey/admin/debug_question/?template=canvas_simple_question.html&data={question: [{image: {url:"img/email.png", width:678, height:523}},{p: "Who is the email message sent to?"}],answers: ["Ginger Holmes", "John Stone", "Pat Jones", "Edward Downs", "Sadie Stinfeld"]}
        template = 'canvas_simple_question.html'
        data = '{question: [{p: "Who is the email message sent to?"}],answers: ["Ginger Holmes", "John Stone", "Pat Jones", "Edward Downs", "Sadie Stinfeld"]}'
        self.render_questions2("question5_venn", template, data)
    
    def test_questions8_sankey(self):
        #/survey/admin/debug_question/?template=canvas_simple_question.html&data={question: [{image: {url:"img/email.png", width:678, height:523}},{p: "Who is the email message sent to?"}],answers: ["Ginger Holmes", "John Stone", "Pat Jones", "Edward Downs", "Sadie Stinfeld"]}
        template = 'canvas_simple_question.html'
        data = '{question: [{p: "Who is the email message sent to?"}],answers: ["Ginger Holmes", "John Stone", "Pat Jones", "Edward Downs", "Sadie Stinfeld"]}'
        self.render_questions2("question5_sankey", template, data)
    #def test_user_can_take_a_survey(self): 
    #    pass
        