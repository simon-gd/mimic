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
from azure.storage import *
from mimic.settings import local as settings

from pymongo import MongoClient

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

def json_preprocess_answers_compressdb(request, survey_id):
    survey = get_object_or_404(Survey, id=survey_id)
    expAns = ExperimentAnswer.objects.filter(experiment__survey=survey)
    for a in expAns:
        rawEventData = a.mouseData
        compressed = zlib.compress(rawEventData).decode('latin1')
        a.mouseData = compressed
        a.save()
    return HttpResponse('{"status":"done"}', mimetype="application/json")

def processLine(line):
    vals = line.split('\t')
    
    if vals[1] == "keydown":
        return {"time": vals[0], "action": vals[1], "key": vals[2] }
    elif vals[1] == "blur" or vals[1] == "focus" or vals[1] == "scroll":
        return {"time": vals[0], "action": vals[1] }
    else:
        return {"time": vals[0], "action": vals[1], "x": vals[2], "y": vals[3] }

@staff_member_required
def json_preprocess_answers(request, survey_id):
    #return save_answers_to_azure(request, survey_id)
    #return json_preprocess_answers_v1(request, survey_id)
    #return json_preprocess_answers_to_mongodb(request, survey_id)
    return json_preprocess_answers_v2(request, survey_id)
    #return HttpResponse('{"status":"done"}', mimetype="application/json")

def json_preprocess_answers_to_mongodb(request, survey_id):
    client = MongoClient('localhost', 27017)
    user_name = "admin"
    survey = get_object_or_404(Survey, id=survey_id)
    collection_name = "survey-"+str(survey.id)
    db = client["mimic_"+user_name]
    collection = db[collection_name]
    expAns = ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True)
    for a in expAns:
        rawEventData = a.mouseData
        if survey_id=='4' and rawEventData[0] != "[":
            eventData = zlib.decompress(rawEventData.encode('latin1'))
        else:
            eventData = rawEventData
        try:
            #blob_service.get_blob_metadata(container_name, "ExperimentAnswer-"+str(a.id)+'.json')
            ans = {"experiment_id": a.experiment.id,
                    "survey_condition": a.experiment.survey_condition,
                    "remote_address": a.experiment.remote_address,
                    "http_user_agent":a.experiment.http_user_agent,
                    "question_id": a.question.id,
                    "correct_answer": json.loads(a.question.correct_answer.encode('utf-8')),
                    "answer": json.loads(a.answer.encode('utf-8')),
                    "confidence":a.confidence,
                    "participant_id":a.user.id,
                    "participant_worker_id":a.user.worker_id,
                    "submitted_at":a.submitted_at,
                    "event_data": json.loads(eventData.encode('utf-8')),
            }
            ans_id = collection.insert(ans)
            print("inserted: ", ans_id)
        except e: 
            print("error: ", e)

    return HttpResponse('{"status":"done"}', mimetype="application/json")
@staff_member_required
def save_answers_to_azure(request, survey_id):
    user_name = "admin"
    survey = get_object_or_404(Survey, id=survey_id)
    container_name = "survey-"+str(survey.id)
    
    blob_service = BlobService(account_name=settings.AZURE_STORAGE_ACCOUNT, account_key=settings.AZURE_STORAGE_KEY)
    blob_service.create_container(container_name)
    
    expAns = ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True)
    for a in expAns:
        rawEventData = a.mouseData
        if survey_id=='4' and rawEventData[0] != "[":
            eventData = zlib.decompress(rawEventData.encode('latin1'))
        else:
            eventData = rawEventData
        try:
            blob_service.get_blob_metadata(container_name, "ExperimentAnswer-"+str(a.id)+'.json')
        except: 
            with open('media/ExperimentAnswer-'+str(a.id)+'.json', 'w') as outfile:
                json.dump(eventData, outfile)
            blob_service.put_blob(container_name, "ExperimentAnswer-"+str(a.id)+'.json', eventData, x_ms_blob_type='BlockBlob')
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


