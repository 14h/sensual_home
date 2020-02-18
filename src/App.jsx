import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import {useInterval} from "./utils/hooks";

const tensorMapToColor = (t) => {
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

    const ctx = canvasEl.current.getContext('2d');
    //draw image to canvas. scale to target dimensions
    ctx.drawImage(videoEl.current, 0, 0, 96, 54);

    //convert to desired file format
    const dataurl = canvasEl.current.toDataURL();

    const img = new Image();
    img.src = dataurl;
    img.width = 54;
    img.height = 96;

    return img;
};


const fetchAnalizeImage = async (videoEl, canvasEl, setBackgroundColor) => {
    // const image = await fetchImage();
    const image =  await capturePicture(videoEl, canvasEl);


    const model = await tf.loadLayersModel('./model/model.json');




    const imagePixels = tf.browser.fromPixels(image);
    const expandedImage = tf.expandDims(imagePixels);
    const predictionData = await model.predict(expandedImage).data();
    setBackgroundColor(tensorMapToColor(predictionData))

    return predictionData;
};

const initializeVideo = async (videoEl, canvasEl) => {
    const stream = await navigator.mediaDevices.getUserMedia({video: true});

    videoEl.current.srcObject = stream;
    videoEl.current.play();

}

function App() {
    const videoEl = useRef(null);
    const canvasEl = useRef(null);
    const [backgroundColor, setBackgroundColor] = useState('#FFF');

    useInterval(() => fetchAnalizeImage(videoEl, canvasEl, setBackgroundColor), 3000)

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
            <video ref={videoEl} />
            <canvas ref={canvasEl} />
        </div>
    );
}

export default App;
