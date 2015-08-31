FROM ubuntu:14.04
MAINTAINER Simon Breslav <simon.breslav@autodesk.com>

RUN apt-get update
RUN apt-get install -y build-essential python-dev python-setuptools gfortran libblas-dev libatlas-dev liblapack-dev libpq-dev default-jre nodejs
RUN easy_install pip
RUN pip install --upgrade distribute
RUN pip install numpy==1.9.2
RUN pip install scipy==0.16.0
RUN pip install psycopg2==2.6.1
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY requirements.txt /usr/src/app/
RUN pip install -r requirements.txt
ADD . /usr/src/app

