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

import json
import math
import csv
import pickle
import os.path
import numpy as np
import zlib
import time
from datetime import datetime
import re
import ast
from base64 import b64decode, b64encode
import urllib2
from distutils.version import LooseVersion, StrictVersion

from django.core import serializers
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist, MultipleObjectsReturned
from django.template import RequestContext
from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse
from django.shortcuts import redirect, render, render_to_response, get_object_or_404, get_list_or_404

from survey.models import Question, Survey, SurveyMembership, Experiment, ExperimentUser, ExperimentAnswer, ExperimentAnswerProcessed, VIS_TYPES, EXP_STATE_TYPES
from survey.views import desktop_only
from survey_admin.models import CodeFile


from django.conf import settings
from scipy import stats

from mimic import settings

from migrate_data import *

# Survey Admin Views

@staff_member_required
def get_stat_similarity(request):
    groups = json.loads(request.POST["groups"])
    H, p = stats.kruskal(*groups)
    u, prob = stats.mannwhitneyu(groups[0], groups[1], True)
    f_val, p_val = stats.f_oneway(*groups)
    #wilcoxT, wilcoxP = stats.wilcoxon(groups[0], groups[1], 'wilcox')
    
    std0 = np.std(groups[0])
    mean0 =  np.mean(groups[0])
    median0 =np.median(groups[0])
    std1 = np.std(groups[1])
    mean1 = np.mean(groups[1])
    median1 =np.median(groups[1])
    
    statsData = {'kruskal': {'H':H, 'p':p}, 'mannwhitneyu': {'u':u, 'p':prob},'f_oneway': {'f':f_val, 'p': p_val},
                 'stats':{'g0': {'std':std0, 'mean':mean0, 'median':median0}, 'g1': {'std':std1, 'mean':mean1, 'median':median1}}}
    return HttpResponse(json.dumps(statsData), mimetype="application/json")

def get_stat_correlation(request):
    groups = json.loads(request.POST["groups"])
    if (len(groups[0]) == len(groups[1])):
        pearson_r,pearson_p = stats.pearsonr(groups[0], groups[1])
        pearson = {'r': pearson_r, 'p':pearson_p}
        spearman_rho , spearman_p = stats.spearmanr(groups[0], groups[1])
        spearmanr = {'rho': spearman_rho, 'p':spearman_p}
    else:
        pearson = "Error: groups not the same size"
        spearmanr = "Error: groups not the same size"
    statsData = {'pearsonr': pearson, 'spearmanr': spearmanr}
    return HttpResponse(json.dumps(statsData), mimetype="application/json")

@staff_member_required
def save_analysis_file(request):
    if "name" in request.POST and 'code' in request.POST:
        name = request.POST["name"]
        code = request.POST["code"]
        try:
            #update
            code_file = CodeFile.objects.get(name=name)
            code_file.code = code
            code_file.save()
        except CodeFile.DoesNotExist:
            code_file = CodeFile.objects.create(name=name, code=code);
        return HttpResponse('{"status":"done", "id":'+str(code_file.id)+'}', mimetype="application/json")
    else:
        return HttpResponse('{"status":"failed, no post varibales"}', mimetype="application/json")

@staff_member_required
def open_analysis_file(request):
    print(request.GET)
    if "filename[]" in request.GET:
        name = request.GET["filename[]"]
        try:
            #update
            code_file = CodeFile.objects.get(name=name)
            fileData = {}
            fileData['id'] = code_file.id
            fileData['name'] = name
            fileData['code'] = code_file.code
            return HttpResponse(json.dumps(fileData), mimetype="application/json")
        except CodeFile.DoesNotExist:
            return HttpResponse('{"status":"failed, file not found"}', mimetype="application/json")
    return HttpResponse('{"status":"name unknows"}', mimetype="application/json")
        

@staff_member_required
def get_file_list(request):
    files = CodeFile.objects.all()
    fileNames = []
    for f in files:
        fileNames.append(f.name)
    jsonFileNames = json.dumps(fileNames)    
    return HttpResponse(jsonFileNames, mimetype="application/json")

def processLine(line):
    vals = line.split('\t')
    
    if vals[1] == "keydown":
        return {"time": vals[0], "action": vals[1], "key": vals[2] }
    elif vals[1] == "blur" or vals[1] == "focus" or vals[1] == "scroll":
        return {"time": vals[0], "action": vals[1] }
    else:
        return {"time": vals[0], "action": vals[1], "x": vals[2], "y": vals[3] }

import requests

def mymake_blob_url(container_name, blob_name):
        '''
        Creates the url to access a blob.
        container_name: Name of container.
        blob_name: Name of blob.
        account_name:
            Name of the storage account. If not specified, uses the account
            specified when BlobService was initialized.
        protocol:
            Protocol to use: 'http' or 'https'. If not specified, uses the
            protocol specified when BlobService was initialized.
        host_base:
            Live host base url.  If not specified, uses the host base specified
            when BlobService was initialized.
        '''

        return '{0}://{1}{2}/{3}/{4}'.format(settings.AZURE_PROTOCOL,
                                             settings.AZURE_STORAGE_ACCOUNT,
                                             settings.AZURE_HOST_BASE,
                                             container_name,
                                             blob_name)

