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
import re
import operator
import zlib
import base64
from django.core.urlresolvers import reverse
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.admin.views.decorators import staff_member_required
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect, render, get_object_or_404, get_list_or_404
from django.template import RequestContext


from survey.models import Question, Survey, SurveyMembership, Experiment, ExperimentUser, ExperimentAnswer
from survey.forms import WorkerIDForm
#-----------------
# Decorators
#-----------------
def desktop_only(f):
    # mobile devices are not allowed    
    def wrap(request, *args, **kwargs):
            if request.is_android_device or request.is_kindle_device or request.is_ios5_device or request.is_ios_device or request.is_touch_device or request.is_windows_phone_device or request.is_webos:
                return redirect(reverse('not_supported'))
            return f(request, *args, **kwargs)
    wrap.__doc__=f.__doc__
    wrap.__name__=f.__name__
    return wrap

#-----------------
# Helper Functions
#-----------------
def get_active_survey():
    surveys = Survey.objects.filter(active=True)
    if len(surveys) < 1:
        return 0
    return surveys[0]

def create_experiment_session(request, worker_id, condition, survey):
    try:
        # user exists
        user = ExperimentUser.objects.get(worker_id=worker_id)
    except ObjectDoesNotExist:
        user = ExperimentUser.objects.create(worker_id=worker_id)
    
    experiments = Experiment.objects.filter(user=user)
    if len(experiments) > 1:
        # user already took an existing survey
        return None, None
        #redirect(reverse('no_active_survey'))
        #return HttpResponseRedirect(reverse('no_active_survey'))
    elif len(experiments) == 1:
        experiment = experiments[0]
        if experiment.finished == True:
            #already finished the experiment, cannot retake it
            return None, None
        
        if not request.session.exists(request.session.session_key):
            request.session.create()

        request.session['experiment_id'] = experiment.id
        return experiment, user
    else:
        # figure condition counts
        #all_experiments = Experiment.objects.filter(survey=survey)
        #conditions_counts = []
        #for i in range(0,survey.condition_count):
        #    conditions_counts.append(0)

        #for experiment in all_experiments:
        #    conditions_counts[experiment.survey_condition] += 1
        
        #min_index, min_value = min(enumerate(conditions_counts), key=operator.itemgetter(1))
        #print("create_experiment_session", min_index, conditions_counts)
        # didn't take the survey yet
        # update their data
        HTTP_REFERER = ""
        REMOTE_HOST = ""
        REMOTE_ADDR = ""
        
        if request.META.has_key('HTTP_X_FORWARDED_FOR'):
            REMOTE_ADDR = request.META['HTTP_X_FORWARDED_FOR']
        elif request.META.has_key('REMOTE_ADDR'):
            REMOTE_ADDR = request.META['REMOTE_ADDR']
        
        if request.META.has_key('REMOTE_HOST'):
            REMOTE_HOST = request.META['REMOTE_HOST']
        if request.META.has_key('HTTP_REFERER'):
            HTTP_REFERER = request.META['HTTP_REFERER']
            
        metaData = {}
        for v in request.META:
            item = str(request.META[v])
            metaData[v] = re.escape(item)
        jsonMETA = json.dumps(metaData)
        
        if not request.session.exists(request.session.session_key):
            request.session.create()

        experiment = Experiment.objects.create(user=user,
                                             survey=survey,
                                             survey_condition=condition,
                                             session_key=request.session.session_key,
                                             remote_address=REMOTE_ADDR,
                                             remote_host=REMOTE_HOST,
                                             http_referer=HTTP_REFERER,
                                             http_user_agent=request.META['HTTP_USER_AGENT'],
                                             allMetaData=jsonMETA,
                                             finished=False)
        request.session['experiment_id'] = experiment.id
        return experiment, user
    
        

def get_questions(survey):
    finalQuestions =[]
    for sm in SurveyMembership.objects.filter(survey=survey).order_by('order'):
        finalQuestions.append(sm.question)
    return finalQuestions;