"""
import gzip


def mydeflate(data):   # zlib only provides the zlib compress format, not the deflate format;
  try:               # so on top of all there's this workaround:
    return zlib.decompress(data)
  except zlib.error:
    try:               # so on top of all there's this workaround:
        compressedstream = StringIO.StringIO(data)
        gzipper = gzip.GzipFile(fileobj=compressedstream)
        return gzipper.read()
    except zlib.error:
        return ""
"""    
from django import db
import gc

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

def json_preprocess_answers_v2(request, survey_id):
    db.reset_queries()
    #newer JSON Interaction Data processing version 2
    survey = get_object_or_404(Survey, id=survey_id)
    #ExperimentAnswerProcessed.objects.filter(experiment__survey=survey).delete()
    #return HttpResponse('{"created":'+str(0)+',"updated":'+str(0)+',"skipped":'+str(0)+'}', mimetype="application/json")
    expected_answers = SurveyMembership.objects.filter(survey=survey).count()
                
    expAns = queryset_iterator(ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True, experiment__state=0), chunksize=500) #.iterator() # experiment__state=0)
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
            a.experiment.state = 2 #Error
            a.experiment.save()
            continue

        if rawEventData[0] != "[":
            try:
                rawEventData =  zlib.decompress(a.mouseData.encode('latin1')) 
            except Exception as e:
                skipped_count += 1
                a.experiment.state = 2 #Error
                a.experiment.save()
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
                    window_w = line[2]['window']['width']
                    window_h = line[2]['window']['height']
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
            p_a.delete()
            a.experiment.state = 2 #Error
            a.experiment.save()
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
            e_test.state = 1
            e_test.save()
            experiments_disabled += 1

    return HttpResponse('{"created":'+str(create_count)+',"updated":'+str(updated_count)+',"skipped":'+str(skipped_count)+',"experiments_disabled":'+str(experiments_disabled)+'}', mimetype="application/json")


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
    #http://localhost:8000/survey/admin/debug_question/2/?condition=0&tracking=1
    
    if "condition" in request.GET:
        condition = request.GET["condition"]
    else:
        condition = 0
        
    question = get_object_or_404(Question, id=question_id)
    debug = 1
    #if question.data
    #get order
    qnum = 1
    membership = get_object_or_404(SurveyMembership, question=question)
    qnum = membership.order
    if "tracking" in request.GET:
        debug = 0
        # XXX hack
        t = question.base_template
        #if question.id > 13:
        #    t = 'question_v2.html'
        #if question.id > 13:
        #    t = 'question_v2.html'
        #else:
        #    t = 'question_v1.html'
    else:
        t = "no_tracking_"+question.base_template
        #if question.id > 13:
        #    t = 'question_v2_no_tracking.html'
        #else:
        #    t = 'question_v1_no_tracking.html'
    print(t)
    
    return render(request, t, {'question_template': question.template, 'question': question.data, 'condition':condition, 'qnum':qnum,'qtotal':1, 'debug':debug})

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

@staff_member_required
def json_analysis(request, survey_id, question_id):
    survey = get_object_or_404(Survey, id=survey_id)
    expAns = ExperimentAnswer.objects.filter(experiment__survey=survey, experiment__finished=True, question__id = question_id)
    answers = {'stats': {}, 'data': [] }
    condition_count = 5
    condition_data = []
    for i in range(condition_count):
        condition_data.append({})
    
    
    #correct_p = 8.0
    #correct_p = 103.0
    
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

