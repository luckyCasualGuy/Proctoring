import head_rotation from "./head_rotation.js"
import TabChange from "./tabchange.js";
let start_btn = document.getElementById('start');


function debug(out) {
    let where = document.getElementById('debug_out');
    let p = document.createElement('p');
    p.innerHTML = JSON.stringify(out);
    where.appendChild(p);
    console.log(out)
}
let TC = new TabChange(debug);
TC.set_start(start_btn);

// ==========

let current_events = {"head_status": ""}


start_btn.addEventListener('click', event => {
  // Start all your modules here <even the active tabs>
  camera.start();
  //active .start
});

const videoElement = document.getElementsByClassName('input_video')[0];

function onResults(results) {
  // current_events.head_status = head_rotation(results)
}

const faceDetection = new FaceDetection({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.0/${file}`;
}});
faceDetection.setOptions({
  modelSelection: 0,
  minDetectionConfidence: 0.5
});
faceDetection.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await faceDetection.send({image: videoElement});
  },
  width: 640,
  height: 480
});
