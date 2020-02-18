/* global tracking */
import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import {useInterval} from "./utils/hooks";


// TRACKER.setEdgesDensity(0.1);
// TRACKER.setInitialScale(4);
// TRACKER.setStepSize(1);



const tensorMapToColor = (t) => {
    if (!t) return '#FFF';
    const emotion_map = {
        0: '#FF0000',
        1: '#FFFF00',
        2: '#0000FF',
    };

    const i = t.indexOf(Math.max(...t));

    return emotion_map[i];
};

const fetchImage = async () => {
    const response =  await fetch('https://cors-anywhere.herokuapp.com/https://proxy-0.pen.cbsresidential.net:42091/226508cd38cc42d69d6336f9b43fc022/snap.jpg')

    const blob = response.blob();
    const img = new Image();
    const urlCreator = window.URL || window.webkitURL;
    img.src = urlCreator.createObjectURL(blob);
    img.width = 54;
    img.height = 96;

    return img;
};

const capturePicture = async (videoEl, canvasEl) => {
    const ctx = document.getElementById('webcam').getContext('2d');

    // const ctx = canvasEl.current.getContext('2d');

    //draw image to canvas. scale to target dimensions
    console.log(videoEl.current);
    ctx.drawImage(videoEl.current, 0, 0, 85, 64);

    //Convert Image to Greyscale
    const imageData = ctx.getImageData(0, 0, 85, 64);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i]     = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
    }

    ctx.putImageData(imageData, 0, 0);
    //convert to desired file format
    const dataurl = canvasEl.current.toDataURL();

    const img = new Image();
    img.src = dataurl;
    img.width = 54;
    img.height = 96;

    return img;
};

function preprocess_input(im) {
    const img = tf.browser.fromPixels(im, 1).toFloat();
    const offset = tf.scalar(255);
    const x1 = tf.scalar(0.5);
    const x2 = tf.scalar(2);
    const normalized = img.div(offset).sub(x1).mul(x2);

    return normalized.reshape([1, 64, 64, 1]);
}

const fetchAnalizeImage = async (videoEl, canvasEl, setBackgroundColor) => {
    // const image = await fetchImage();
    const image =  await capturePicture(videoEl, canvasEl);

    const model = await tf.loadLayersModel('./model/emotion/model.json');


    // const imagePixels = tf.browser.fromPixels(image);
    // const expandedImage = tf.expandDims(imagePixels);

    // const predictionData = await model.predict(preprocess_input(image)).data();
    const predictionData = null;
    setBackgroundColor(tensorMapToColor(predictionData));

    return predictionData;
};

const initializeVideo = async (videoEl, canvasEl) => {
    if (!videoEl.current) {
        return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({video: true});

    videoEl.current.srcObject = stream;
    videoEl.current.play();

    const webcam = document.getElementById('webcam');
    console.log(webcam);
    const webcamCtx = webcam.getContext('2d');
    webcamCtx.drawImage(
        videoEl.current,
        0,
        0,
        64,
        48
    )


}

function App() {
    const videoEl = useRef(null);
    const canvasEl = useRef(null);
    const [backgroundColor, setBackgroundColor] = useState('#FFF');

    useInterval(() => fetchAnalizeImage(videoEl, canvasEl, setBackgroundColor), 500)
    const TRACKER = new tracking.ObjectTracker();
    TRACKER.classifiers = ['faces'];
    TRACKER.setEdgesDensity(0.1);
    TRACKER.setInitialScale(4);
    TRACKER.setStepSize(1);

    useEffect(() => {
        initializeVideo(videoEl, canvasEl);

    }, []);


    return (
        <div
            className="App"
            style={{
                background: backgroundColor,
                transition: 'all 0.5s linear'
            }}
        >
            <video ref={videoEl}  />
            <canvas ref={canvasEl} />
        </div>
    );
}

export default App;
