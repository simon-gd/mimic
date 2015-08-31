import json
import math
import csv
import pickle
import os.path
import numpy as np
import zlib
import re
import ast
import base64
from base64 import b64decode, b64encode

from itertools import chain

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

#from pymongo import MongoClient
from azure.storage import *

def queryset_iterator(queryset, chunksize=1000):
    '''''
    Iterate over a Django Queryset ordered by the primary key

    This method loads a maximum of chunksize (default: 1000) rows in it's
    memory at the same time while django normally would load all rows in it's
    memory. Using the iterator() method only causes it to not preload all the
    classes.

    Note that the implementation of the iterator does not support ordered query sets.
    '''
    pk = 0
    last_pk = queryset.order_by('-pk')[0].pk
    queryset = queryset.order_by('pk')
    while pk < last_pk:
        for row in queryset.filter(pk__gt=pk)[:chunksize]:
            pk = row.pk
            yield row
        gc.collect()

def maptest(obj):
    k = obj[u'fields']
    k['id'] = obj[u'pk']
    if "experiment" in k:
        k["experiment"] = maptest(k["experiment"])
    if "question" in k:
        k["question"] = maptest(k["question"])
    if "answer" in k:
        try:
            k["answer"] = json.loads(k["answer"])
        except:
            pass
    if "correct_answer" in k:
        k["correct_answer"] = json.loads(k["correct_answer"])
    if "cursor_y" in k and len(k["cursor_y"]) > 0:
        k["cursor_y"] = json.loads(k["cursor_y"])
    return k
#from zipfile_infolist import print_info
import zipfile

