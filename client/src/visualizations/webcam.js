import React, { useEffect, useState, useRef } from "react";
import Plot from 'react-plotly.js';

const SAMPLING_RATE = 5000; // Calculate engagement score every 5 seconds

const Webcam = () => {
    var state = {
        heatmap: {
            type: 'heatmap',
            z: [[1, 20, 30], [20, 1, 60], [30, 60, 1]],
            name: 'eyegaze',
        },
        heatmapLayout: { 
            xaxis:{title: 'X Axis (Pixels)'},
            yaxis:{title: 'Y Axis (Pixels)'},
            datarevision: 0,
        },
        angry: {
            x: [],
            y: [], 
            name: 'angry',
            line: {shape: 'spline'}
        },
        disgust: {
            x: [],
            y: [], 
            name: 'disgust',
            line: {shape: 'spline'}
        },
        fear: {
            x: [],
            y: [], 
            name: 'fear',
            line: {shape: 'spline'}
        },
        happy: {
            x: [],
            y: [], 
            name: 'happy',
            line: {shape: 'spline'}
        },
        sad: {
            x: [],
            y: [], 
            name: 'sad',
            line: {shape: 'spline'}
        },
        surprise: {
            x: [],
            y: [], 
            name: 'surprise',
            line: {shape: 'spline'}
        },
        neutral: {
            x: [],
            y: [], 
            name: 'neutral',
            line: {shape: 'spline'}
        },
        layout: { 
            xaxis:{title: 'Time (s)'},
            yaxis:{title: 'Emotions (%)'},
            datarevision: 0,
        },
        revision: 0,
        isConnected: false,
        connectionStatus: "Not Connected",
        updateIntervalId: null
    };

    const videoRef = useRef(null);
    const photoRef = useRef(null);
    const stripRef = useRef(null);
    const [emotionsPlot, updateEmotionsPlot] = useState(null);
    const [eyeGazeHeatmap, updateEyeGazeHeatmap] = useState(null);

    useEffect(() => {
        getVideo();
    }, [videoRef]);

    const getVideo = () => {
        navigator.mediaDevices
            .getUserMedia({ video: { width: 300 } })
            .then(stream => {
                let video = videoRef.current;
                video.srcObject = stream;
                video.play();
            })
            .catch(err => {
                console.error("error:", err);
            });
    };

    const paintToCanvas = () => {
        let video = videoRef.current;
        let photo = photoRef.current;
        let ctx = photo.getContext("2d");

        const width = 320;
        const height = 240;
        photo.width = width;
        photo.height = height;

        return setInterval(() => {
            ctx.drawImage(video, 0, 0, width, height);
            var img = ctx.getImageData(0, 0, width, height).data;
            img = Array.from(img)
            getEmotionScore(JSON.stringify(img));
            getEyeGazeHeatmap(JSON.stringify(img));
        }, SAMPLING_RATE);
    };

    const takePhoto = () => {
        let photo = photoRef.current;
        let strip = stripRef.current;

        console.warn(strip);

        const data = photo.toDataURL("image/jpeg");

        console.warn(data);
        const link = document.createElement("a");
        link.href = data;
        link.setAttribute("download", "myWebcam");
        link.innerHTML = `<img src='${data}' alt='thumbnail'/>`;
        strip.insertBefore(link, strip.firstChild);
    };

    function getEmotionScore(img) {
        fetch("http://localhost:5000/getEmotionScore", {
            crossDomain:true,
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: img,
        })
          .then(res => res.json())
          .then(res => {
            const {angry, disgust, fear, happy, sad, surprise, neutral, layout} = state;
            console.log(res)
            // angry, disgust, fear, happy, sad, surprise, neutral
            // var curScore = parseFloat(res['score']);
            var curTime = parseInt(res['timestamp']);
            // {'emotion': {'angry': 0.0009087547195010315, 'disgust': 1.1021758579751944e-09, 'fear': 6.784635155360594e-07, 'happy': 76.04783462907855, 'sad': 0.002571880816411465, 'surprise': 0.0024791463829872784, 'neutral': 23.94620192692257}, 'dominant_emotion': 'happy'}

            if (curTime != -1) {
                var i = angry.x.length - 1;
                while (i >= 0 && angry.x[i] > curTime) {
                    i--;
                }
                angry.x.splice(i + 1, 0, curTime);
                angry.y.splice(i + 1, 0, parseFloat(res['emotion']['angry']));
                angry.line.shape = 'spline';

                disgust.x.splice(i + 1, 0, curTime);
                disgust.y.splice(i + 1, 0, parseFloat(res['emotion']['disgust']));
                disgust.line.shape = 'spline';

                fear.x.splice(i + 1, 0, curTime);
                fear.y.splice(i + 1, 0, parseFloat(res['emotion']['fear']));
                fear.line.shape = 'spline';

                happy.x.splice(i + 1, 0, curTime);
                happy.y.splice(i + 1, 0, parseFloat(res['emotion']['happy']));
                happy.line.shape = 'spline';

                sad.x.splice(i + 1, 0, curTime);
                sad.y.splice(i + 1, 0, parseFloat(res['emotion']['sad']));
                sad.line.shape = 'spline';

                surprise.x.splice(i + 1, 0, curTime);
                surprise.y.splice(i + 1, 0, parseFloat(res['emotion']['surprise']));
                surprise.line.shape = 'spline';

                neutral.x.splice(i + 1, 0, curTime);
                neutral.y.splice(i + 1, 0, parseFloat(res['emotion']['neutral']));
                neutral.line.shape = 'spline';
            }
            state.revision = state.revision + 1;
            layout.datarevision = state.revision + 1;
        });
        updateEmotionsPlot(<Plot
            data={[
                state.angry, state.disgust, state.fear, state.happy, state.sad, state.surprise, state.neutral
            ]}
            layout={state.layout}
            revision={state.revision}
            graphDiv="graph"
        />)
    };
    

    function getEyeGazeHeatmap(img) {
        fetch("http://localhost:5000/getEyeGazeHeatmap", {
            crossDomain:true,
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: img,
        })
        .then(res => res.json())
        .then(res => {
            const {heatmap, heatmapLayout} = state;
            console.log(res)
            heatmap.z = res['data']
            state.revision = state.revision + 1;
            heatmapLayout.datarevision = state.revision + 1;
        });
        updateEyeGazeHeatmap(<Plot
            data={[state.heatmap]}
            layout={state.heatmapLayout}
            // revision={state.revision}
            // graphDiv="graph"
        />)
    }

    return (
        <div>
            <button onClick={() => takePhoto()}>Take a photo</button>
            
            <video onCanPlay={() => paintToCanvas()} ref={videoRef} />
            <canvas ref={photoRef} />
            <div>
                <div ref={stripRef} />
            </div>
            {emotionsPlot}
            {eyeGazeHeatmap}
        </div>
    );
};

export default Webcam;
