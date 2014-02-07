#import unittest
import sys
from django.test import LiveServerTestCase
from selenium import webdriver
from selenium.webdriver.common.keys import Keys

class SmokeTest(LiveServerTestCase): #

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
        self.browser.implicitly_wait(3)

    def tearDown(self): 
        self.browser.quit()
    
    def test_main_smoke_test(self): 
        # Edith has heard about a cool new online to-do app. She goes
        # to check out its homepage
        self.browser.get(self.server_url)
        #self.browser.get('http://localhost:8000')

        # She notices the page title and header mention to-do lists
        self.assertIn('experiscope', self.browser.title)
        
        self.browser.get(self.live_server_url + '/admin/')

        # She sees the familiar 'Django administration' heading
        body = self.browser.find_element_by_tag_name('body')
        self.assertIn('Django administration', body.text)
    
    def test_user_can_take_a_survey(self): 
        pass
        
        