def export_survey_all(survey_id):
    saveInteraction = True
    directory = os.path.join(settings.MEDIA_ROOT,"export_json_data")
    if not os.path.exists(directory):
        os.makedirs(directory)
    interaction_directory = os.path.join(directory,"interaction")
    if not os.path.exists(interaction_directory):
        os.makedirs(interaction_directory)

    survey = Survey.objects.filter(id=survey_id)
    surveyMemberships = SurveyMembership.objects.filter(survey=survey[0])
    questions = Question.objects.all()
    questions_json_string = serializers.serialize('json', questions, indent=2)
    questions_data = map(maptest, json.loads(questions_json_string))
    questions_json_string = json.dumps(questions_data, indent=2)

    experiments = Experiment.objects.filter(survey=survey[0], finished=True, state=0)
    experiments_json_string = serializers.serialize('json', experiments, indent=2)
    experiments_data = map(maptest, json.loads(experiments_json_string))
    experiments_json_string = json.dumps(experiments_data, indent=2)

    #experimentAnswers = ExperimentAnswer.objects.filter(experiment__survey = survey[0], experiment__finished=True, experiment__state=0)
    #experimentAnswers_json_string = serializers.serialize('json', experimentAnswers, indent=2,  relations={'user':{'fields':('worker_id')}, 'experiment':{'fields':('survey_condition','remote_address', 'http_user_agent')}, 'question':{'fields':('correct_answer')}})
    #experimentAnswers_data = map(maptest, json.loads(experimentAnswers_json_string))
    #experimentAnswers_json_string = json.dumps(experimentAnswers_data, indent=2)

    #queryset_iterator(ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True), chunksize=500)
    experimentAnswerProcessed = queryset_iterator(ExperimentAnswerProcessed.objects.filter(experiment__survey = survey[0], experiment__finished=True, experiment__state=0), chunksize=20)
    experimentAnswerProcessed_json_string = serializers.serialize('json', experimentAnswerProcessed, indent=2,  
        fields=('source_answer','experiment', 'question', 'answer', 'confidence', 'user', 'processed_at', 'time', 'clicks_count', 'keys_count','scroll_count', 'window_h', 'window_w'), relations={'user':{'fields':('worker_id')}, 'experiment':{'fields':('survey_condition','remote_address', 'http_user_agent')}, 
                                                                                'question':{'fields':('correct_answer')}, 'source_answer':{'fields':('mouseData')}})
    experimentAnswerProcessed_data = map(maptest, json.loads(experimentAnswerProcessed_json_string))
    """
    #if saveInteraction:
        #for eap in experimentAnswerProcessed_data:
        #    i_url = os.path.join("data", "interaction", "experimentAnswersProcessedMousedata_"+str(eap['id'])+".zip")
        #    eap['user_events'] = i_url

        #for eap in experimentAnswerProcessed:
            # compressed data
            #mouseDataURL = eap.source_answer.mouseData
            #eap['user_events'] = i_url

            #print(mouseDataURL)
            #if not eventDataURL.startswith(settings.AZURE_PROTOCOL):
            #    try:
            #        data_file = open(os.path.join(settings.MEDIA_ROOT,eventDataURL), 'r')   
            #        mouseDataJSON = json.load(data_file)
            #    except Exception as e2:
            #        mouseDataJSON = 0
            #else:
            #    response = requests.get(str(eventDataURL), timeout=10.0) # urllib2.urlopen(eventDataURL)
            #    if response.status_code != 200:
            #       mouseDataJSON = 0 #return HttpResponse('{"error":"Failed to get file('+str(eventDataURL)+')"}', mimetype="application/json")
            #   else:
            #        mouseDataJSON = response.json() #json.loads(jsonEventData.encode('utf-8'))
            
            init_eventJSON = eap.init_event
            mouse_move_eventJSON = eap.mouse_move_event
            mouse_click_eventJSON = eap.mouse_click_event
            keydown_eventJSON = eap.keydown_event
            scroll_eventJSON = eap.scroll_event
            misc_eventJSON = eap.misc_event
            if(len(init_eventJSON) > 0):
                mouseData['init_event'] = json.loads(init_eventJSON)
            if(len(mouse_move_eventJSON) > 0):
                mouseData['mouse_move_event'] = json.loads(mouse_move_eventJSON)

            if(len(mouse_click_eventJSON) > 0):
                mouseData['mouse_click_event'] = json.loads(mouse_click_eventJSON)

            if(len(keydown_eventJSON) > 0):
                mouseData['keydown_event'] = json.loads(keydown_eventJSON)

            if(len(scroll_eventJSON) > 0):
                mouseData['scroll_event'] = json.loads(scroll_eventJSON)

            if(len(misc_eventJSON) > 0):
                mouseData['misc_event'] = json.loads(misc_eventJSON)
           
            #i_url = os.path.join(interaction_directory, "experimentAnswersProcessedMousedata_"+str(eap.pk)+".zip")
            #zf = zipfile.ZipFile(i_url, 
            #             mode='w',
            #             compression=zipfile.ZIP_DEFLATED, 
            #             )
            #try:
            #    zf.writestr("experimentAnswersProcessedMousedata_"+str(eap.pk)+".json", json.dumps(mouseDataJSON))
            #finally:
            #    zf.close()
    
        #experimentAnswerProcessed_json_string = json.dumps(experimentAnswerProcessed_data, indent=2)
    """
    experimentAnswerProcessed_json_string = json.dumps(experimentAnswerProcessed_data, indent=2)
    url1 = os.path.join(directory, "surveyData_questions_"+str(survey[0].slug)+".json")
    url2 = os.path.join(directory, "surveyData_experiments_"+str(survey[0].slug)+".json")
    url3 = os.path.join(directory, "surveyData_experimentAnswers_"+str(survey[0].slug)+".json")
    url4 = os.path.join(directory, "surveyData_experimentAnswersProcessed_"+str(survey[0].slug)+".json")

    with open(url1, "w") as out:
        out.write(questions_json_string)
    with open(url2, "w") as out:
        out.write(experiments_json_string)
   # with open(url3, "w") as out:
   #     out.write(experimentAnswers_json_string)
    with open(url4, "w") as out:
        out.write(experimentAnswerProcessed_json_string)

    """
  
        experimentUsers = ExperimentUser.objects.filter(experiment__survey = survey[0], experiment__finished=True,experiment__state__in=[0,1])
        filteredUsers = []
        experimentAnswers = []
        experiments = []
        for u in experimentUsers:
            answeredQuestions = ExperimentAnswer.objects.filter(user__pk=u.pk)
            experimentsQ = Experiment.objects.filter(user__pk=u.pk)
            #print(answeredQuestions, len(questions))
            if(len(answeredQuestions) == len(questions) and len(experimentsQ) == 1):
                for aQ in answeredQuestions:
                    if aQ.experiment != experimentsQ[0].pk:
                        continue

                ids.append(u.pk)
                for aQ in answeredQuestions:
                    experimentAnswers.append(aQ)
                experiments.append(experimentsQ[0])
                filteredUsers.append(u)
            else:
                print(len(answeredQuestions), len(experimentsQ))
        experimentUsers = filteredUsers
        #experiments = Experiment.objects.filter(user__pk__in=ids, survey=survey[0], finished=True, state__in=[0,1])
        #experimentAnswers = ExperimentAnswer.objects.filter(user__pk__in=ids, experiment__survey = survey[0],  experiment__finished=True,experiment__state__in=[0,1])
    print("experimentUsers", len(experimentUsers))
    print("experiments", len(experiments))
    print("experimentAnswers", len(experimentAnswers))

    combined = list(chain(survey, questions, surveyMemberships, experimentUsers, experiments, experimentAnswers))

    json_string = serializers.serialize('json', combined, indent=2, use_natural_keys=False)
    data = json.loads(json_string)

    #for d in data:
    #    del d['pk']

    json_string = json.dumps(data, indent=2)

    directory = os.path.join(settings.MEDIA_ROOT,"export_data")
    if not os.path.exists(directory):
        os.makedirs(directory)
    url = os.path.join(directory, "surveyData_all_"+str(survey[0].slug)+".json")
    with open(url, "w") as out:
        out.write(json_string)
    """