def json_preprocess_answers_140(request, survey_id):

    survey = get_object_or_404(Survey, id=survey_id)
    api_version = StrictVersion(survey.user_data_version)

    if api_version != StrictVersion("1.4.0"):
        return HttpResponse('{"error":"Api version not supported in json_preprocess_answers function('+str(api_version)+')"}', mimetype="application/json")


    expected_answers = SurveyMembership.objects.filter(survey=survey).count()
                
    expAns = ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True)
    create_count = 0
    updated_count = 0
    skipped_count = 0
    errors = []
    force_reprocess = False
    #debug_data = "";
    if "force_reprocess" in request.GET:
        force_reprocess = request.GET["force_reprocess"]

    for a in expAns:
        p_a = None
        try:
            p_a = ExperimentAnswerProcessed.objects.get(source_answer=a)
            #p_a.experiment=a.experiment
            #p_a.question=a.question
            #p_a.answer=str(a.answer)
            #p_a.confidence=a.confidence
            #p_a.user=a.user
            #p_a.save()
          
            print(a.id, "Already exists")
            if not force_reprocess:
                continue
            updated_count += 1
        except MultipleObjectsReturned:
            print(a.id, "MultipleObjectsReturned")
            ExperimentAnswerProcessed.objects.filter(source_answer=a).delete()
            p_a = ExperimentAnswerProcessed.objects.create(source_answer=a, experiment=a.experiment, question=a.question, answer=str(a.answer), confidence=a.confidence, user=a.user)
            create_count += 1
        except ExperimentAnswerProcessed.DoesNotExist:
            # create a new
            try:
                print(a.id, "ExperimentAnswerProcessed.DoesNotExist")
                p_a = ExperimentAnswerProcessed.objects.create(source_answer=a, experiment=a.experiment, question=a.question, answer=str(a.answer), confidence=a.confidence, user=a.user)
                create_count += 1
            except:
                print(a.id, "ExperimentAnswerProcessed.DoesNotExist Failed to create new item")
                continue
        if len(a.answer) > 0:
            p_a.answer = a.answer
            #validate answer
        
            correct_answer = json.loads(a.question.correct_answer.encode('utf-8'))
            answer = json.loads(p_a.answer.encode('utf-8'))
            if len(answer) > 0:
                for k,v in answer.iteritems():
                    answer[k] = str(v)

                #for k,v in correct_answer.iteritems():
                #    val = str(v)
                #    if val.isdigit():
                #        prev_a = answer[k]
                #        answer[k] = re.sub("[^\d\.]", "", answer[k])
                #        if answer[k] != prev_a:
                #            print("changed ", answer[k], prev_a)
                p_a.answer = json.dumps(answer)

        clicks = 0
        scrolls = 0
        ttime = 0
        keydown = 0
        cursor_y = []
        window_w = 0
        window_h = 0
        mouseMoveEvents = []
        initEvents = []
        clickEvents = []
        keydownEvents = []
        scrollEvents = []
        miscEvents = []
        elements = {}
        try:
            #debug_data += " MIMIC_USE_AZURE_BLOB: "+ str(settings.MIMIC_USE_AZURE_BLOB)
            eventDataURL = a.mouseData
            

            #if settings.MIMIC_USE_AZURE_BLOB:
            #    if not eventDataURL.startswith(settings.AZURE_PROTOCOL):
            #        print(eventDataURL, settings.AZURE_PROTOCOL)
            #        b = eventDataURL.split("/")
            #        eventDataURL = mymake_blob_url(b[0], b[1]);
            #    response = requests.get(str(eventDataURL), timeout=10.0) # urllib2.urlopen(eventDataURL)
            #    if response.status_code != 200:
            #        mouseDataJSON = 0 #return HttpResponse('{"error":"Failed to get file('+str(eventDataURL)+')"}', mimetype="application/json")
            #    else:
            #        mouseDataJSON = response.json() #json.loads(jsonEventData.encode('utf-8'))
            #    
            #
            #else:
            #    #txt = open(eventDataURL)
            #    #response = txt.read()
            #    data_file = open(os.path.join(settings.MEDIA_ROOT,eventDataURL), 'r')   
            #    mouseDataJSON = json.load(data_file)
            #    #mouseDataJSON = json.loads(response)
            
            if not eventDataURL.startswith(settings.AZURE_PROTOCOL):
                try:
                    data_file = open(os.path.join(settings.MEDIA_ROOT,eventDataURL), 'r')   
                    mouseDataJSON = json.load(data_file)
                except Exception as e2:
                    mouseDataJSON = 0
            else:
                response = requests.get(str(eventDataURL), timeout=10.0) # urllib2.urlopen(eventDataURL)
                if response.status_code != 200:
                    mouseDataJSON = 0 #return HttpResponse('{"error":"Failed to get file('+str(eventDataURL)+')"}', mimetype="application/json")
                else:
                    mouseDataJSON = response.json() #json.loads(jsonEventData.encode('utf-8'))


            if mouseDataJSON:
                events = mouseDataJSON["events"];
                
                elements = mouseDataJSON["elements"];
                #debug_data += " elements: "+ str(elements)
                #print(mouseDataJSON)
                start_time = int(round(time.time() * 1000))
                end_time = 0
                for e in events:
                    first_timestamp = events[e][0]['timeStamp']
                    last_timestamp = events[e][-1]['timeStamp']
                    if first_timestamp > 0 and first_timestamp < start_time:
                        start_time = first_timestamp
                    if last_timestamp > end_time:
                        end_time = last_timestamp
                
                start = datetime.fromtimestamp(start_time/1000)
                then = datetime.fromtimestamp(end_time/1000)
                tdelta = then - start
                
                ttime = tdelta.total_seconds() #float(end_time-start_time) / 1000.0
                
                #print("times:", ttime)
                #debug_data += " time: "+ str(ttime)
                for e in events:
                    for dataPt in events[e]:
                        if e == "click":
                            clicks += 1
                            xPos = dataPt['pageX']
                            yPos = dataPt['pageY']
                            clickEvents.append({'time':dataPt['timeStamp']-start_time, 'x':xPos, 'y':yPos, 'type':"click", 'e':dataPt})
                            miscEvents.append({'time':dataPt['timeStamp']-start_time, 'x':xPos, 'y':yPos, 'type':"click", 'e':dataPt})
                        elif e == "scroll":
                            scrolls += 1
                            dx = dataPt['scrollOffset']['pageXOffset']
                            dy = dataPt['scrollOffset']['pageYOffset']
                            scrollEvents.append({'time':dataPt['timeStamp']-start_time, 'dx':dx, 'dy':dy, 'type':"scroll", 'e':dataPt})
                            miscEvents.append({'time':dataPt['timeStamp']-start_time, 'dx':dx, 'dy':dy, 'type':"scroll", 'e':dataPt})
                        elif e == "keydown":
                            keydown += 1
                            keydownEvents.append({'time':dataPt['timeStamp']-start_time, 'key':dataPt['which'], 'type':"keydown", 'e':dataPt})
                            miscEvents.append({'time':dataPt['timeStamp']-start_time, 'key':dataPt['which'], 'type':"keydown", 'e':dataPt})
                        elif e == "mousemove":
                            cursor_y.append(float(dataPt['pageY']))
                            mouseMoveEvents.append({'time':dataPt['timeStamp']-start_time, 'x':dataPt['pageX'], 'y':dataPt['pageY'], 'type':"mousemove", 'e':dataPt})
                            miscEvents.append({'time':dataPt['timeStamp']-start_time, 'x':dataPt['pageX'], 'y':dataPt['pageY'], 'type':"mousemove", 'e':dataPt})
                        elif e == "init":
                            initEvents.append({'time':dataPt['timeStamp']-start_time, 'type':"init", 'e':dataPt})
                            miscEvents.append({'time':dataPt['timeStamp']-start_time, 'type':"init", 'e':dataPt})
                            window_w = mouseDataJSON['elements']['window'][0]['width']
                            window_h = mouseDataJSON['elements']['window'][0]['height']
                        elif e == "resize":
                            rw = dataPt['width']
                            rh = dataPt['height']
                            miscEvents.append({'time':dataPt['timeStamp']-start_time, 'x':rw, 'y':rh, 'type':"resize", 'e':dataPt}) 
                        else:
                            miscEvents.append({'time':dataPt['timeStamp']-start_time, 'type': e, 'e':dataPt, 'extra': dataPt})
                print(p_a.id)
                if p_a != None:
                    #p_a.init_event = json.dumps(initEvents) #b64encode(zlib.compress(json.dumps(initEvents), 9)) 
                    #p_a.mouse_move_event =  json.dumps(mouseMoveEvents)#b64encode(zlib.compress(json.dumps(mouseMoveEvents), 9))
                    #p_a.mouse_click_event =  json.dumps(clickEvents)#b64encode(zlib.compress(json.dumps(clickEvents), 9))
                    #p_a.keydown_event =  json.dumps(keydownEvents)#b64encode(zlib.compress(json.dumps(keydownEvents), 9))
                    #p_a.scroll_event =  json.dumps(scrollEvents) #b64encode(zlib.compress(json.dumps(scrollEvents), 9))
                    p_a.misc_event =  b64encode(zlib.compress(json.dumps( miscEvents ), 9))#json.dumps( miscEvents )#b64encode(zlib.compress(json.dumps( miscEvents ), 9))
                    p_a.elements =  b64encode(zlib.compress(json.dumps( elements ), 9))#json.dumps( elements )#b64encode(zlib.compress(json.dumps( elements ), 9))
                    # analitic data
                    p_a.window_h = window_h
                    p_a.window_w = window_w
                    p_a.time = ttime
                    p_a.clicks_count = clicks
                    p_a.keys_count = keydown
                    p_a.scroll_count = scrolls
                    p_a.cursor_y =  json.dumps( cursor_y )
                    #print("processed Answer ", start_time, end_time, ttime, clicks, keydown)
                    #debug_data += " processed Answer: "+ str(clicks) + " " + str(keydown)
                    p_a.save()
        except Exception as e:
                #error = "json_preprocess_answers:  Error: " + " id: " + str(a.id) + " experiment_id: " +  str(a.experiment.id)
                #errors.append(error)
                #debug_data += " error: "+ str(e)
                skipped_count += 1
                print("Exeption:", e, a.user)
                #raise
                #p_a.delete()

                continue
       
            #print("saving ", p_a.id)
    return HttpResponse('{"created":'+str(create_count)+',"updated":'+str(updated_count)+',"skipped":'+str(skipped_count)+'}', mimetype="application/json")

