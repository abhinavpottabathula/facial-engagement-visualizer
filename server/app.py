from flask import Flask, request
from flask_cors import CORS
import json
import time
from PIL import Image
import numpy as np
from matplotlib import pyplot as plt

import tensorflow as tf
import keras
import tensorflow_hub as hub
import cv2
from deepface import DeepFace


app = Flask(__name__)
CORS(app)

# A reference server's start time for the plot.
startTime = time.time()

@app.route('/getEmotionScore', methods=['POST'])
def getEmotionScore():
    data = request.data
    data = np.array(json.loads(data))

    # Preprocessing
    data = data.reshape((240, 320, 4)).astype('uint8')

    pred = DeepFace.analyze(data, actions=['emotion'])
    pred['timestamp'] = time.time() - startTime

    return pred

@app.route('/getEngagementScore', methods=['POST'])
def getEngagementScore():
    data = request.data
    data = np.array(json.loads(data))
    
    # Preprocessing
    im = data.reshape((240, 320, 4)).astype('uint8')
    im = im[:,:,:3]
    im = cv2.resize(im, IMAGE_SHAPE)
    im = tf.keras.utils.normalize(im)
    im = np.array([im])

    # Predicting
    res = engagement_model.predict(im)[0]

    # Normalizing
    mini = np.min(res)
    if mini <= 0:
        res += np.abs(mini)
    res = tf.keras.utils.normalize(res)[0] * 100

    res = res.astype('float64')
    pred = {'boredom': res[0], 'engagement': res[1], 'confusion': res[2], 'frustration': res[3]}
    pred['timestamp'] = time.time() - startTime

    return json.dumps(pred)

@app.route('/getEyeGazeHeatmap', methods=['POST'])
def getEyeGazeHeatmap():
    data = request.data
    data = np.array(json.loads(data))

    # Preprocessing
    img = data.reshape((240, 320, 4)).astype('uint8')

    # Loading the Facial Cascade classifiers
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    # Looping through the identified face bounding boxes
    for (x,y,w,h) in faces:
        cv2.rectangle(img,(x,y),(x+w,y+h),(255,0,0),2)
        roi_gray = gray[y:y+h, x:x+w]
        roi_color = img[y:y+h, x:x+w]
        
        # Detecting eyes within each face bounding box, and adding eye bound boxes
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

# Loading the Engagement Model
engagement_model = None
IMAGE_SHAPE = (299, 299)
NUM_CLASSES = 4 # boredom, engagement, confusion, frustration
model_path = './Models/saved_engagement_model_6.h5'

def load_engagement_model():
    # Get the pretrained model
    classifier_url = 'https://tfhub.dev/google/imagenet/inception_v3/classification/4'
    do_fine_tuning = True
    global engagement_model
    engagement_model = tf.keras.Sequential([
        tf.keras.layers.InputLayer(input_shape=IMAGE_SHAPE + (3,)),
        hub.KerasLayer(classifier_url, trainable=do_fine_tuning),
        tf.keras.layers.Dropout(rate=0.2),
        tf.keras.layers.Dense(NUM_CLASSES,
                            kernel_regularizer=tf.keras.regularizers.l2(0.0001))
    ])
    # Build the new model with the additional layers which fine tune the features for engagement
    engagement_model.build((None,)+IMAGE_SHAPE+(3,))
    keras.models.load_model(model_path, custom_objects={'KerasLayer': hub.KerasLayer})

if __name__ == "__main__":
    load_engagement_model()
    app.run(debug=True)