def export_survey(survey_id):
    survey = Survey.objects.filter(id=survey_id)
    surveyMemberships = SurveyMembership.objects.filter(survey=survey[0])
    questions = Question.objects.filter(id__in=[elem.question.id for elem in surveyMemberships])
    
    #experiments = Experiment.objects.filter(survey=survey[0], finished=True, state=0)
    #experimentUsers = ExperimentUser.objects.filter(id__in=[elem.user.id for elem in experiments]) #experiments.user_set.all()
    #experimentAnswers = ExperimentAnswer.objects.filter(experiment__survey = survey[0])
    doFiltering = False
    ids = []
    if doFiltering:
        path = os.path.join(settings.MEDIA_ROOT,"info_viz_2014_3.csv")
        with open(path) as f:
            reader = csv.reader(f)
            next(reader, None)  # skip the headers
            for row in reader:
                ids.append(row[15])
        experimentUsers = ExperimentUser.objects.filter(id__in=ids) #experiments.user_set.all()
        experiments = Experiment.objects.filter(survey=survey[0], user__id__in=ids, finished=True, state=0)
        experimentAnswers = ExperimentAnswer.objects.filter(experiment__survey = survey[0], experiment__user__id__in=ids, experiment__finished=True, experiment__state=0)
    else:
        experimentUsers = ExperimentUser.objects.filter(experiment__survey = survey[0], experiment__finished=True,experiment__state__in=[0,1])
        filteredUsers = []
        experimentAnswers = []
        experiments = []
        for u in experimentUsers:
            answeredQuestions = ExperimentAnswer.objects.filter(user__pk=u.pk)
            experimentsQ = Experiment.objects.filter(user__pk=u.pk)
            #print(answeredQuestions, len(questions))
            if(len(answeredQuestions) == len(questions) and len(experimentsQ) == 1):
                for aQ in answeredQuestions:
                    if aQ.experiment != experimentsQ[0].pk:
                        continue

                ids.append(u.pk)
                for aQ in answeredQuestions:
                    experimentAnswers.append(aQ)
                experiments.append(experimentsQ[0])
                filteredUsers.append(u)
            else:
                print(len(answeredQuestions), len(experimentsQ))
        experimentUsers = filteredUsers
        #experiments = Experiment.objects.filter(user__pk__in=ids, survey=survey[0], finished=True, state__in=[0,1])
        #experimentAnswers = ExperimentAnswer.objects.filter(user__pk__in=ids, experiment__survey = survey[0],  experiment__finished=True,experiment__state__in=[0,1])
    print("experimentUsers", len(experimentUsers))
    print("experiments", len(experiments))
    print("experimentAnswers", len(experimentAnswers))

    combined = list(chain(survey, questions, surveyMemberships, experimentUsers, experiments, experimentAnswers))

    json_string = serializers.serialize('json', combined, indent=2, use_natural_keys=False)
    data = json.loads(json_string)

    #for d in data:
    #    del d['pk']

    json_string = json.dumps(data, indent=2)

    directory = os.path.join(settings.MEDIA_ROOT,"export_data")
    if not os.path.exists(directory):
        os.makedirs(directory)
    url = os.path.join(directory, "surveyData_all_"+str(survey[0].slug)+".json")
    with open(url, "w") as out:
        out.write(json_string)
    

def save_answers_to_azure(request, survey_id):
    survey = get_object_or_404(Survey, id=survey_id)
    container_name = "sraw-"+str(survey.id)
    
    blob_service = BlobService(account_name=settings.AZURE_STORAGE_ACCOUNT, account_key=settings.AZURE_STORAGE_KEY)
    blob_service.create_container(container_name)
    
    #expAns = queryset_iterator(ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True), chunksize=500)
    

    expAns = ExperimentAnswer.objects.filter(experiment__finished=True, experiment__survey=survey).exclude(mouseData__startswith="http")
    experiments = Experiment.objects.filter(survey=survey)
    experimentUsers = ExperimentUser.objects.filter(id__in=[elem.user.id for elem in experiments]) #experiments.user_set.all()
    print("expAns", len(expAns))
    print("experiments", len(experiments))
    print("experimentUsers", len(experimentUsers))
    
    return HttpResponse('{"status":"done"}', mimetype="application/json") 
    
    #users_without_reports = User.objects.filter(user__isnull=True)
    #Experiment.objects.exclude(user_id__in=[elem.pk for elem in ExperimentUser.objects.all()]).delete()
    #for u in expU:
    #    print(u)
    #    #u.delete()
    #return HttpResponse('{"status":"done"}', mimetype="application/json")

    skipped_count = 0

    for a in expAns:
        rawEventData = a.mouseData
        if len(rawEventData) > 0 and not rawEventData.startswith("[") and not rawEventData.startswith("http") and int(survey_id) > 3: 
            try:
                rawEventData =  zlib.decompress(rawEventData.encode('latin1')) 
               
            except Exception as e:
                # try from
                try:
                    old_container_name = "survey-"+str(survey.id)
                    old_blob_name = "ExperimentAnswer-"+str(a.id)+'.json'
                    rawEventData = blob_service.get_blob(old_container_name, old_blob_name)
                except:
                    skipped_count += 1
                    print("error: failed to decompress or load from azure")
                    continue
        blob_name = "ExperimentAnswer-"+str(a.user.worker_id)+"-"+str(a.question.id)+'.json'
        try:
            blob_service.get_blob_metadata(container_name, blob_name)
            url = blob_service.make_blob_url(container_name, blob_name)
            print("updating", url)
            a.mouseData = url
            a.save()
        except:               
            blob_service.put_blob(container_name, blob_name , rawEventData, x_ms_blob_type='BlockBlob')
            url = blob_service.make_blob_url(container_name, blob_name)
            a.mouseData = url
            a.save()
            print(url)
    return HttpResponse('{"status":"done"}', mimetype="application/json")


