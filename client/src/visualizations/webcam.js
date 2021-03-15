import React, { useEffect, useState, useRef } from "react";
import Plot from 'react-plotly.js';

const SAMPLING_RATE = 5000; // Calculate engagement score every 5 seconds

const Webcam = () => {
    var state = {
        line1: {
            x: [],
            y: [], 
            name: 'LSL',
            line: {shape: 'spline'}
        },
        layout: { 
            xaxis:{title: 'Time'},
            yaxis:{title: 'Engagement Score'},
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
    const [plot, updatePlot] = useState(null);

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
            let img = ctx.getImageData(0, 0, width, height).data;
            getScore(JSON.stringify(img));
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

    function getScore(img) {
        fetch("http://localhost:5000/getScore", {
            crossDomain:true,
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: img,
        })
          .then(res => res.json())
          .then(res => {
            const { line1, layout} = state;
            var curScore = parseFloat(res['score']);
            var curTime = parseInt(res['timestamp']);
            if (curTime != -1) {
              var i = line1.x.length - 1;
              while (i >= 0 && line1.x[i] > curTime) {
                i--;
              }
              line1.x.splice(i + 1, 0, curTime);
              line1.y.splice(i + 1, 0, curScore);
              line1.line.shape = 'spline';
            }
            state.revision = state.revision + 1;
            layout.datarevision = state.revision + 1;
        });
        updatePlot(<Plot
            data={[
                state.line1
            ]}
            layout={state.layout}
            revision={state.revision}
            graphDiv="graph"
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
            {plot}
        </div>
    );
};

export default Webcam;