def json_preprocess_answers_130(request, survey_id):
    survey = get_object_or_404(Survey, id=survey_id)
    api_version = StrictVersion(survey.user_data_version)

    if api_version != StrictVersion("1.3.0"):
        return HttpResponse('{"error":"Api version not supported in json_preprocess_answers function('+str(api_version)+')"}', mimetype="application/json")


    expected_answers = SurveyMembership.objects.filter(survey=survey).count()
                
    expAns = ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True)
    create_count = 0
    updated_count = 0
    skipped_count = 0
    errors = []
    force_reprocess = False
    if "force_reprocess" in request.GET:
        force_reprocess = request.GET["force_reprocess"]

    for a in expAns:
        p_a = None
        try:
            p_a = ExperimentAnswerProcessed.objects.get(source_answer=a)
            if not force_reprocess:
                continue
            updated_count += 1
        except MultipleObjectsReturned:
            ExperimentAnswerProcessed.objects.filter(source_answer=a).delete()
            p_a = ExperimentAnswerProcessed.objects.create(source_answer=a, experiment=a.experiment, question=a.question, answer=str(a.answer), confidence=a.confidence, user=a.user)
            create_count += 1
        except ExperimentAnswerProcessed.DoesNotExist:
            # create a new
            p_a = ExperimentAnswerProcessed.objects.create(source_answer=a, experiment=a.experiment, question=a.question, answer=str(a.answer), confidence=a.confidence, user=a.user)
            create_count += 1
        
        if len(a.answer) > 0:
            p_a.answer = a.answer
            #validate answer
        
            correct_answer = json.loads(a.question.correct_answer.encode('utf-8'))
            answer = json.loads(p_a.answer.encode('utf-8'))
            if len(answer) > 0:
                for k,v in answer.iteritems():
                    answer[k] = str(v)

                #for k,v in correct_answer.iteritems():
                #    val = str(v)
                #    if val.isdigit():
                #        prev_a = answer[k]
                #        answer[k] = re.sub("[^\d\.]", "", answer[k])
                #        if answer[k] != prev_a:
                #            print("changed ", answer[k], prev_a)
                p_a.answer = json.dumps(answer)

        clicks = 0
        scrolls = 0
        time = 0
        keydown = 0
        cursor_y = []
        window_w = 0
        window_h = 0
        mouseMoveEvents = []
        initEvents = []
        clickEvents = []
        keydownEvents = []
        scrollEvents = []
        miscEvents = []
        try:
            eventDataURL = a.mouseData
            response = requests.get(eventDataURL, timeout=10.0) # urllib2.urlopen(eventDataURL)
            #jsonEventData = response.text #response.read()
            #response.close()
            if response.status_code != 200:
                print("failded to get the file!!! ", eventDataURL)
            mouseDataJSON = response.json() #json.loads(jsonEventData.encode('utf-8'))
            i = 0
            firstLine = mouseDataJSON[i]
            while (int(firstLine[1]['timeStamp']) == 0):
                i += 1
                firstLine =  mouseDataJSON[i]
            i = -1
            lastLine = mouseDataJSON[i]
            while (int(lastLine[1]['timeStamp']) == 0):
                i -= 1
                lastLine = mouseDataJSON[i]
            start_time = 0
            try:
                time1 = float(firstLine[1]['timeStamp'])
                start_time = time1
                time2 = float(lastLine[1]['timeStamp'])
                time = (time2-time1) / 1000.0
            except Exception as e:
                #error = "json_preprocess_answers: time Error: id: " + str(a.id) + " experiment_id: " +  str(a.experiment.id)
                ##errors.append(error)
                print(e)
                #p_a.delete()
                #/a.experiment.state = 2 #Error
                #a.experiment.save()
                return HttpResponse(mouseDataJSON, mimetype="application/json")
            
            for line in mouseDataJSON:
                if line[0] == "click":
                    clicks += 1
                    xPos = line[1]['pageX']
                    yPos = line[1]['pageY']
                    clickEvents.append({'time':line[1]['timeStamp']-start_time, 'x':xPos, 'y':yPos, 'type':"click", 'e':line[1], 'extra': line[2]})
                    miscEvents.append({'time':line[1]['timeStamp']-start_time, 'x':xPos, 'y':yPos, 'type':"click", 'e':line[1], 'extra': line[2]})
                elif line[0] == "scroll":
                    scrolls += 1
                    dx = line[2]['scrollOffset']['pageXOffset']
                    dy = line[2]['scrollOffset']['pageYOffset']
                    scrollEvents.append({'time':line[1]['timeStamp']-start_time, 'dx':dx, 'dy':dy, 'type':"scroll", 'e':line[1], 'extra': line[2]})
                    miscEvents.append({'time':line[1]['timeStamp']-start_time, 'dx':dx, 'dy':dy, 'type':"scroll", 'e':line[1], 'extra': line[2]})
                elif line[0] == "keydown":
                    keydown += 1
                    keydownEvents.append({'time':line[1]['timeStamp']-start_time, 'key':line[1]['which'], 'type':"keydown", 'e':line[1], 'extra': line[2]})
                    miscEvents.append({'time':line[1]['timeStamp']-start_time, 'key':line[1]['which'], 'type':"keydown", 'e':line[1], 'extra': line[2]})
                elif line[0] == "mousemove":
                    cursor_y.append(float(line[1]['pageY']))
                    mouseMoveEvents.append({'time':line[1]['timeStamp']-start_time, 'x':line[1]['pageX'], 'y':line[1]['pageY'], 'type':"mousemove", 'e':line[1], 'extra': line[2]})
                    miscEvents.append({'time':line[1]['timeStamp']-start_time, 'x':line[1]['pageX'], 'y':line[1]['pageY'], 'type':"mousemove", 'e':line[1], 'extra': line[2]})
                elif line[0] == "init":
                    initEvents.append({'time':line[1]['timeStamp']-start_time, 'type':"init", 'e':line[1], 'extra': line[2]})
                    miscEvents.append({'time':line[1]['timeStamp']-start_time, 'type':"init", 'e':line[1], 'extra': line[2]})
                    window_w = line[2]['window']['width']
                    window_h = line[2]['window']['height']
                elif line[0] == "resize":
                    rw = line[2]['window']['width']
                    rh = line[2]['window']['height']
                    miscEvents.append({'time':line[1]['timeStamp']-start_time, 'x':rw, 'y':rh, 'type':"resize", 'e':line[1], 'extra': line[2]}) 
                else:
                    miscEvents.append({'time':line[1]['timeStamp']-start_time, 'type': line[0], 'e':line[1], 'extra': line[2]})

        except Exception as e:
            #error = "json_preprocess_answers:  Error: " + " id: " + str(a.id) + " experiment_id: " +  str(a.experiment.id)
            #errors.append(error)
            print(e)
            continue
        
        if p_a != None:
            p_a.init_event = b64encode(zlib.compress(json.dumps(initEvents), 9)) 
            p_a.mouse_move_event =  b64encode(zlib.compress(json.dumps(mouseMoveEvents), 9))
            p_a.mouse_click_event =  b64encode(zlib.compress(json.dumps(clickEvents), 9))
            p_a.keydown_event =  b64encode(zlib.compress(json.dumps(keydownEvents), 9))
            p_a.scroll_event =  b64encode(zlib.compress(json.dumps(scrollEvents), 9))
            p_a.misc_event =  b64encode(zlib.compress(json.dumps( miscEvents ), 9))
            
            # analitic data
            p_a.window_h = window_h
            p_a.window_w = window_w
            p_a.time = time
            p_a.clicks_count = clicks
            p_a.keys_count = keydown
            p_a.scroll_count = scrolls
            p_a.cursor_y =  json.dumps( cursor_y )
            
            p_a.save()
            print("saving ", p_a.id)
    return HttpResponse('{"created":'+str(create_count)+',"updated":'+str(updated_count)+',"skipped":'+str(skipped_count)+'}', mimetype="application/json")