def json_preprocess_answers_v1(request, survey_id):
    #old style interaction data processing version 2
    survey = get_object_or_404(Survey, id=survey_id)
    expAns = ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True)
    create_count = 0
    updated_count = 0
    errors = []
    force_reprocess = True
    last_mouse=[0,0]
    for a in expAns:
        try:
            p_a = None
            rawEventData = a.mouseData
            try:
                p_a = ExperimentAnswerProcessed.objects.get(source_answer=a)
                updated_count += 1
                if not force_reprocess:
                    continue
            except ExperimentAnswerProcessed.DoesNotExist:
                # create a new
                p_a = ExperimentAnswerProcessed.objects.create(source_answer=a, experiment=a.experiment, question=a.question, answer=str(a.answer), confidence=a.confidence, user=a.user)
                create_count += 1
            
            if " of " in a.answer:
                numbers = a.answer.split(' of ', 2)
                answersO = {}
                answersO['a1'] = numbers[0]
                answersO['a2'] = numbers[1]
                p_a.answer = json.dumps(answersO)
                #print("p_a.answer", p_a.answer)
            else:
                p_a.answer = a.answer
    
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
        
            
            mouseLines = rawEventData.splitlines()
            
            i = 0
            firstLine = mouseLines[i]
            while (int(processLine(firstLine)['time']) == 0):
                i += 1
                firstLine = mouseLines[i]
            i = -1
            lastLine = mouseLines[i]
            while (int(processLine(lastLine)['time']) == 0):
                i -= 1
                lastLine = mouseLines[i]
            start_time = 0
            try:
                time1 = float(processLine(firstLine)['time'])
                start_time = time1
                time2 = float(processLine(lastLine)['time'])
                time = (time2-time1) / 1000.0
                print(time, time1, time2)
            except Exception as e:
                error = "json_preprocess_answers: time Error: id: " + str(a.id) + " experiment_id: " +  str(a.experiment.id)
                errors.append(error)
                print(error, e)
                if p_a:
                    p_a.delete()
                a.experiment.state = 2 #Error
                a.experiment.save()
                continue
            
            line_i = 0
            
            while line_i < len(mouseLines):
                line = mouseLines[line_i]
                pline = processLine(line)
                if pline['action'] == "mousemove":
                    mouseMoveEvents.append({'time': float(pline['time'])-start_time, 'type':"mousemove", 'x': float(pline['x']) , 'y': float(pline['y'])})
                    miscEvents.append({'time': float(pline['time'])-start_time, 'type':"mousemove", 'x': float(pline['x']) , 'y': float(pline['y'])})
                    last_mouse=[float(pline['x']), float(pline['y'])]
                    cursor_y.append(float(pline['y']))
                    line_i += 1
                elif pline['action'] == "click":
                    clicks += 1
                    clickEvents.append({'time': float(pline['time'])-start_time, 'type':"click", 'x': float(pline['x']) , 'y': float(pline['y'])})
                    miscEvents.append({'time': float(pline['time'])-start_time, 'type':"click", 'x': float(pline['x']) , 'y': float(pline['y'])})
                    last_mouse=[float(pline['x']), float(pline['y'])]
                    line_i += 1
                elif pline['action'] == "resize":
                    miscEvents.append({'time': float(pline['time'])-start_time, 'type':"resize",  'x': float(pline['x']) , 'y': float(pline['y'])})
                    line_i += 1
                elif pline['action'] == "keydown":
                    keydown += 1
                    keydownEvents.append({'time': float(pline['time'])-start_time, 'type':"keydown", 'key':pline['key'], 'x': 0 , 'y': 0})
                    miscEvents.append({'time': float(pline['time'])-start_time, 'type':"keydown", 'key':pline['key'], 'x': 0 , 'y': 0})
                    line_i += 1
                elif pline['action'] == "scroll":
                   
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
                        scrollEvents.append({'time':float(pline_next['time']), 'dx':dx, 'dy':dy, 'type':"scroll"})
                        miscEvents.append({'time':float(pline_next['time']), 'dx':dx, 'dy':dy, 'type':"scroll"})
                    
                        #scrolls += "{\"time\":\"" + pline_next['time'] + "\",\"dx\":" + str(dx) + ", \"dy\":" + str(dy) + "},"
                        #mouseMoves += "{\"time\":\"" + pline_next['time']  + "\",\"dx\":" + str(dx) + ", \"dy\":" + str(dy) + ", \"type\":\"scroll\"},"
                    line_i += scroll_count
                    scrolls += scroll_count
                    
                    #scrollEvents.append({'time': float(pline['time'])-start_time, 'dx': dx , 'dy': dy})
                    #miscEvents.append({'time': float(pline['time'])-start_time, 'dx':  dx , 'dy': dy})
                elif pline['action'] == "ready":
                    initEvents.append({'time':float(pline['time']), 'type':"init"})
                    miscEvents.append({'time':float(pline['time']), 'type':"init"})
                    window_w = float(pline['x'])
                    window_h =float(pline['y'])
                    line_i += 1
                else:
                    line_i += 1
                    
                
                if 'x' in pline and pline['x'] != "undefined":
                    last_mouse=[float(pline['x']), float(pline['y'])]

        except Exception as e:
            error = "json_preprocess_answers: time Error: " + " id: " + str(a.id) + " experiment_id: " +  str(a.experiment.id)
            errors.append(error)
            print(error, e)
            if p_a:
                p_a.delete()
            a.experiment.state = 2 #Error
            a.experiment.save()
            continue
        
        if p_a != None:
            
            a.experiment.state = 0
            a.experiment.save()
            
            if time < 1.0:
                error = "json_preprocess_answers: time too small: " + " id: " + str(a.id) + " experiment_id: " +  str(a.experiment.id)
                errors.append(error)
                print(error)
                p_a.delete()
                a.experiment.state = 1 #Invalid
                a.experiment.save()

            # compressed data
            p_a.init_event = zlib.compress(json.dumps( initEvents )).decode('latin1')
            p_a.mouse_move_event = zlib.compress(json.dumps( mouseMoveEvents )).decode('latin1')
            p_a.mouse_click_event = zlib.compress(json.dumps( clickEvents )).decode('latin1')
            p_a.keydown_event = zlib.compress(json.dumps( keydownEvents )).decode('latin1')
            p_a.scroll_event = zlib.compress(json.dumps( scrollEvents )).decode('latin1')
            p_a.misc_event = zlib.compress(json.dumps( miscEvents )).decode('latin1')
            
            # analitic data
            p_a.window_h = window_h
            p_a.window_w = window_w
            p_a.time = time
            p_a.clicks_count = clicks
            p_a.keys_count = keydown
            p_a.scroll_count = scrolls
            p_a.cursor_y =  json.dumps( cursor_y )
            
            p_a.save()
            print(str(create_count+updated_count)+"/"+str(len(expAns)), " saving ", p_a, p_a.id, p_a.source_answer.id, p_a.answer)
    return HttpResponse('{"created":'+str(create_count)+',"updated":'+str(updated_count)+'}', mimetype="application/json")


