
current_events = {}

const videoElement = document.getElementsByClassName('input_video')[0];

function start_listeners(){
    // Start all your modules here <even the active tabs>
    camera.start();
    //active .start
}

function onResults(results) {

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