def get_questions_desired(survey):
    finalQuestions =[]
    questions = {}
    for mb in survey.surveymembership_set.all().order_by('order'):
        if not questions.has_key(str(mb.order)):
            questions[str(mb.order)] = []
        questions[str(mb.order)].append(mb.question)
    for key,val in questions.iteritems():
        item_added = False
        if len(val) > 1:
            for q in val:
                surveyMembership = SurveyMembership.objects.filter(question=q, survey=survey)
                if len(surveyMembership) < 1:
                    return []
                desired_answers_count = surveyMembership[0].desired_answers
                current_answers = ExperimentAnswer.objects.filter(question=q).filter(experiment__finished=True)
                current_answers_count = len(current_answers)
                if current_answers_count >= desired_answers_count:
                    continue
                else:
                    finalQuestions.append(q)
                    item_added = True
                    break
        else:
            finalQuestions.append(val[0])
            item_added = True
        if not item_added:
            survey.active = False
            survey.save()
            return []
    return finalQuestions
#-----------------
# Views
#-----------------

# -- Errors --
# ------------
def no_active_survey(request):
    request.session.flush()
    return render(request, 'errors/no_active_survey.html')

def not_supported(request):
    request.session.flush()
    return render(request, 'errors/not_supported.html', {}, context_instance=RequestContext(request))

@desktop_only
def need_worker_id(request):
    survey = get_active_survey()
    if not survey:
        return redirect(reverse('no_active_survey'))

    directions = "Please enter your Worker ID:"
    if request.method == 'POST': # If the form has been submitted...
        form = WorkerIDForm(request.POST) # A form bound to the POST data
        if form.is_valid(): # All validation rules pass
            worker_id = form.cleaned_data['worker_id']
            return redirect('/?WorkerId='+worker_id)
        else:
            return render(request, 'errors/need_worker_id.html', {'form':form, 'directions': directions })
    else:
        form = WorkerIDForm() # An unbound form
        return render(request, 'errors/need_worker_id.html', {'form':form, 'directions': directions })

# -- Main Views --
# ----------------

@staff_member_required
def reset(request):
    request.session.flush()
    return HttpResponseRedirect(reverse('survey'))

"""
def appendData(oldData, newData):
    oldDataDec = zlib.decompress(oldData.encode('latin1'))
    prevMouseData = json.loads(oldDataDec.encode('utf-8'))
    if not prevMouseData:
       return newData

    newMouseData = json.loads(newData.encode('utf-8'))
    concatMouseData = prevMouseData+newMouseData

    compressedMouseData = zlib.compress(mouseData).decode('latin1')

    return json.dumps(concatMouseData)
"""

def processWorkerIDAndExperiment(survey, request):
    if not request.session.exists(request.session.session_key):
        request.session.create()

    if "worker_id" in request.GET:
        worker_id = request.GET["worker_id"]
    elif "worker_id" in request.POST:
            worker_id = request.POST["worker_id"]
    elif "worker_id" in request.session:
        worker_id = request.session['worker_id']
    else:
        return None, None, None, None
    request.session['worker_id'] = worker_id
    
    if "condition" in request.GET:
        condition = request.GET["condition"]
    elif "condition" in request.POST:
        condition = request.POST["condition"]
    elif "condition" in request.session:
        condition = request.session['condition']
    else:
        return None, None, None, None
    request.session['condition'] = condition

    user = None
    if 'experiment_id' in request.session:
        try:
            experiment = get_object_or_404(Experiment, id=request.session['experiment_id'])
            if experiment.survey != survey or experiment.condition != condition:
                experiment, user = create_experiment_session(request, worker_id, condition, survey)
            else:
                try:
                    user = ExperimentUser.objects.get(worker_id=worker_id)
                except:
                    experiment, user = create_experiment_session(request, worker_id, condition, survey)
        except:
            experiment, user = create_experiment_session(request, worker_id, condition, survey)
    else:
        experiment, user = create_experiment_session(request, worker_id, condition, survey)


    if experiment == None or user == None:
        return None, None, None, None

    return worker_id, condition, experiment, user
 
