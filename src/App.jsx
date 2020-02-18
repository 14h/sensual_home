import React, {useEffect, useRef, useState} from 'react';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import {useInterval} from "./utils/hooks";
import * as tracking from 'tracking';

const TRACKER = new window.tracking.ObjectTracker(['face']);
TRACKER.setEdgesDensity(0.1);
TRACKER.setInitialScale(4);
TRACKER.setStepSize(1);



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
    // var x = rect.x
    // var y = rect.y;
    // var w = rect.width;
    // var h = rect.height;
    //
    // var w_w = $(WEBCAM).width();
    // var w_h = $(WEBCAM).height();
    // var video_w = WEBCAM.videoWidth;
    // var video_h = WEBCAM.videoHeight;
    //
    // var ratio = video_w / w_w;
    // //console.log(ratio);
    //
    // CANVAS_FACE_CTX.drawImage(WEBCAM, x*ratio, y*ratio, w * ratio, h * ratio, 0, 0, 64, 64);
    //

    //draw image to canvas. scale to target dimensions
    ctx.drawImage(videoEl.current, 0, 0, 64, 64);

    //Convert Image to Greyscale
    const imageData = ctx.getImageData(0, 0, 64, 64);
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

    const predictionData = await model.predict(preprocess_input(image)).data();
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
        // tracking.track('#webcam', TRACKER, { camera: true });



        // TRACKER.on('track', function(faces) {
        //
        //     const rect = faces.data[0];
        //     console.log(rect)
        //
        //     // rect.x = rect.x - EXPAND_BOX.x;
        //     // rect.y = rect.y - EXPAND_BOX.y;
        //     // rect.width = rect.width + EXPAND_BOX.w;
        //     // rect.height = rect.height + EXPAND_BOX.h;
        //     //
        //     // drawFaceFrame(rect);
        //     // cropFace(rect);
        //     //
        //     // var result_emotion = getResultEmotion(CANVAS_FACE_GREY);
        //     // var result_gender = getResultGender(CANVAS_FACE_GREY);
        //     // updateResultChart(result_emotion, result_gender);
        // });

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