@staff_member_required
def json_export_answers(request, survey_id):
    export_survey_all(survey_id)
    return HttpResponse('{"done":"done"}', mimetype="application/json")
    #export_survey_all(survey_id)
    #return HttpResponse('{"status":"done"}', mimetype="application/json")
    #return createItemHoverHistograms(request, survey_id);
    #return json_preprocess_answers_140(request, survey_id)


@staff_member_required
def json_preprocess_answers(request, survey_id):
    #export_survey_all(survey_id)
    #return HttpResponse('{"done":"done"}', mimetype="application/json")
    #export_survey_all(survey_id)
    #return HttpResponse('{"status":"done"}', mimetype="application/json")
    #return createItemHoverHistograms(request, survey_id);
    return json_preprocess_answers_140(request, survey_id)


@staff_member_required
def custom_viz(request):
    #composite = request.GET["composite"]
    return render_to_response('custom_viz.html', {}, context_instance=RequestContext(request))

@staff_member_required
def viz_debug(request):
    return render_to_response('viz_debug.html',{}, context_instance=RequestContext(request))

@staff_member_required
def survey_admin(request):
    surveys = Survey.objects.all()
    return render(request, 'survey_admin_v2.html', {'surveys':surveys}) # context_instance=RequestContext(request))

@staff_member_required
def survey_analysis(request):
    surveys = Survey.objects.all()
    return render(request, 'survey_analysis.html', {'surveys':surveys}) # context_instance=RequestContext(request))

@desktop_only
def debug_question(request, question_id):
    if "condition" in request.GET:
        condition = request.GET["condition"]
    else:
        condition = 0
    question = get_object_or_404(Question, id=question_id)
    debug = 1
    qnum = 1
    memberships = SurveyMembership.objects.filter(question=question)
    print(memberships[0])
    qnum = memberships[0].order
    
    
    return render(request, question.base_template, {'question_template': question.template, 'question': question.data, 'condition':condition, 'qnum':qnum,'qtotal':1, 'debug':debug})

@staff_member_required
def debug_question2(request):
    template = request.GET["template"]
    data = request.GET["data"]
    return render(request, 'question.html', {'question_template': "questions/"+template, 'question': data, 'qnum':1,'qtotal':1, 'debug':0})

@staff_member_required
def json_all_questions(request, survey_id):
    survey = get_object_or_404(Survey, id=survey_id)
    questions = []
    for mb in survey.surveymembership_set.all().order_by('order'):
        questions.append(mb.question)
    json_questions = serializers.serialize("json", questions)
    return HttpResponse(json_questions, mimetype="application/json")

def getPrevMove(j, mouseLines):
    p = j-1;
    while(p >= 0):
        line = mouseLines[p]
        pline = processLine(line)
        if pline['action'] == "mousemove" or pline['action'] == "click":
           return p
        p -= 1
    return j

def getPrevMoveJSON(j, mouseDataJSON):
    p = j-1;
    while(p >= 0):
        line = mouseDataJSON[p]
        if line[0] == "mousemove" or line[0] == "click":
           return p
        p -= 1
    return j

@staff_member_required
def json_experiment(request, survey_id, user_id):
    experiments = Experiment.objects.filter(user__id=user_id, survey__id=survey_id)
    experiment =experiments[0]
    expData = {}
    expData['id'] = experiment.user.worker_id
    expData['remote_address'] = experiment.remote_address
    expData['finished'] = experiment.finished
    expData['state'] = experiment.state
    expData['http_user_agent'] = experiment.http_user_agent
    json_experiment = json.dumps( expData ) 
    #print(json_answers)
    return HttpResponse(json_experiment, mimetype="application/json")

@staff_member_required
def update_experiment_state(request, survey_id, user_id, state):
    experiment = get_object_or_404(Experiment, user__id=user_id, survey__id=survey_id)
    experiment.state = state
    experiment.save()
    return HttpResponse('{"status":"done"}', mimetype="application/json")