from django import db
import gc



def get_screen_sizes(request, survey_id):
    survey = get_object_or_404(Survey, id=survey_id)
    expAns = ExperimentAnswerProcessed.objects.filter(question_id=15, experiment__finished=True) #experiment__survey=survey, experiment__finished=True,
    screenSizes = []
    writer = csv.writer(open("screensizes.csv", 'w'), dialect='excel')
    for a in expAns:
        #print("got",a.id)
        try:
            rawEventData =  zlib.decompress(a.misc_event.encode('latin1'))
            mouseDataJSON = json.loads(rawEventData.encode('utf-8'))
            for line in mouseDataJSON:
                if "extra" in line:
                    if "screen" in line["extra"]:
                        sizeis = {"w":line["extra"]["screen"]["width"], "h":line["extra"]["screen"]["height"]}
                        screenSizes.append([line["extra"]["screen"]["width"], line["extra"]["screen"]["height"]])
                        #writer.writerow([line["extra"]["screen"]["width"], line["extra"]["screen"]["height"]])
                        #print(sizeis)

        except Exception as e:    
            print("error: failed to decompress", e)
    writer.writerows(screenSizes)
    
    return HttpResponse(json.dumps(screenSizes), mimetype="application/json")

def json_preprocess_answers_v2(request, survey_id):
    db.reset_queries()
    #newer JSON Interaction Data processing version 2
    survey = get_object_or_404(Survey, id=survey_id)
    #ExperimentAnswerProcessed.objects.filter(experiment__survey=survey).delete()
    #return HttpResponse('{"created":'+str(0)+',"updated":'+str(0)+',"skipped":'+str(0)+'}', mimetype="application/json")
    expected_answers = SurveyMembership.objects.filter(survey=survey).count()
                
    expAns = queryset_iterator(ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True), chunksize=100) #.iterator() # experiment__state=0) experiment__state=0
    create_count = 0
    updated_count = 0
    skipped_count = 0
    errors = []
    force_reprocess = False
    if "force_reprocess" in request.GET:
        force_reprocess = request.GET["force_reprocess"]

    for a in expAns:
        p_a = None
        rawEventData = a.mouseData
        if len(rawEventData) == 0 or a.answer ==  None:
            skipped_count += 1
            print("error: ", len(rawEventData), a.answer)
            #a.experiment.state = 2 #Error
            #a.experiment.save()
            continue

        if rawEventData[0] != "[":
            try:
                rawEventData =  zlib.decompress(a.mouseData.encode('latin1')) 
               
            except Exception as e:
                skipped_count += 1
                print("error: failed to decompress")
                #a.experiment.state = 2 #Error
                #a.experiment.save()
                continue
        #    print("filed to decompress data", a.pk)
            
        

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
            mouseDataJSON = json.loads(rawEventData.encode('utf-8'))
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
                #print(time1, time2)
                time = (time2-time1) / 1000.0
            except Exception as e:
                error = "json_preprocess_answers: time Error: id: " + str(a.id) + " experiment_id: " +  str(a.experiment.id)
                errors.append(error)
                print(error, e)
                p_a.delete()
                a.experiment.state = 2 #Error
                a.experiment.save()
                continue
            
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
                    window_w = line[2]['window']['screenX']
                    window_h = line[2]['window']['screenY']
                elif line[0] == "resize":
                    rw = line[2]['window']['width']
                    rh = line[2]['window']['height']
                    miscEvents.append({'time':line[1]['timeStamp']-start_time, 'x':rw, 'y':rh, 'type':"resize", 'e':line[1], 'extra': line[2]}) 
                else:
                    miscEvents.append({'time':line[1]['timeStamp']-start_time, 'type': line[0], 'e':line[1], 'extra': line[2]})

        except Exception as e:
            error = "json_preprocess_answers: time Error: " + " id: " + str(a.id) + " experiment_id: " +  str(a.experiment.id)
            errors.append(error)
            print(error, e)
            #p_a.delete()
            #a.experiment.state = 2 #Error
            #a.experiment.save()
            continue
        
        if p_a != None:
            #if time < 1.0:
                #error = "json_preprocess_answers: time too small: " + " id: " + str(a.id) + " experiment_id: " +  str(a.experiment.id)
                #errors.append(error)
                #print(error)
                #p_a.delete()
                #a.experiment.state = 1 #Invalid
                #a.experiment.save()
            #if a.experiment.state == 1:
            #    a.experiment.state = 0
            #    a.experiment.save()     
            # compressed data
            p_a.init_event = zlib.compress(json.dumps( initEvents )).decode('latin1')
            p_a.mouse_move_event = zlib.compress(json.dumps( mouseMoveEvents )).decode('latin1')
            p_a.mouse_click_event = zlib.compress(json.dumps( clickEvents )).decode('latin1')
            p_a.keydown_event = zlib.compress(json.dumps( keydownEvents )).decode('latin1')
            p_a.scroll_event = zlib.compress(json.dumps( scrollEvents )).decode('latin1')
            p_a.misc_event = zlib.compress(json.dumps( miscEvents )).decode('latin1')
            
            # analitic data
            p_a.window_h = window_h
            p_a.window_w = window_w
            p_a.time = time
            p_a.clicks_count = clicks
            p_a.keys_count = keydown
            p_a.scroll_count = scrolls
            p_a.cursor_y =  json.dumps( cursor_y )
            
            p_a.save()
            print(str(create_count+updated_count), " saving ", p_a, p_a.id, p_a.source_answer.id)
    # cleanup experiments
    expTest = Experiment.objects.filter(survey=survey, finished=True,state=0)
    experiments_disabled = 0
    for e_test in expTest:
        actual_answers = ExperimentAnswer.objects.filter(experiment=e_test).count()
        if actual_answers != expected_answers:
            #e_test.state = 1
            e_test.save()
            experiments_disabled += 1

    return HttpResponse('{"created":'+str(create_count)+',"updated":'+str(updated_count)+',"skipped":'+str(skipped_count)+',"experiments_disabled":'+str(experiments_disabled)+'}', mimetype="application/json")