# Used to save questions via json
def save_question(request):
    survey = get_active_survey()
    if not survey:
        return redirect(reverse('no_active_survey'))
    
    worker_id, condition, experiment, user = processWorkerIDAndExperiment(survey, request)
    if worker_id== None or condition == None or experiment == None or user == None:
        return redirect(reverse('no_active_survey'))


    question_finished = False

    # Lets create the survey
    questions = get_questions(survey)
    error = ""
    total_questions = len(questions)
    if total_questions < 1:
        return HttpResponseRedirect(reverse('no_active_survey'))

    if request.method == 'POST':
        if 'currentQ' in request.POST:
            current_question_num = int(request.POST['currentQ'])
        else:
            current_question_num = 0

        current_question = questions[current_question_num]

        compressedMouseData = ""
        if 'mouseData' in request.POST:
            mouseData = request.POST['mouseData']
            compressedMouseData = mouseData #zlib.compress(mouseData).decode('latin1')
            question_finished = True

        answer = ""
        if 'answer' in request.POST:
            answer = request.POST['answer']
            question_finished = True

        confidence = 0
        if 'confidence' in request.POST:
            confidence = request.POST['confidence']
        
        try:
            # answer exists
            exp_answer = ExperimentAnswer.objects.get(question=current_question, experiment=experiment, user=user)
            if len(compressedMouseData) > 0:
                exp_answer.mouseData=compressedMouseData
            else:
                exp_answer.answer=answer
                exp_answer.confidence=confidence
            exp_answer.finished=question_finished
            exp_answer.save()

        except ObjectDoesNotExist:
            ExperimentAnswer.objects.create(question=current_question, experiment=experiment, user=user, mouseData=compressedMouseData, answer=answer, confidence=confidence, finished=question_finished)

    return HttpResponse('{"status": "Done"}\n', mimetype="application/json")