@staff_member_required
def json_answers(request, survey_id, question_id):
    survey = get_object_or_404(Survey, id=survey_id)
    
    expAns = ExperimentAnswerProcessed.objects.filter(experiment__survey=survey, experiment__state__in=[0, 3], question__id = question_id)
    answers = { 'data': []}
    
    ids = []
    for a in expAns:
        confidenceClick = 0
        mouseClickDataRaw = a.mouse_click_event
        try:
            clickEventData = mouseClickDataRaw #zlib.decompress(b64decode(mouseClickDataRaw))
            clickEventDataJSON = json.loads(clickEventData.encode('utf-8'))
            for line in clickEventDataJSON:
                if 'e' in line and 'target' in line['e'] and 'id' in line['e']['target'] and "confidence" in line['e']['target']['id']:
                    confidenceClick += 1
        except Exception as e:
            print("failed to decompress")
                    
        condition = a.experiment.survey_condition
        correct_answer = a.question.correct_answer
        cursor_y = a.cursor_y
        v = {'version':2,'id':a.id, 'experiment_id': a.experiment.id, 'state': a.experiment.state, 'condition': condition,
             'answer':a.answer, 'correct_answer': correct_answer, 'confidence':a.confidence,'user':a.user.id,
             'time': float(a.time), 'clicks':a.clicks_count, 'scrolls':a.scroll_count, 'confidenceClick':confidenceClick, 'keydown': a.keys_count, 'window_h':a.window_h, 'window_w':a.window_w,  'cursor_y': cursor_y}
        ids.append(a.experiment.id)
        answers['data'].append(v)
    json_answers = json.dumps( answers ) #serializers.serialize("json", answers)
    return HttpResponse(json_answers, mimetype="application/json")

@staff_member_required
def json_analysis(request, survey_id, question_id):
    survey = get_object_or_404(Survey, id=survey_id)
    expAns = ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True, question__id = question_id)
    answers = {'stats': {}, 'data': [] }
    condition_count = 5
    condition_data = []
    for i in range(condition_count):
        condition_data.append({})
    
    for a in expAns:
        condition = a.experiment.survey_condition
        
        if "{" in a.answer and a.question.correct_answer and "{" in a.question.correct_answer:
            answer = json.loads(a.answer.encode('utf-8'))
            correct_answer = json.loads(a.question.correct_answer.encode('utf-8'))
            for k,v in answer.iteritems():
                if (k) not in condition_data[condition]:
                    condition_data[condition][k] = {'bias':[], 'error':[], 'counts':{}}
                v_f = float(v)
                correct_v_f = float(correct_answer[k])
                if v_f > 0:
                    bias = math.log10(v_f/correct_v_f)
                    error = math.fabs(bias)
                else:
                    bias = -1
                    error = 1
                if v not in condition_data[condition][k]['counts']:
                    condition_data[condition][k]['counts'][v] = 1
                else:
                    condition_data[condition][k]['counts'][v] += 1
                    
                condition_data[condition][k]['bias'].append(bias)
                condition_data[condition][k]['error'].append(error)
        elif "of" in a.answer and a.question.correct_answer and "of" in a.question.correct_answer:
            numbers = a.answer.split(' of ', 2)
            correct_numbers = a.question.correct_answer.split(' of ', 2)
            correct_p = float(correct_numbers[0])/ float(correct_numbers[1])
            correct_n = float(correct_numbers[0])
            correct_d = float(correct_numbers[1])
            p = float(numbers[0])/ float(numbers[1])
            n = float(numbers[0])
            d = float(numbers[1])
            #print(p)
            if p > 0:
                bias = math.log10(p/correct_p)
                error = math.fabs(bias)
            else:
                bias = -1
                error = 1
            if n > 0:
                bias_n = math.log10(n/correct_n)
                error_n = math.fabs(bias_n)
            else:
                bias_n = -1
                error_n = 1
            
            if d > 0:
                bias_d = math.log10(d/correct_d)
                error_d = math.fabs(bias_d)
            else:
                bias_d = -1
                error_d = 1
                
            
            if 'p' not in condition_data[condition]:
                condition_data[condition]['p'] = {'bias':[], 'error':[]}
            
            if 'n' not in condition_data[condition]:
                condition_data[condition]['n'] = {'bias':[], 'error':[]}
            if 'd' not in condition_data[condition]:
                condition_data[condition]['d'] = {'bias':[], 'error':[]}
            
                
            condition_data[condition]['p']['bias'].append(bias)
            condition_data[condition]['p']['error'].append(error)
            condition_data[condition]['n']['bias'].append(bias_n)
            condition_data[condition]['n']['error'].append(error_n)
            condition_data[condition]['d']['bias'].append(bias_d)
            condition_data[condition]['d']['error'].append(error_d)
        
    
    json_data = json.dumps( condition_data ) #serializers.serialize("json", answers)
    #json_data = json_data.replace("NaN", "0")

   
    print(json_data)
    return HttpResponse(json_data, mimetype="application/json")

@staff_member_required
def json_answers22(request, survey_id, question_id):
    survey = get_object_or_404(Survey, id=survey_id)
    # 1 and 2 are invalid status
    experiments = Experiment.objects.filter(survey=survey, finished=True).exclude(state__in=[1, 2])
    #expAns = ExperimentAnswerProcessed.objects.filter(experiment__survey=survey, question__id = question_id).exclude(experiment__state=2).exclude(experiment__state=1)
    answers = { 'data': []}
    
    #max_questions = 200
    #q0 = 0
    #q1 = 1
    for exp in experiments:
        expAns = ExperimentAnswerProcessed.objects.filter(experiment=exp)
        hasAnswer = True
        condition = exp.survey_condition
        exp_answers = []
        c_answers = []
        confidence = []
        times =[]
        clicks = []
        scrolls = []
        keys = []
        window_h = []
        window_w = []
        q_order = 0
        cursor_y = []
        expAns_id = -1
        if int(exp.id) == 1198:
            print("No Anserer is bad", exp.id)
            exp.state = 2
            exp.save()
            continue
        for a in expAns:
            #if int(exp.id) == 1198 or int(exp.user.id) == 1159:
            #    print("No Anser", a.answer)
            if not a.answer or  a.answer == None or  bool(a.answer) == False or a.answer == "null" or a.answer == "NULL":
                print("No Anser", a.answer)
                hasAnswer = False
                exp.state = 2
                exp.save()
            exp_answers.append(a.answer)
            c_answers.append(a.question.correct_answer)
            confidence.append(a.confidence)
            times.append(float(a.time))
            clicks.append(a.clicks_count)
            scrolls.append(a.scroll_count)
            keys.append(a.keys_count)
            window_h.append(a.window_h)
            window_w.append(a.window_w)
            #print(exp.id, int(a.question.id), int(question_id))
            if int(a.question.id) == int(question_id):
                expAns_id = a.id
                cursor_y = a.cursor_y
                suveyMembership = SurveyMembership.objects.get(survey=survey, question=a.question)
                q_order = suveyMembership.order
        if expAns_id == -1:
            exp.state = 1
            exp.save()
        if hasAnswer and expAns_id > -1:
            #print(expAns_id)
            v = {'version':2,'id':expAns_id, 'experiment_id': exp.id, 'state': exp.state, 'condition': condition,
                 'answer':exp_answers, 'correct_answer':c_answers, 'confidence':confidence,'user':exp.user.id, 'time': times,
                 'clicks':clicks, 'scrolls':scrolls, 'keydown': keys, 'window_h':window_h, 'window_w':window_w, 'cursor_y': cursor_y, 'q_order':q_order}
            answers['data'].append(v)
    json_answers = json.dumps( answers ) #serializers.serialize("json", answers)
    #json_answers = json_answers.replace("NaN", "0")
    return HttpResponse(json_answers, mimetype="application/json")