def save_csv_scroll(request, survey_id):
    survey = get_object_or_404(Survey, id=survey_id)
    experments = Experiment.objects.filter(survey=survey, finished=True)
    toCSV = []
    keys = []
    baseURL = "http://experiscope.net"
    for exp in experments:
        #print(exp)
        data = {
            'turk_user_id': exp.user,
            'user_id': exp.user.id,
            'condition': VIS_TYPES[exp.survey_condition][1],
            'ip': exp.remote_address,
            'map': baseURL+reverse('expmap', args=[exp.id])
        }
        if 'user_id' not in keys:
            keys.append('turk_user_id')
            keys.append('user_id')
            keys.append('condition')
            keys.append('ip')
            keys.append('map')
            keys.append('window_w')
            keys.append('window_h')
            keys.append('scroll_count')
            keys.append('scroll_count_up')
            keys.append('scroll_count_down')
            keys.append('scroll_y_amount')
            keys.append('scroll_y_amount_up')
            keys.append('scroll_y_amount_down')
        expAnswers = ExperimentAnswer.objects.filter(experiment=exp)
        for a in expAnswers:
            #print(a)
           
            
            #get screen size:
            mouseData = a.mouseData
            mouseLines = mouseData.splitlines()
            clicks = 0
            time = "undefined"
            
            scroll_x = []
            scroll_y = []
            scroll_y_abs = []
            scroll_y_up = []
            scroll_y_down = []
            last_mouse = [0,0]
            next_mouse = [0,0]
            line_i = 0
            while line_i < len(mouseLines):
                line = mouseLines[line_i]
                pline = processLine(line)
                
                if pline['action'] == "click":
                    clicks += 1
                    last_mouse=[pline['x'], pline['y']]
                    line_i += 1
                elif pline['action'] == "ready":
                    w = pline['x']
                    h = pline['y']
                    data['window_w'] = w
                    data['window_h'] = h
                    line_i += 1
                elif pline['action'] == "scroll":
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
                        scroll_x.append(dx)
                        scroll_y.append(dy)
                        scroll_y_abs.append(abs(dy))
                        if dy > 0:
                            scroll_y_down.append(dy)
                        else:
                            scroll_y_up.append(abs(dy))
                    line_i += scroll_count
                else:
                    line_i += 1
                
                if 'x' in pline and pline['x'] != "undefined":
                    last_mouse=[float(pline['x']), float(pline['y'])]
            
            if 'scroll_count' not in data:
                data['scroll_count'] = 0
                data['scroll_count_up'] = 0
                data['scroll_count_down'] = 0
                data['scroll_y_amount'] = 0
                data['scroll_y_amount_up'] = 0
                data['scroll_y_amount_down'] = 0
            
            
            try:
                i = 0
                firstLine = mouseLines[i]
                while (int(processLine(firstLine)['time']) == 0):
                    i += 1
                    firstLine = mouseLines[i]
                i = -1
                lastLine = mouseLines[i]
                while (int(processLine(lastLine)['time']) == 0):
                    i -= 1
                    lastLine = mouseLines[i]
    
                try:
                    time1 = int(processLine(firstLine)['time'])
                    time2 = int(processLine(lastLine)['time'])
                    #print(time1, time2)
                    time = (time2-time1) / 1000.0
                except Exception as e:
                    print("save_csv: Error2: ", e)
                    time = "undefined"
            except Exception as e:
                print("save_csv: Error3: ", e)
                time = "undefined"
                    
            if "{" in a.answer:
                answer = json.loads(a.answer)
                for k,v in answer.iteritems():
                    if (a.question.slug+"-"+k) not in keys:
                        keys.append(a.question.slug+"-"+k)
                    data[a.question.slug+"-"+k] = v.encode('utf-8')
                
                # links
                data[a.question.slug+"-heatmap"] = baseURL+reverse('heatmap', args=[a.id])
                data[a.question.slug+"-static_mouse_paths"] = baseURL+reverse('static_mouse_paths', args=[a.id])
                data[a.question.slug+"-animated_mouse_paths"] = baseURL+reverse('animated_mouse_paths', args=[a.id])
                #also add time, clicks,
                data[a.question.slug+"-clicks"] = clicks
                data[a.question.slug+"-time"] = time
                
                if (a.question.slug+"-heatmap") not in keys:
                        keys.append(a.question.slug+"-heatmap")
                        keys.append(a.question.slug+"-static_mouse_paths")
                        keys.append(a.question.slug+"-animated_mouse_paths")
                        keys.append(a.question.slug+"-clicks")
                        keys.append(a.question.slug+"-time")
                
                data['scroll_count'] = len(scroll_y)
                if len(scroll_y) > 0:
                    data['scroll_count_up'] = len(scroll_y_up)
                    data['scroll_count_down'] = len(scroll_y_down)
                    data['scroll_y_amount'] = sum(scroll_y_abs)
                    data['scroll_y_amount_up'] = sum(scroll_y_up)
                    data['scroll_y_amount_down'] = sum(scroll_y_down)
                    #print("scroll: ", len(scroll_x), np.mean(scroll_x), np.std(scroll_x), np.mean(scroll_y),  np.std(scroll_y))
                
            elif " of " in a.answer and a.question.slug == "mammography-problem":  
                numbers = a.answer.split(' of ', 2)
                numerator   = float(numbers[0])
                denominator = float(numbers[1])
                data[a.question.slug+"-numerator"] = numerator
                data[a.question.slug+"-denominator"] = denominator
                if a.question.slug+"-numerator" not in keys:
                    keys.append(a.question.slug+"-numerator")
                if a.question.slug+"-denominator" not in keys:
                    keys.append(a.question.slug+"-denominator")
                data[a.question.slug] = a.answer
                
                 # links
                data[a.question.slug+"-heatmap"] = baseURL+reverse('heatmap', args=[a.id])
                data[a.question.slug+"-static_mouse_paths"] = baseURL+reverse('static_mouse_paths', args=[a.id])
                data[a.question.slug+"-animated_mouse_paths"] = baseURL+reverse('animated_mouse_paths', args=[a.id])
                #also add time, clicks,
                data[a.question.slug+"-clicks"] = clicks
                data[a.question.slug+"-time"] = time
                
                if (a.question.slug+"-heatmap") not in keys:
                        keys.append(a.question.slug+"-heatmap")
                        keys.append(a.question.slug+"-static_mouse_paths")
                        keys.append(a.question.slug+"-animated_mouse_paths")
                        keys.append(a.question.slug+"-clicks")
                        keys.append(a.question.slug+"-time")
                data['scroll_count'] = len(scroll_y)
                if len(scroll_y) > 0:
                    data['scroll_count_up'] = len(scroll_y_up)
                    data['scroll_count_down'] = len(scroll_y_down)
                    data['scroll_y_amount'] = sum(scroll_y_abs)
                    data['scroll_y_amount_up'] = sum(scroll_y_up)
                    data['scroll_y_amount_down'] = sum(scroll_y_down)
            else:
                if a.question.slug not in keys:
                    keys.append(a.question.slug)
                data[a.question.slug] = a.answer.encode('utf-8')
            if a.confidence > 0:
                data[a.question.slug+"-confidence"] = a.confidence
                if a.question.slug+"-confidence" not in keys:
                    keys.append(a.question.slug+"-confidence")
        #print("scroll_count:", data['scroll_count'])
        toCSV.append(data)
    
    fname = "%s\data_export_survey_with_scroll_%s.csv" %(settings.SITE_ROOT, survey_id)
    with open(fname, 'wb') as f:
        print("saving file "+fname)
        dict_writer = csv.DictWriter(f, keys)
        dict_writer.writer.writerow(keys)
        dict_writer.writerows(toCSV)
    
    return HttpResponse('{"status":"done"}', mimetype="application/json")