@desktop_only
def home(request):
    # Main homepage starts an active survey or else goes to 
    survey = get_active_survey()
    if not survey:
        return redirect(reverse('no_active_survey'))
    
    worker_id, condition, experiment, user = processWorkerIDAndExperiment(survey, request)
    if worker_id== None or condition == None or experiment == None or user == None:
        return redirect(reverse('no_active_survey'))

    # Lets create the survey
    questions = get_questions(survey)
    error = ""
    total_questions = len(questions)
    if total_questions < 1:
        return HttpResponseRedirect(reverse('no_active_survey'))

    #existing_ans = ExperimentAnswer.objects.filter(user=user)
    #questions_answered = ExperimentAnswer.objects.filter(experiment=experiment).count()
    #questions_answered_finished = ExperimentAnswer.objects.filter(experiment=experiment, finished=True).count()

    current_question_num = ExperimentAnswer.objects.filter(experiment=experiment, finished=True).count()
    debugFull = 0
    if "debugFull" in request.GET:
        debugFull = 1

    #print("current_question_num", current_question_num)

    """
    if request.method == 'POST': # If the form has been submitted...
        print("request.method == 'POST'")
        #validate the Current question
        # for now, it means we are done so this is not needed
        if request.POST.has_key('currentQ'):
            currentQ = int(request.POST['currentQ'])-1
            if currentQ != current_question_num:
                current_question_num = int(request.POST['currentQ'])
        answer_text = ""
        if request.POST.has_key('answer'):
            if request.POST.has_key('answer'):
                answer_text = request.POST['answer']
            confidence = 0
            if request.POST.has_key('confidence'):
                confidence = request.POST['confidence']
            current_question = questions[current_question_num-1]

            compressedMouseData = ""
            if request.POST.has_key('mouseData'):
                mouseData = request.POST['mouseData']
                compressedMouseData = zlib.compress(mouseData).decode('latin1')

            try:
                # answer exists
                exp_answer = ExperimentAnswer.objects.get(question=current_question, experiment=experiment, user=user)
                exp_answer.mouseData=compressedMouseData
                exp_answer.answer=answer
                exp_answer.confidence=confidence
                exp_answer.finished=True
                exp_answer.save()
            except ObjectDoesNotExist:
                ExperimentAnswer.objects.create(question=current_question, experiment=experiment, user=user, mouseData=compressedMouseData, answer=answer, confidence=confidence, finished=True)
            # lets move on to the next question
            current_question_num += 1
            
            if current_question_num >= total_questions: # All validation rules pass
                # Check that we are actually done
                expected_answers = SurveyMembership.objects.filter(survey=survey).count()
                actual_answers = ExperimentAnswer.objects.filter(experiment=experiment).count()
                print(current_question_num, total_questions, expected_answers, actual_answers)
                if expected_answers>=actual_answers:
                    if not experiment.finished:
                        experiment.finished = True
                        experiment.save()
                    return HttpResponseRedirect(reverse('done')) # Redirect after POST
                else:
                    experiment.finished = False
                    experiment.save()
            current_question = questions[current_question_num-1]
        else:
            if current_question_num >= total_questions: # All validation rules pass
                # Check that we are actually done
                expected_answers = SurveyMembership.objects.filter(survey=survey).count()
                actual_answers = ExperimentAnswer.objects.filter(experiment=experiment).count()
                print(current_question_num, total_questions, expected_answers, actual_answers)
                if expected_answers>=actual_answers:
                    if not experiment.finished:
                        experiment.finished = True
                        experiment.save()
                    return HttpResponseRedirect(reverse('done')) # Redirect after POST
                else:
                    experiment.finished = False
                    experiment.save()
            compressedMouseData = ""
            if request.POST.has_key('mouseData'):
                mouseData = request.POST['mouseData']
                compressedMouseData = zlib.compress(mouseData).decode('latin1')
                current_question = questions[current_question_num-1]
                try:
                    # answer exists
                    exp_answer = ExperimentAnswer.objects.get(question=current_question, experiment=experiment, user=user)
                    exp_answer.mouseData=compressedMouseData
                    exp_answer.answer=None
                    exp_answer.finished=False
                    exp_answer.save()
                except ObjectDoesNotExist:
                    ExperimentAnswer.objects.create(question=current_question, experiment=experiment, user=user, mouseData=compressedMouseData, answer=None, finished=False)
    else:
       if current_question_num >= total_questions: # All validation rules pass
                # Check that we are actually done
                expected_answers = SurveyMembership.objects.filter(survey=survey).count()
                actual_answers = ExperimentAnswer.objects.filter(experiment=experiment).count()
                print(current_question_num, total_questions, expected_answers, actual_answers)
                if actual_answers >= expected_answers:
                    if not experiment.finished:
                        experiment.finished = True
                        experiment.save()
                    return HttpResponseRedirect(reverse('done')) # Redirect after POST
                else:
                    experiment.finished = False
                    experiment.save()
    """
    if current_question_num >= total_questions: # All validation rules pass
            # Check that we are actually done
            #expected_answers = SurveyMembership.objects.filter(survey=survey).count()
            #actual_answers = ExperimentAnswer.objects.filter(experiment=experiment, finished=True).count()
            #print(current_question_num, total_questions, expected_answers, actual_answers)
            #if actual_answers >= expected_answers:
            if not experiment.finished:
                experiment.finished = True
                experiment.save()
            return HttpResponseRedirect(reverse('done')) # Redirect after POST
            #else:
            #    experiment.finished = False
            #    experiment.save()
    #jsonString = '{"question": "how are you?"}'
    #questionData = json.loads(jsonString)
    current_question = questions[current_question_num]
    #if current_question_num > 0:
    #    current_question_num = current_question_num + 1

    #if len(questions) >= current_question_num and current_question_num > 0:
    #    current_question = questions[current_question_num-1]
    #else:
    #    current_question = questions[0]
   # current_question
    return render(request, 'question_v3.html',
                              {'error': error,
                               'user':user,
                               'worker_id':worker_id,
                               'survey':survey,
                               'question_template': current_question.template,
                               'question':current_question.data,
                               'condition': condition,
                               'debug':debugFull,
                               'qnum':current_question_num,
                               'qtotal':total_questions-1 })
    
    #return redirect(reverse('question'))


def done(request):
    if request.session.has_key('worker_id'):
        worker_id = request.session['worker_id']
        user = ExperimentUser.objects.get(worker_id=worker_id)
    else:
        return HttpResponseRedirect(reverse('no_active_survey'))
    
    if request.session.has_key('experiment_id'):
        experiment_id = request.session['experiment_id']
    else:
        return HttpResponseRedirect(reverse('no_active_survey'))

    experiment = get_object_or_404(Experiment, id=experiment_id)
    survey = experiment.survey
    if not experiment.finished:
        return HttpResponseRedirect(reverse('survey')) # Redirect after POST
        
    survey_code = survey.survey_code+str(user.id)
    request.session.flush()
    return render(request, 'done.html', {'survey_code':survey_code}, context_instance=RequestContext(request))

# -- Admin Views --
# ----------------