@staff_member_required
def json_answers_old(request, survey_id, question_id):
    survey = get_object_or_404(Survey, id=survey_id)
    
    
    expAns = ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True, experiment__state=0, question__id = question_id)
    answers = {'stats': {}, 'data': [], 'screendata': {'counts':{}, 'stats':{'meanW':0.0, 'meanH':0.0,'stdW':0.0, 'stdH':0.0}} }
    condition_count = 5
    condition_data = []
    screensListW = []
    screensListH = []
    global_count = {}
    global_stats = []
    
    for i in range(condition_count):
        condition_data.append({'times': [], 'clickList':[], 'data':{}})
    for a in expAns:
        clickPts = []
        movePts = []
        keyPts = []
        mouseData = ""
        version = 2
        condition = a.experiment.survey_condition
        clicks = 0
        scrolls = 0
        time = 0
        keydown = 0
        try:
            
            mouseData = a.mouseData
            if mouseData[0] == "[":
                version = 2
            else:
                version = 1
            if version == 2:
                mouseDataJSON = json.loads(mouseData.encode('utf-8'))
                # Count Clicks
                clicks = 0
                scrolls = 0
                keydown = 0
                for line in mouseDataJSON:
                    if line[0] == "click":
                        clicks += 1
                    if line[0] == "scroll":
                        scrolls += 1
                    if line[0] == "keydown":
                        keydown += 1
            i = 0
            firstLine = mouseDataJSON[i]
            i = -1
            lastLine = mouseDataJSON[i]
            start_time = 0
            try:
                time1 = float(firstLine[1]['timeStamp'])
                start_time = time1
                time2 = float(lastLine[1]['timeStamp'])
                #print(time1, time2)
                time = (time2-time1) / 1000.0
            except Exception as e:
                print("json_answers: Error2: ", e, a.id, a.experiment.id)
                #a.experiment.state = 1
                #a.experiment.save()
                time = 0
        except Exception as e:
            print("json_answers: Error: ", e, a.id, a.experiment.id)
            #make experiment invalid
            #a.experiment.state = 1
            #a.experiment.save()
            clicks = 0
            scrolls = 0
            time = 0
            keydown = 0
        v = {'version':version,'id':a.id, 'experiment_id': a.experiment.id, 'state': a.experiment.state, 'condition': condition, 'answer':a.answer, 'correct_answer':a.question.correct_answer, 'confidence':a.confidence,'user':a.user.id, 'time':time, 'clicks':clicks, 'scrolls':scrolls, 'keydown': keydown, 'clickPts': clickPts, 'keyPts': keyPts, 'movePts': movePts, 'mouseData':mouseData}
        #print(keyPts)
        #print(clickPts)
        answers['data'].append(v)
    
    json_answers = json.dumps( answers ) #serializers.serialize("json", answers)
    json_answers = json_answers.replace("NaN", "0")
    #print(json_answers)
    return HttpResponse(json_answers, mimetype="application/json")

def process_mouse_paths_v0(request, answer_id):
    expAns = get_object_or_404(ExperimentAnswer, id=answer_id)
    survey = expAns.experiment.survey
    current_question = expAns.question
    mouseData = expAns.mouseData
    mouseLines = mouseData.splitlines()
    mouseMoves = "["
    mouseClicks = "["
    scrolls = "["
    line_i = 0
    last_mouse = [0,0]
    next_mouse = [0,0]
    w = 0
    h = 0
    while line_i < len(mouseLines):
        line = mouseLines[line_i]
        pline = processLine(line)
        vals = line.split('\t')
        if pline['action'] == "ready":
            w = pline['x']
            h = pline['y']
            line_i += 1
        if pline['action'] == "resize":
            rw = pline['x']
            rh = pline['y']
            mouseMoves += "{\"time\":\"" + vals[0] + "\",\"x\":" + rw + ", \"y\":" + rh + ", \"type\":\"resize\"},"
            line_i += 1
            print("resize", w, h)
        if vals[1] == "mousemove":
            mouseMoves += "{\"time\":\"" + vals[0] + "\",\"x\":" + vals[2] + ", \"y\":" + vals[3] + ", \"type\":\"mousemove\"},"
            line_i += 1
        elif vals[1] == "click":
            mouseMoves += "{\"time\":\"" + vals[0] + "\",\"x\":" + vals[2] + ", \"y\":" + vals[3] + ", \"type\":\"click\"},"
            mouseClicks += "{\"time\":\"" + vals[0] + "\",\"x\":" + vals[2] + ", \"y\":" + vals[3] + "},"
            line_i += 1
        elif vals[1] == "keydown":
            mouseMoves += "{\"time\":\"" + vals[0] + "\",\"key\":" + vals[2] + ", \"type\":\"keydown\"},"
            print("keydown: ", vals[2])
            line_i += 1
        elif vals[1] == "scroll":
            dx = 0
            dy = 0
            scroll_count = 1
            line_j = line_i+1
            if (line_j < len(mouseLines)):
                line_next = mouseLines[line_j]
                pline_next = processLine(line_next)
                while (line_j < len(mouseLines)) and pline_next['action'] == "scroll":
                    scroll_count += 1
                    line_j += 1
                    line_next = mouseLines[line_j]
                    pline_next = processLine(line_next)
                if 'x' in pline_next and pline_next['x'] != "undefined":
                    next_mouse=[float(pline_next['x']), float(pline_next['y'])]
            dx = (next_mouse[0] - last_mouse[0])/scroll_count
            dy = (next_mouse[1] - last_mouse[1])/scroll_count
            
            for i in range(0,scroll_count):
                #scroll_x.append(dx)
                #scroll_y.append(dy)
                line_next = mouseLines[line_i+i]
                pline_next = processLine(line_next)
                scrolls += "{\"time\":\"" + pline_next['time'] + "\",\"dx\":" + str(dx) + ", \"dy\":" + str(dy) + "},"
                mouseMoves += "{\"time\":\"" + pline_next['time']  + "\",\"dx\":" + str(dx) + ", \"dy\":" + str(dy) + ", \"type\":\"scroll\"},"
            line_i += scroll_count
        else:
            line_i += 1

        if 'x' in pline and pline['x'] != "undefined":
            last_mouse=[float(pline['x']), float(pline['y'])]
                    
    mouseMoves += "]"
    mouseClicks += "]"
    scrolls += "]"
    #print(scrolls)
    return expAns, survey, current_question,  mouseMoves, mouseClicks, scrolls, w, h