def save_csv(request, survey_id):
    survey = get_object_or_404(Survey, id=survey_id)
    experments = Experiment.objects.filter(survey=survey, finished=True)
    toCSV = []
    keys = []
    baseURL = "http://127.0.0.1:8000/"
    for exp in experments:
        #print(exp)
        data = {
            'turk_user_id': exp.user,
            'user_id': exp.user.id,
            'condition': VIS_TYPES[exp.survey_condition][1],
            'ip': exp.remote_address,
            'map': baseURL+reverse('expmap', args=[exp.id])
        }
        if 'user_id' not in keys:
            keys.append('turk_user_id')
            keys.append('user_id')
            keys.append('condition')
            keys.append('ip')
            keys.append('map')
            keys.append('screensize')
        expAnswers = ExperimentAnswer.objects.filter(experiment=exp)
        for a in expAnswers:
            #print(a)
           
            
            #get screen size:
            mouseData = a.mouseData
            mouseLines = mouseData.splitlines()
            clicks = 0
            time = "undefined"
            screen = "0 x 0"
            
            for line in mouseLines:
                pline = processLine(line)
                if pline['action'] == "click":
                    clicks += 1
                if pline['action'] == "ready":
                    w = pline['x']
                    h = pline['y']
                    screen = w+" x "+h
            if 'screensize' not in data or data['screensize'] == "0 x 0":
                data['screensize'] = screen
            try:
                i = 0
                firstLine = mouseLines[i]
                while (int(processLine(firstLine)['time']) == 0):
                    i += 1
                    firstLine = mouseLines[i]
                i = -1
                lastLine = mouseLines[i]
                while (int(processLine(lastLine)['time']) == 0):
                    i -= 1
                    lastLine = mouseLines[i]
    
                try:
                    time1 = int(processLine(firstLine)['time'])
                    time2 = int(processLine(lastLine)['time'])
                    #print(time1, time2)
                    time = (time2-time1) / 1000.0
                except Exception as e:
                    print("save_csv: Error2: ", e)
                    time = "undefined"
            except Exception as e:
                print("save_csv: Error3: ", e)
                time = "undefined"
                    
            if "{" in a.answer:
                answer = json.loads(a.answer)
                for k,v in answer.iteritems():
                    if (a.question.slug+"-"+k) not in keys:
                        keys.append(a.question.slug+"-"+k)
                    data[a.question.slug+"-"+k] = v.encode('utf-8')
                
                # links
                data[a.question.slug+"-heatmap"] = baseURL+reverse('heatmap', args=[a.id])
                data[a.question.slug+"-static_mouse_paths"] = baseURL+reverse('static_mouse_paths', args=[a.id])
                data[a.question.slug+"-animated_mouse_paths"] = baseURL+reverse('animated_mouse_paths', args=[a.id])
                #also add time, clicks,
                data[a.question.slug+"-clicks"] = clicks
                data[a.question.slug+"-time"] = time
                
                if (a.question.slug+"-heatmap") not in keys:
                        keys.append(a.question.slug+"-heatmap")
                        keys.append(a.question.slug+"-static_mouse_paths")
                        keys.append(a.question.slug+"-animated_mouse_paths")
                        keys.append(a.question.slug+"-clicks")
                        keys.append(a.question.slug+"-time")
            
            elif " of " in a.answer and a.question.slug == "mammography-problem":  
                numbers = a.answer.split(' of ', 2)
                numerator   = float(numbers[0])
                denominator = float(numbers[1])
                data[a.question.slug+"-numerator"] = numerator
                data[a.question.slug+"-denominator"] = denominator
                if a.question.slug+"-numerator" not in keys:
                    keys.append(a.question.slug+"-numerator")
                if a.question.slug+"-denominator" not in keys:
                    keys.append(a.question.slug+"-denominator")
                data[a.question.slug] = a.answer
                
                 # links
                data[a.question.slug+"-heatmap"] = baseURL+reverse('heatmap', args=[a.id])
                data[a.question.slug+"-static_mouse_paths"] = baseURL+reverse('static_mouse_paths', args=[a.id])
                data[a.question.slug+"-animated_mouse_paths"] = baseURL+reverse('animated_mouse_paths', args=[a.id])
                #also add time, clicks,
                data[a.question.slug+"-clicks"] = clicks
                data[a.question.slug+"-time"] = time
                
                if (a.question.slug+"-heatmap") not in keys:
                        keys.append(a.question.slug+"-heatmap")
                        keys.append(a.question.slug+"-static_mouse_paths")
                        keys.append(a.question.slug+"-animated_mouse_paths")
                        keys.append(a.question.slug+"-clicks")
                        keys.append(a.question.slug+"-time")
            else:
                if a.question.slug not in keys:
                    keys.append(a.question.slug)
                data[a.question.slug] = a.answer.encode('utf-8')
            if a.confidence > 0:
                data[a.question.slug+"-confidence"] = a.confidence
                if a.question.slug+"-confidence" not in keys:
                    keys.append(a.question.slug+"-confidence")
        toCSV.append(data)
    
    fname = "%s\data_export_survey_%s.csv" %(settings.SITE_ROOT, survey_id)
    with open(fname, 'wb') as f:
        print("saving file "+fname)
        dict_writer = csv.DictWriter(f, keys)
        dict_writer.writer.writerow(keys)
        dict_writer.writerows(toCSV)
    
    return HttpResponse('{"status":"done"}', mimetype="application/json")
