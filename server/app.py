from flask import Flask, request
from flask_cors import CORS
import json
import time
from PIL import Image
import numpy as np
from matplotlib import pyplot as plt

import cv2
from deepface import DeepFace


app = Flask(__name__)
CORS(app)

startTime = time.time()

@app.route('/getEmotionScore', methods=['POST'])
def getEmotionScore():
    data = request.data # width = 320, height = 240, rgba values, reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
    data = np.array(json.loads(data))
    data = data.reshape((240, 320, 4)).astype('uint8')

    pred = DeepFace.analyze(data, actions=['emotion'])
    pred['timestamp'] = time.time() - startTime

    return pred

@app.route('/getEngagementScore', methods=['POST'])
def getEngagementScore():
    data = request.data # width = 320, height = 240, rgba values, reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
    data = np.array(json.loads(data))
    data = data.reshape((240, 320, 4)).astype('uint8')

    pred = DeepFace.analyze(data, actions=['emotion'])
    pred['timestamp'] = time.time() - startTime

    return pred

@app.route('/getEyeGazeHeatmap', methods=['POST'])
def getEyeGazeHeatmap():
    data = request.data # width = 320, height = 240, rgba values, reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8ClampedArray
    data = np.array(json.loads(data))
    img = data.reshape((240, 320, 4)).astype('uint8')

    # multiple cascades: https://github.com/Itseez/opencv/tree/master/data/haarcascades
    # https://github.com/Itseez/opencv/blob/master/data/haarcascades/haarcascade_frontalface_default.xml
    # https://github.com/Itseez/opencv/blob/master/data/haarcascades/haarcascade_eye.xml
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    for (x,y,w,h) in faces:
        cv2.rectangle(img,(x,y),(x+w,y+h),(255,0,0),2)
        roi_gray = gray[y:y+h, x:x+w]
        roi_color = img[y:y+h, x:x+w]
        
        eyes = eye_cascade.detectMultiScale(roi_gray)
        for (ex,ey,ew,eh) in eyes:
            cv2.rectangle(roi_color,(ex,ey),(ex+ew,ey+eh),(0,255,0),2)

    img = Image.fromarray(img)
    img = img.transpose(method=Image.FLIP_TOP_BOTTOM)
    data = np.array(img)
    data = data[:,:,:1]
    data = data.reshape((240, 320)).tolist()
    pred = json.dumps({'data': data})
    return pred

if __name__ == "__main__":
    app.run(debug=True)