def process_mouse_paths_v1(request, answer_id):
    expAns = get_object_or_404(ExperimentAnswer, id=answer_id)
    mouseDataRaw = expAns.mouseData
    
    if mouseDataRaw[0] == "[":
        version = 2
    else:
        version = 1
    
    if version == 1:
        return version, process_mouse_paths_v0(request, answer_id)
    else:
        mouseData = json.loads(mouseDataRaw.encode('utf-8'))
        
        survey = expAns.experiment.survey
        current_question = expAns.question
    
        mouseMoves = []
        mouseClicks = []
        scrolls = []
        line_i = 0
        w = 0
        h = 0
        
        for line in mouseData:
            #if line_i < 5:
                #print("line ", line[0])
                #line_i += 1
            if line[0] == "init":
                mouseMoves.append({'time':line[1]['timeStamp'], 'type':"init", 'e':line[1], 'extra': line[2]})
                print("init", line[2]['window'])
                w = line[2]['window']['width']
                h = line[2]['window']['height']
                
            elif line[0] == "resize":
                rw = line[2]['window']['width']
                rh = line[2]['window']['height']
                mouseMoves.append({'time':line[1]['timeStamp'], 'x':rw, 'y':rh, 'type':"resize", 'e':line[1], 'extra': line[2]}) #"{\"time\":\"" + vals[0] + "\",\"x\":" + rw + ", \"y\":" + rh + ", \"type\":\"resize\"},"
                
                #print("resize", w, h)
            
            elif line[0] == "mousemove":
                mouseMoves.append({'time':line[1]['timeStamp'], 'x':line[1]['pageX'], 'y':line[1]['pageY'], 'type':"mousemove", 'e':line[1], 'extra': line[2]})
                
            elif line[0] == "click":
                xPos = line[1]['pageX']
                yPos = line[1]['pageY']
                mouseMoves.append({'time':line[1]['timeStamp'], 'x':xPos, 'y':yPos, 'type':"click", 'e':line[1], 'extra': line[2]})
                mouseClicks.append({'time':line[1]['timeStamp'], 'x':xPos, 'y':yPos, 'type':"click"})
               
            elif line[0] == "keydown":
                mouseMoves.append({'time':line[1]['timeStamp'], 'key':line[1]['which'], 'type':"keydown", 'e':line[1], 'extra': line[2]})
                #print("keydown: ", vals[2])
                
            elif line[0] == "scroll":
                dx = line[2]['scrollOffset']['pageXOffset']
                dy = line[2]['scrollOffset']['pageYOffset']
                mouseMoves.append({'time':line[1]['timeStamp'], 'dx':dx, 'dy':dy, 'type':"scroll", 'e':line[1], 'extra': line[2]})
                scrolls.append({'time':line[1]['timeStamp'], 'x':dx, 'y':dy, 'type':"scroll", 'e':line[1], 'extra': line[2]})
            else:
                mouseMoves.append({'time':line[1]['timeStamp'], 'type': line[0], 'e':line[1], 'extra': line[2]})
                
        mouseMovesJSON = json.dumps(mouseMoves)
        mouseClicksJSON = json.dumps(mouseClicks)
        scrollsJSON = json.dumps(scrolls)
        return version, expAns, survey, current_question,  mouseMovesJSON, mouseClicksJSON, scrollsJSON, w, h

def process_mouse_paths(request, answer_id):
    expAns = get_object_or_404(ExperimentAnswerProcessed, id=answer_id)
    version = expAns.experiment.version
    mouseDataRaw = expAns.misc_event
    eventData = zlib.decompress(b64decode(mouseDataRaw))
    #mouseClicks = zlib.decompress(b64decode(expAns.mouse_click_event))
    #scrolls = zlib.decompress(b64decode(expAns.scroll_event))
    elements = zlib.decompress(b64decode(expAns.elements))
    survey = expAns.experiment.survey
    current_question = expAns.question

    return version, expAns, survey, current_question,  eventData, elements, "", "", int(expAns.window_w), int(expAns.window_h)


@staff_member_required
def static_mouse_paths(request, answer_id):
    expAns, survey, current_question,  mouseMoves, elements, mouseClicks, scrolls, w, h = process_mouse_paths(request, answer_id)
    return render_to_response('mouse_paths.html', {'show_numbers':True,
                                                   'survey':survey,
                                                   'question':current_question.data,
                                                   'condition': expAns.experiment.survey_condition,
                                                   'question_template': current_question.template,
                                                   'mouseMoves':mouseMoves,
                                                   'elements':elements,
                                                   'mouseClicks':mouseClicks,
                                                   'scrolls':scrolls}, context_instance=RequestContext(request))

@staff_member_required
def animated_mouse_paths(request, answer_id):
    version, expAns, survey, current_question, mouseMoves, elements, mouseClicks, scrolls, w, h = process_mouse_paths(request, answer_id)
    #if version == 1:
    #    template = 'mouse_paths_animated.html'
    #else:
    template = 'mouse_paths_animated_v4.html'
    
    return render_to_response(template, {'show_numbers':True,
                                                            'survey':survey,
                                                            'question':current_question,
                                                            'condition': expAns.experiment.survey_condition,
                                                            'question_template': current_question.template,
                                                            'mouseMoves':mouseMoves,
                                                            'version': 1.4,
                                                            'mouseClicks':mouseClicks,
                                                            'elements':elements,
                                                            'window_w':w,
                                                            'window_h':h,
                                                            'scrolls':scrolls}, context_instance=RequestContext(request))

def process_comp_mouse_paths(request, survey_id, question_id, condition):
    survey = get_object_or_404(Survey, id=survey_id)
    current_question = get_object_or_404(Question, id=question_id)
  
    expAnswers = ExperimentAnswer.objects.filter(question=current_question,experiment__survey=survey, experiment__survey_condition=condition, experiment__finished=True)
    mouseMoves = "["
    mouseClicks = "["
    
    for expAns in expAnswers:
        mouseMoves += "["
        mouseData = expAns.mouseData
        mouseLines = mouseData.splitlines()
        for line in mouseLines:
            vals = line.split('\t');
            if vals[1] == "mousemove":
                mouseMoves += "{\"time\":\"" + vals[0] + "\",\"x\":" + vals[2] + ", \"y\":" + vals[3] + ", \"type\":\"mousemove\"},"
            elif vals[1] == "click":
                mouseMoves += "{\"time\":\"" + vals[0] + "\",\"x\":" + vals[2] + ", \"y\":" + vals[3] + ", \"type\":\"click\"},"
                mouseClicks += "{\"time\":\"" + vals[0] + "\",\"x\":" + vals[2] + ", \"y\":" + vals[3] + "},"

        mouseMoves += "],"
    mouseMoves += "]"
    mouseClicks += "]"
    return survey, current_question, mouseMoves, mouseClicks

def process_comp_mouse_paths2(request, survey_id, question_id, condition):
    survey = get_object_or_404(Survey, id=survey_id)
    current_question = get_object_or_404(Question, id=question_id)

    expAnswers = ExperimentAnswer.objects.filter(question=current_question,experiment__survey=survey, experiment__survey_condition=condition, experiment__finished=True)
    mouseMoves = "["
    mouseClicks = "["
    
    for expAns in expAnswers:
        mouseData = expAns.mouseData
        mouseLines = mouseData.splitlines()
        for line in mouseLines:
            vals = line.split('\t');
            if vals[1] == "mousemove":
                mouseMoves += "{\"time\":\"" + vals[0] + "\",\"x\":" + vals[2] + ", \"y\":" + vals[3] + ", \"type\":\"mousemove\"},"
            elif vals[1] == "click":
                mouseMoves += "{\"time\":\"" + vals[0] + "\",\"x\":" + vals[2] + ", \"y\":" + vals[3] + ", \"type\":\"click\"},"
                mouseClicks += "{\"time\":\"" + vals[0] + "\",\"x\":" + vals[2] + ", \"y\":" + vals[3] + "},"

    mouseMoves += "]"
    mouseClicks += "]"
    return survey, current_question, mouseMoves, mouseClicks

