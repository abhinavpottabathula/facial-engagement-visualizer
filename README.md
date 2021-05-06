# Facial Engagement Visualizer
Frontend React Client and Backend Flask Server to visualize real-time data inference of a facial webcam feed.
You will need 2 terminal shells, one to run the client and one to run the server.

## Installation

Install server python modules:
`cd server && pip3 install -r requirements.txt`

Install client node modules:
`cd client && npm install`

## Running the Application

Navigate into the server folder and start the server:
`cd server && python3 app.py`

Navigate into the client folder and start the client:
`cd client && npm start`

Now you are free to interact with the web app at `http://localhost:3000/`

## Models, Datasets, Examples

### Emotion
[DeepFace Model](https://pypi.org/project/deepface/)<br/>
[LFW Dataset](https://sefiks.com/2020/08/27/labeled-faces-in-the-wild-for-face-recognition/)<br/>
![Emotion Plot](https://github.com/abhinavpottabathula/facial-engagement-visualizer/blob/master/dashboard_example_images/emotions.png?raw=true)

### Engagement
[Model](https://arxiv.org/abs/1609.01885)<br/>
[Dataset](https://iith.ac.in/~daisee-dataset/)<br/>
[Our Custom Midpoint Dataset](https://drive.google.com/drive/folders/1KQBDLNuSHW25PfT0fpfDISVo12U_iT7o?usp=sharing)<br/>
![Engagement Plot](https://github.com/abhinavpottabathula/facial-engagement-visualizer/blob/master/dashboard_example_images/engagement.png?raw=true)

### EyeGaze
[OpenCV Haarcascades](https://github.com/opencv/opencv/tree/master/data/haarcascades)<br/>
![EyeGaze Plot](https://github.com/abhinavpottabathula/facial-engagement-visualizer/blob/master/dashboard_example_images/eye_gaze.png?raw=true)