@staff_member_required
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
    
    expAns = ExperimentAnswerProcessed.objects.filter(experiment__survey=survey, experiment__state__in=[0], question__id = question_id)
    answers = { 'data': []}
    
    #max_questions = 2000
    #q0 = 0
    #q1 = 0
    ids = []
    for a in expAns:
        confidenceClick = 0
        mouseClickDataRaw = a.mouse_click_event
        try:
            clickEventData = zlib.decompress(mouseClickDataRaw.encode('latin1'))
            clickEventDataJSON = json.loads(clickEventData.encode('utf-8'))
            for line in clickEventDataJSON:
                if 'e' in line and 'target' in line['e'] and 'id' in line['e']['target'] and "confidence" in line['e']['target']['id']:
                    confidenceClick += 1
        except Exception as e:
            print("failed to decompress")
            #clicks += 1
            #        xPos = line[1]['pageX']
            #        yPos = line[1]['pageY']
            #        clickEvents.append({'time':line[1]['timeStamp'], 'x':xPos, 'y':yPos, 'type':"click", 'e':line[1], 'extra': line[2]})
            #        miscEvents.append({'time':line[1]['timeStamp'], 'x':xPos, 'y':yPos, 'type':"click", 'e':line[1], 'extra': line[2]})
                    
        condition = a.experiment.survey_condition
        #if int(condition) == 0:
        #   q0 += 1
        #    if q0 > max_questions:
        #        continue
        #if int(condition) == 1:
        #    q1 += 1
        #    if q1 > max_questions:
        #        continue
        correct_answer = a.question.correct_answer
        #if a.question.correct_answer and "of" in a.question.correct_answer:
        #    numbers = a.question.correct_answer.split(' of ', 2)
        #    answersO = {}
        #    answersO['a1'] = numbers[0]
        #    answersO['a2'] = numbers[1]
        #    correct_answer = json.dumps(answersO)
        
        cursor_y = a.cursor_y
        v = {'version':2,'id':a.id, 'experiment_id': a.experiment.id, 'state': a.experiment.state, 'condition': condition,
             'answer':a.answer, 'correct_answer': correct_answer, 'confidence':a.confidence,'user':a.user.id,
             'time': float(a.time), 'clicks':a.clicks_count, 'scrolls':a.scroll_count, 'confidenceClick':confidenceClick, 'keydown': a.keys_count, 'window_h':a.window_h, 'window_w':a.window_w,  'cursor_y': cursor_y}
        ids.append(a.experiment.id)
        answers['data'].append(v)
    json_answers = json.dumps( answers ) #serializers.serialize("json", answers)
    #json_answers = json_answers.replace("NaN", "0")
    
    #Experiments = Experiment.objects.all()
    #for experiment in Experiments:
    #    if experiment.survey.id == 4:
    #        experiment.version = 2
    #    else:
    #        experiment.version = 1
    #    experiment.save()
    #ExperimentAnswers = ExperimentAnswerProcessed.objects.all()
    #for expAns in ExperimentAnswers:
    #    if expAns.experiment.survey.id == 4:
    #        expAns.version = 2
    #    else:
    #        expAns.version = 1
    #Experiments.delete()
    """
    Experiments = Experiment.objects.filter(survey=survey).exclude(id__in=ids)
    print("expAnsLimited",len(Experiments))
    data = serializers.serialize("json", Experiments, relations = ('user'))
    out = open("data/micallef-replication/Experiment_unused.json", "w")
    out.write(data)
    out.close()
    
    ExperimentAnswers = ExperimentAnswer.objects.filter(experiment__survey=survey).exclude(experiment__id__in=ids)
    print("ExperimentAnswer",len(ExperimentAnswers))
    data = serializers.serialize("json", ExperimentAnswers)
    out = open("data/micallef-replication/ExperimentAnswers_unused.json", "w")
    out.write(data)
    out.close()
    
    ExperimentAnswerProcesseds = ExperimentAnswerProcessed.objects.filter(experiment__survey=survey).exclude(experiment__id__in=ids)
    print("ExperimentAnswer",len(ExperimentAnswerProcesseds))
    data = serializers.serialize("json", ExperimentAnswerProcesseds)
    out = open("data/micallef-replication/ExperimentAnswerProcesseds_unsued.json", "w")
    out.write(data)
    out.close()
    
    print("users",len(Experiments))
    """
    """
    Experiments = Experiment.objects.filter(id__in=ids)
    print("expAnsLimited",len(Experiments))
    data = serializers.serialize("json", Experiments, relations = ('user'))
    out = open("data/micallef-replication/Experiment.json", "w")
    out.write(data)
    out.close()
    
    ExperimentAnswers = ExperimentAnswer.objects.filter(experiment__id__in=ids)
    print("ExperimentAnswer",len(ExperimentAnswers))
    data = serializers.serialize("json", ExperimentAnswers)
    out = open("data/micallef-replication/ExperimentAnswers.json", "w")
    out.write(data)
    out.close()
    
    ExperimentAnswerProcesseds = ExperimentAnswerProcessed.objects.filter(experiment__id__in=ids)
    print("ExperimentAnswer",len(ExperimentAnswerProcesseds))
    data = serializers.serialize("json", ExperimentAnswerProcesseds)
    out = open("data/micallef-replication/ExperimentAnswerProcesseds.json", "w")
    out.write(data)
    out.close()
    """
    return HttpResponse(json_answers, mimetype="application/json")

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
            
        """
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
                # Figure out time
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
                    condition_data[condition]['times'].append(time)
                except Exception as e:
                    print("json_answers: Error2: ", e)
                    time = "undefined"
                
                for line_i in range(0, len(mouseDataJSON)):
                    line = mouseDataJSON[line_i]
                    if line[0] == "mousemove":
                        movePts.append({'time': float(line[1]['timeStamp'])-start_time, 'x': float(line[1]['pageX']) , 'y': float(line[1]['pageY'])})
                    if line[0] == "click":
                        clickPts.append({'time': float(line[1]['timeStamp'])-start_time, 'x': float(line[1]['pageX']) , 'y': float(line[1]['pageY'])})
                    elif line[0] == "keydown":
                        line_j = getPrevMoveJSON(line_i, mouseDataJSON)
                        if line_j <  len(mouseDataJSON):
                            line_prev = mouseDataJSON[line_j]
                            if 'pageX' in line_prev[1]:
                                keyPts.append({'time': float(line[1]['timeStamp'])-start_time, 'x': float(line_prev[1]['pageX']) , 'y': float(line_prev[1]['pageY'])})
                            else:
                                keyPts.append({'time': float(line[1]['timeStamp'])-start_time, 'x': 0 , 'y': 0})
                
            elif version == 1:
                mouseLines = mouseData.splitlines()
               
                clicks = 0
                scrolls = 0
                keydown = 0
                for line in mouseLines:
                    pline = processLine(line)
                    if pline['action'] == "click":
                        clicks += 1
                    elif pline['action'] == "scroll":
                        scrolls += 1
                    elif pline['action'] == "keydown":
                        keydown += 1
                    elif pline['action'] == "ready":
                        w = pline['x']
                        h = pline['y']
                        screen = w+"_"+h
                        screensListW.append(int(w))
                        screensListH.append(int(h))
                        if screen in answers['screendata']['counts']:
                            answers['screendata']['counts'][screen] += 1
                        else:
                            answers['screendata']['counts'][screen] =  1
                condition_data[condition]['clickList'].append(clicks)
                
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
                    #print(time1, time2)
                    time = (time2-time1) / 1000.0
                    condition_data[condition]['times'].append(time)
                except Exception as e:
                    print("json_answers: Error2: ", e)
                    time = "undefined"
                
                
                for line_i in range(0, len(mouseLines)):
                    line = mouseLines[line_i]
                    pline = processLine(line)
                    if pline['action'] == "mousemove":
                        movePts.append({'time': float(pline['time'])-start_time, 'x': float(pline['x']) , 'y': float(pline['y'])})
                    if pline['action'] == "click":
                        clickPts.append({'time': float(pline['time'])-start_time, 'x': float(pline['x']) , 'y': float(pline['y'])})
                    elif pline['action'] == "keydown":
                        line_j = getPrevMove(line_i, mouseLines)
                        if line_j <  len(mouseLines):
                            line_prev = mouseLines[line_j]
                            pline_prev = processLine(line_prev)
                            if 'x' in pline_prev:
                                keyPts.append({'time': float(pline['time'])-start_time, 'x': float(pline_prev['x']) , 'y': float(pline_prev['y'])})
                            else:
                                keyPts.append({'time': float(pline['time'])-start_time, 'x': 0 , 'y': 0})

        except Exception as e:
            print("json_answers: Error: ", e)
            clicks = 0
            scrolls = 0
            time = 0
            keydown = 0
        
        if "{" in a.answer:
            answer = json.loads(a.answer.encode('utf-8'))
            for k,v in answer.iteritems():
                if k not in condition_data[condition]['data']:
                    condition_data[condition]['data'][k] = {}

                if v not in condition_data[condition]['data'][k]:
                    condition_data[condition]['data'][k][v] = 1
                else:
                    condition_data[condition]['data'][k][v] += 1
        
        else:
            if condition_data[condition]['data'].has_key(a.answer):
                condition_data[condition]['data'][a.answer] += 1
            else:
                condition_data[condition]['data'][a.answer] = 1
        
        if a.question.slug not in global_count:
            global_count[a.question.slug] = {}
        
        if a.answer in global_count[a.question.slug]:
            global_count[a.question.slug][a.answer] += 1
        else:
            global_count[a.question.slug][a.answer] = 1
        
        try:
            answerInt = float(a.answer)
            global_stats.append(answerInt)
        except:
            pass
        """
        v = {'version':version,'id':a.id, 'experiment_id': a.experiment.id, 'state': a.experiment.state, 'condition': condition, 'answer':a.answer, 'correct_answer':a.question.correct_answer, 'confidence':a.confidence,'user':a.user.id, 'time':time, 'clicks':clicks, 'scrolls':scrolls, 'keydown': keydown, 'clickPts': clickPts, 'keyPts': keyPts, 'movePts': movePts, 'mouseData':mouseData}
        #print(keyPts)
        #print(clickPts)
        answers['data'].append(v)
    
    """
    answers['screendata']['stats']['meanW'] = np.mean(screensListW)
    answers['screendata']['stats']['stdW'] = np.std(screensListW)
    answers['screendata']['stats']['meanH'] = np.mean(screensListH)
    answers['screendata']['stats']['stdH'] = np.std(screensListH)
    
    answers['global_counts'] = global_count
    answers['global_stats'] = {}
    answers['global_stats']['mean'] = np.mean(global_stats)
    answers['global_stats']['std'] = np.std(global_stats)
    
    for i in range(condition_count):
        meanTime = np.mean(condition_data[i]['times'])
        stdTime = np.std(condition_data[i]['times'])
        meanClicks = np.mean(condition_data[i]['clickList'])
        stdClicks = np.std(condition_data[i]['clickList'])
        answers['stats'][i] = {}
        answers['stats'][i]['meanTime'] = meanTime
        answers['stats'][i]['stdTime'] = stdTime
        answers['stats'][i]['meanClicks'] = meanClicks
        answers['stats'][i]['stdClicks'] = stdClicks
        answers['stats'][i]['data'] = condition_data[i]['data']
    """
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
    eventData = zlib.decompress(mouseDataRaw.encode('latin1'))
    survey = expAns.experiment.survey
    current_question = expAns.question

    return version, expAns, survey, current_question,  eventData, "", "", int(expAns.window_w), int(expAns.window_h)