@staff_member_required
def comp_mouse_paths (request, survey_id, question_id, condition):
    survey, current_question, mouseMoves, mouseClicks = process_comp_mouse_paths2(request, survey_id, question_id, condition)
    return render_to_response('mouse_paths.html', {'show_numbers':False,
                                                   'survey':survey,
                                                   'question':current_question.data,
                                                   'condition': condition,
                                                   'question_template': current_question.template,
                                                   'mouseMoves':mouseMoves,
                                                   'mouseClicks':mouseClicks}, context_instance=RequestContext(request))

@staff_member_required
def comp_animated_mouse_paths (request, survey_id, question_id, condition):
    survey, current_question, mouseMoves, mouseClicks = process_comp_mouse_paths(request, survey_id, question_id, condition)
    return render_to_response('comp_mouse_paths_animated.html', {'show_numbers':False,
                                                                 'survey':survey,
                                                                 'question':current_question.data,
                                                                 'condition': condition,
                                                                 'question_template': current_question.template,
                                                                 'mouseMoves':mouseMoves,
                                                                 'mouseClicks':mouseClicks}, context_instance=RequestContext(request))

@staff_member_required
def comp_heatmap (request, survey_id, question_id, condition, ids):
    survey = get_object_or_404(Survey, id=survey_id)
    current_question = get_object_or_404(Question, id=question_id)
    ids = ids[:-1]
    idList = ids.split(",")
    print(idList)


    expAnswers = ExperimentAnswerProcessed.objects.filter(pk__in=idList)#question=current_question,experiment__survey=survey, experiment__finished=True) #experiment__survey_condition=condition

    mouseMoves = []
    for expAns in expAnswers:
        mouseMoveDataRaw = expAns.mouse_move_event
        mouseClickDataRaw = expAns.mouse_click_event
        
        mouseMovesJSON = zlib.decompress(b64decode(mouseMoveDataRaw)) #mouseMoveDataRaw
        mouseData = json.loads(mouseMovesJSON.encode('utf-8'))
        for m in mouseData:
            mouseMoves.append({'x': m['x'], 'y':m['y']})
    
    mouseMovesJSONcomp = json.dumps( mouseMoves ) 
    return render_to_response('heatmap.html', {'survey':survey,
                                               'question':current_question,
                                               'condition': condition,
                                               'question_template': current_question.template,
                                               'mouseMoves':mouseMovesJSONcomp,
                                               'mouseClicks':""}, context_instance=RequestContext(request))
    
  

@staff_member_required
def heatmap(request, answer_id):
    expAns = get_object_or_404(ExperimentAnswerProcessed, id=answer_id)
    survey = expAns.experiment.survey
    current_question = expAns.question
    condition = expAns.experiment.survey_condition
    
    mouseMoveDataRaw = expAns.mouse_move_event
    mouseClickDataRaw = expAns.mouse_click_event
    
    mouseMovesJSON = mouseMoveDataRaw #zlib.decompress(b64decode(mouseMoveDataRaw)) #mouseMoveDataRaw
    mouseClicksJSON = mouseClickDataRaw #zlib.decompress(b64decode(mouseClickDataRaw)) #mouseClickDataRaw
    
    return render_to_response('heatmap.html', {'survey':survey,
                                               'question':current_question,
                                               'condition': condition,
                                               'question_template': current_question.template,
                                               'mouseMoves':mouseMovesJSON,
                                               'mouseClicks':mouseClicksJSON}, context_instance=RequestContext(request))

@staff_member_required
def comp_expmap(request, survey_id, question_id):
    experiment = Experiment.objects.filter(survey__id = survey_id, finished=True, state=0)
    ips = "["
    for exp in experiment:
        ipr = exp.remote_address
        ipPattern = re.compile('\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}')
        ip = re.findall( ipPattern, ipr )
        if len(ip) > 0:
            ips += "\"" + ip[0] + "\","
    ips += "]"
    return render_to_response('ip_map.html', {'ips':ips}, context_instance=RequestContext(request))
    
@staff_member_required
def expmap(request, experiment_id):
    experiment = get_object_or_404(Experiment, id=experiment_id)
    ips = "["
    ipr = experiment.remote_address
    ipPattern = re.compile('\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}')
    ip = re.findall( ipPattern, ipr )
    if len(ip) > 0:
        ips += "\"" + ip[0] + "\","
    ips += "]"
    return render_to_response('ip_map.html', {'ips':ips}, context_instance=RequestContext(request))


@staff_member_required
def createItemHoverHistograms(request, survey_id):
    #survey = get_object_or_404(Survey, id=survey_id)
    expAns = ExperimentAnswerProcessed.objects.filter(question_id=19, experiment__finished=True) #experiment__survey=survey, experiment__finished=True,
    allMoves = {}
    fieldnames = ["user_id", "condition"]
    for a in expAns:
        allMoves[a.user.id] = {"user_id":a.user.id, "condition": a.experiment.survey_condition}
        #print("got",a.id)
        try:
            mouseDataJSON = json.loads(a.mouse_move_event) #json.loads(zlib.decompress(b64decode(a.mouse_move_event)))
            for line in mouseDataJSON:
                #if "extra" in line:
                #    print("extra", line["extra"])
                if "e" in line and "target" in line["e"] and "id" in line["e"]["target"]:
                    if line["e"]["target"]["id"] not in fieldnames:
                         fieldnames.append(line["e"]["target"]["id"])

                    if line["e"]["target"]["id"] in allMoves[a.user.id]:
                        allMoves[a.user.id][line["e"]["target"]["id"]] = allMoves[a.user.id][line["e"]["target"]["id"]] + 1
                    else:
                        allMoves[a.user.id][line["e"]["target"]["id"]] = 1
                    #print("e", line["e"]["target"]["nodeName"], line["e"]["target"]["id"])
                    
                    #if "screen" in line["extra"]:
                    #    sizeis = {"w":line["extra"]["screen"]["width"], "h":line["extra"]["screen"]["height"]}
                    #    screenSizes.append([line["extra"]["screen"]["width"], line["extra"]["screen"]["height"]])
                    #    #writer.writerow([line["extra"]["screen"]["width"], line["extra"]["screen"]["height"]])
                    #    #print(sizeis)

        except Exception as e:    
            print("error: failed to decompress", e)
    writer = csv.DictWriter(open("itemHoverData.csv", 'w'), fieldnames=fieldnames, dialect='excel')
    writer.writeheader()
    for key, value in allMoves.iteritems():
        writer.writerow(value)
    
    return HttpResponse('{"status":"done"}', mimetype="application/json")
