from picamera import PiCamera
#from espeak import espeak
import cv2 as cv
import argparse
import boto3
import time
import os
import json
import RPi.GPIO as GPIO
from datetime import datetime, date
from boto3.dynamodb.conditions import Key, Attr
import subprocess

dynamodb = boto3.resource('dynamodb', region_name='us-east-2')

table = dynamodb.Table('HotelCustomer')


def recognizeFace(client, image, collection):
    face_matched = False
    with open(image, 'rb') as file:
        response = client.search_faces_by_image(CollectionId=collection, Image={
                                                'Bytes': file.read()}, MaxFaces=1, FaceMatchThreshold=85)
        if (not response['FaceMatches']):
            face_matched = False
        else:
            face_matched = True
    return face_matched, response


def detectFace(frame, face_cascade):
    face_detected = False
    # Detect faces
    faces = face_cascade.detectMultiScale(frame,
                                          scaleFactor=1.1,
                                          minNeighbors=5,
                                          minSize=(30, 30),
                                          flags=cv.CASCADE_SCALE_IMAGE)
    print("Found {0} faces!".format(len(faces)))
    timestr = time.strftime("%Y%m%d-%H%M%S")
    image = '{0}/image_{1}.png'.format(directory, timestr)
    if len(faces) > 0:
        face_detected = True
        cv.imwrite(image, frame)
        print('Your image was saved to %s' % image)

    return face_detected, image


def openLock(): 
    # Set GPIO numbering mode
    GPIO.setmode(GPIO.BOARD)

    # Set pin 11 as an output, and set servo1 as pin 11 as PWM
    GPIO.setup(11,GPIO.OUT)
    servo1 = GPIO.PWM(11,50) # Note 11 is pin, 50 = 50Hz pulse

    #start PWM running, but with value of 0 (pulse off)
    servo1.start(0)
    print ("Waiting for 2 seconds")
    time.sleep(2)

    #servo1.ChangeDutyCycle(6)
    #time.sleep(2)
    servo1.ChangeDutyCycle(10)
    time.sleep(2)
    servo1.ChangeDutyCycle(0)
    time.sleep(2)

    servo1.stop()
    GPIO.cleanup()
    print ("Goodbye")


def closeLock(): 
    # Set GPIO numbering mode
    GPIO.setmode(GPIO.BOARD)

    # Set pin 11 as an output, and set servo1 as pin 11 as PWM
    GPIO.setup(11,GPIO.OUT)
    servo1 = GPIO.PWM(11,50) # Note 11 is pin, 50 = 50Hz pulse

    #start PWM running, but with value of 10 (as it will stop at 10 when door is opened)
    servo1.start(10)
    print ("Waiting for 2 seconds")
    time.sleep(2)

    #servo1.ChangeDutyCycle(6)
    #time.sleep(2)
    servo1.ChangeDutyCycle(1)
    time.sleep(2)
    servo1.ChangeDutyCycle(0)
    time.sleep(2)

    servo1.stop()
    GPIO.cleanup()
    print ("Goodbye")


def main():

    # get args
    parser = argparse.ArgumentParser(description='Facial recognition')
    parser.add_argument(
        '--collection', help='Collection Name', default='hotel-faces')
    parser.add_argument('--face_cascade', help='Path to face cascade.',
                        default='/home/pi/opencv/data/haarcascades/haarcascade_frontalface_alt2.xml')
    parser.add_argument(
        '--camera', help='Camera device number.', type=int, default=0)
    args = parser.parse_args()

    # intialize opencv face detection
    face_cascade_name = args.face_cascade
    face_cascade = cv.CascadeClassifier()

    # Load the cascades
    if not face_cascade.load(cv.samples.findFile(face_cascade_name)):
        print('--(!)Error loading face cascade')
        exit(0)

    camera_device = args.camera

    # Read the video stream
    cam = cv.VideoCapture(camera_device)
    # setting the buffer size and frames per second, to reduce frames in buffer
    cam.set(cv.CAP_PROP_BUFFERSIZE, 1)
    cam.set(cv.CAP_PROP_FPS, 2)

    if not cam.isOpened:
        print('--(!)Error opening video capture')
        exit(0)

    # initialize reckognition sdk
    client = boto3.client('rekognition')

    # today = date.today()

    while True:
        frame = {}
        # calling read() twice as a workaround to clear the buffer.
        cam.read()
        cam.read()
        ret, frame = cam.read()
        if frame is None:
            print('--(!) No captured frame -- Break!')
            break

        face_detected, image = detectFace(frame, face_cascade)

        if (face_detected):
            face_matched, response = recognizeFace(
                client, image, args.collection)
            if (face_matched):
                print('Identity matched %s with %r similarity and %r confidence...' % (response['FaceMatches'][0]['Face']['ExternalImageId'], round(
                    response['FaceMatches'][0]['Similarity'], 1), round(response['FaceMatches'][0]['Face']['Confidence'], 2)))
                #espeak.synth('Hello %s! What is my purpose?' % (
                    #response['FaceMatches'][0]['Face']['ExternalImageId']))
                print('Hello %s! What is my purpose?' %
                      (response['FaceMatches'][0]['Face']['ExternalImageId']))
                currentUser = response['FaceMatches'][0]['Face']['ExternalImageId']
                print(currentUser)
                      
                # print("Movies from 1985")

                response = table.query(
                    KeyConditionExpression=Key('fullName').eq(currentUser)
                )
                print(response['Items'][0]['roomNumber'])

                today = date.today()
                startDate = datetime.strptime(response['Items'][0]['startDate'], '%b %d %Y').date()
                endDate = datetime.strptime(response['Items'][0]['endDate'], '%b %d %Y').date()

                if (response['Items'][0]['roomNumber'] == os.environ['roomNumber']):
                    if (startDate == today):
                        print("This is your room, Welcome!")
                        openLock()
                        subprocess.call("sudo node index.js", shell=True)
                    elif (startDate < today):
                        print("Your stay is not on today")
                    else: 
                        if (today <= endDate): 
                                print("This is your room, welcome!")
                                openLock()
                                subprocess.call("sudo node index.js", shell=True)
                        else: 
                            print("Your stay has been ended. ")
                else: 
                    print("This is not your room, kindly proceed to room " + response['Items'][0]['roomNumber'])

                # for i in response['Items']:
                #     print(i['number'], ":", i['word'])
            else:
                print('Unknown Human Detected!')
                #espeak.synth('Unknown human detected. Who are you stranger?')
            time.sleep(120)

        if cv.waitKey(20) & 0xFF == ord('q'):
            break

    # When everything done, release the capture
    cam.release()
    cv.destroyAllWindows()


dirname = os.path.dirname(__file__)
directory = os.path.join(dirname, 'faces')
main()