@staff_member_required
def static_mouse_paths(request, answer_id):
    expAns, survey, current_question,  mouseMoves, mouseClicks, scrolls, w, h = process_mouse_paths(request, answer_id)
    return render_to_response('mouse_paths.html', {'show_numbers':True,
                                                   'survey':survey,
                                                   'question':current_question.data,
                                                   'condition': expAns.experiment.survey_condition,
                                                   'question_template': current_question.template,
                                                   'mouseMoves':mouseMoves,
                                                   'mouseClicks':mouseClicks,
                                                   'scrolls':scrolls}, context_instance=RequestContext(request))

@staff_member_required
def animated_mouse_paths(request, answer_id):
    version, expAns, survey, current_question, mouseMoves, mouseClicks, scrolls, w, h = process_mouse_paths(request, answer_id)
    #if version == 1:
    #    template = 'mouse_paths_animated.html'
    #else:
    template = 'mouse_paths_animated_v3.html'
    
    return render_to_response(template, {'show_numbers':True,
                                                            'survey':survey,
                                                            'question':current_question,
                                                            'condition': expAns.experiment.survey_condition,
                                                            'question_template': current_question.template,
                                                            'mouseMoves':mouseMoves,
                                                            'version': version,
                                                            'mouseClicks':mouseClicks,
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
def comp_heatmap (request, survey_id, question_id, condition):
    survey = get_object_or_404(Survey, id=survey_id)
    current_question = get_object_or_404(Question, id=question_id)
    
    expAnswers = ExperimentAnswerProcessed.objects.filter(question=current_question,experiment__survey=survey, experiment__survey_condition=condition, experiment__finished=True)

    mouseMoves = []
    for expAns in expAnswers:
        mouseMoveDataRaw = expAns.mouse_move_event
        mouseClickDataRaw = expAns.mouse_click_event
        
        mouseMovesJSON = zlib.decompress(mouseMoveDataRaw.encode('latin1'))
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
    
    """
    fname = ("%s\cache\comp_mouse_moves_%s_%s_%s.p") % (settings.SITE_ROOT, survey_id, question_id, condition)
    # try_cache
    if os.path.isfile(fname):
        print("loading cache")
        mouseMoves,mouseClicks = pickle.load( open( fname, "rb" ) )
    else:
        expAnswers = ExperimentAnswer.objects.filter(question=current_question,experiment__survey=survey, experiment__survey_condition=condition, experiment__finished=True)
        #"+ str(10*len(expAnswers)) +"
        mouseMoves = "{'max': 10, 'data': ["
        mouseClicks = "{'max': 10, 'data': ["
        print("comp_heatmap stared")
        count = 0
        for expAns in expAnswers:
            mouseDataRaw = expAns.mouseData
            mouseData = json.loads(mouseDataRaw.encode('utf-8'))
            for line in mouseData:
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

            #mouseLines = mouseData.splitlines()
            #print("processing answer", count, " out of ", len(expAnswers))
            #for line in mouseLines:
            #    vals = line.split('\t');
            #    if vals[1] == "mousemove":
            #        mouseMoves += "{'count':" + str(1) + ",'x':" + vals[2] + ",'y':" + vals[3] + "},";
            #    elif vals[1] == "click":
            #        mouseClicks += "{'count':" + str(1) + ",'x':" + vals[2] + ",'y':" + vals[3] + "},";
            count +=1
        mouseMoves += "]}"
        mouseClicks += "]}"
        #save cache
        data = (mouseMoves,mouseClicks)
        pickle.dump( data, open( fname, "wb" ) )
    
    print("comp_heatmap sending to client now")
    return render_to_response('heatmap.html', {'survey':survey,
                                               'question':current_question.data,
                                               'condition': condition,
                                               'question_template': current_question.template,
                                               'mouseMoves':mouseMoves,
                                               'mouseClicks':mouseClicks}, context_instance=RequestContext(request))
    """

@staff_member_required
def heatmap(request, answer_id):
    """
    expAns = get_object_or_404(ExperimentAnswer, id=answer_id)
    
    survey = expAns.experiment.survey
    current_question = expAns.question
    condition = expAns.experiment.survey_condition
    
    mouseDataRaw = expAns.mouseData
    mouseData = json.loads(mouseDataRaw.encode('utf-8'))
    mouseMoves = {'max':10, 'data':[]}
    mouseClicks = {'max':10, 'data':[]}
    
    for line in mouseData:
        if line[0] == "mousemove":
            mouseMoves['data'].append({'time':line[1]['timeStamp'], 'x':line[1]['pageX'], 'y':line[1]['pageY'], 'type':"mousemove", 'e':line[1], 'extra': line[2]})
        elif line[0] == "click":
            mouseMoves['data'].append({'time':line[1]['timeStamp'], 'x':line[1]['pageX'], 'y':line[1]['pageY'], 'type':"click", 'e':line[1], 'extra': line[2]})

    #for line in mouseLines:
    #    vals = line.split('\t');
    #    if vals[1] == "mousemove":
    #        mouseMoves += "{count:" + str(1) + ",x:" + vals[2] + ",y:" + vals[3] + "},";
    #    elif vals[1] == "click":
    #        mouseClicks += "{count:" + str(1) + ",x:" + vals[2] + ",y:" + vals[3] + "},";
    #mouseMoves += "]}"
    #mouseClicks += "]}"
    mouseMovesJSON = json.dumps(mouseMoves)
    mouseClicksJSON = json.dumps(mouseClicks)
    """
    expAns = get_object_or_404(ExperimentAnswerProcessed, id=answer_id)
    survey = expAns.experiment.survey
    current_question = expAns.question
    condition = expAns.experiment.survey_condition
    
    mouseMoveDataRaw = expAns.mouse_move_event
    mouseClickDataRaw = expAns.mouse_click_event
    
    mouseMovesJSON = zlib.decompress(mouseMoveDataRaw.encode('latin1'))
    mouseClicksJSON = zlib.decompress(mouseClickDataRaw.encode('latin1'))
    
    return render_to_response('heatmap.html', {'survey':survey,
                                               'question':current_question,
                                               'condition': condition,
                                               'question_template': current_question.template,
                                               'mouseMoves':mouseMovesJSON,
                                               'mouseClicks':mouseClicksJSON}, context_instance=RequestContext(request))

@staff_member_required
def comp_expmap(request, survey_id, question_id):
    experiment = Experiment.objects.filter(survey__id = survey_id)
    ips = "["
    for exp in experiment:
        ipr = exp.remote_address
        ipPattern = re.compile('\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}')
        ip = re.findall( ipPattern, ipr )
        if len(ip) > 0:
            ips += "\"" + ip[0] + "\","
    ips += "]"
    return render_to_response('ip_map.html', {'ips':ips}, context_instance=RequestContext(request))
    """
    expAns = ExperimentAnswer.objects.filter(question__id = question_id, experiment__survey__id = survey_id)
    ips = "["
    for expA in expAns:
        bla = expA.experiment.allMetaData
        index = bla.find("HTTP_X_FORWARDED_FOR")
        ip = bla[index+24:index+24+16]
        q_index = ip.find(",")
        if q_index != -1:
            ip = ip[0:q_index]
            
        q_index = ip.find("'")
        if q_index != -1:
            ip = ip[0:q_index]
        
        if ip.find(":") == -1:
            print("ip", ip)
            #metaData = json.loads(bla)
            ips += "\"" + ip + "\","
    ips += "]"
    return render_to_response('ip_map.html', {'ips':ips}, context_instance=RequestContext(request))
    """
    
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
    """
    ips = "["
    if experiment_id:
        exp = get_object_or_404(Experiment, id=experiment_id)
        bla = exp.allMetaData
        #bla = bla.replace("\'", "\"");
        #HTTP_X_FORWARDED_FOR metaData["HTTP_X_FORWARDED_FOR"]
        index = bla.find("HTTP_X_FORWARDED_FOR")
        ip = bla[index+24:index+24+16]
        q_index = ip.find(",")
        if q_index != -1:
            ip = ip[0:q_index]
            
        q_index = ip.find("'")
        if q_index != -1:
            ip = ip[0:q_index]
        
        if ip.find(":") == -1:
            print("ip", ip)
            #metaData = json.loads(bla)
            ips += "\"" + ip + "\","
    else:
        experiments = Experiment.objects.filter(finished=True)
        
        for exp in experiments:
            
            bla = exp.allMetaData
            #bla = bla.replace("\'", "\"");
            #HTTP_X_FORWARDED_FOR metaData["HTTP_X_FORWARDED_FOR"]
            index = bla.find("HTTP_X_FORWARDED_FOR")
            ip = bla[index+24:index+24+16]
            q_index = ip.find(",")
            if q_index != -1:
                ip = ip[0:q_index]
                
            q_index = ip.find("'")
            if q_index != -1:
                ip = ip[0:q_index]
            
            if ip.find(":") == -1:
                print("ip", ip)
                #metaData = json.loads(bla)
                ips += "\"" + ip + "\","
    ips += "]"
    """
    return render_to_response('ip_map.html', {'ips':ips}, context_instance=RequestContext(request))