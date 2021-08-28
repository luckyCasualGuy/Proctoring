class Mediapipe {
    constructor(out, params) {
        this.out = out
        this.params = params

        console.log('face detector loaded')
        this.faceDetection = new params['face_detector']({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.3.1620080281/${file}`
        }});
        
        console.log('face detector options set', this.faceDetection)
        this.faceDetection.setOptions({
            modelSelection: 0,
            minDetectionConfidence: 0.5
        });
        
        this.camera = new params['camera'](params['video_element'], {
            // const camera = new Camera(videoElement, {
                onFrame: async () => {
                    // console.log('on frame async');
                    console.log(params['video_element']);
                    await this.faceDetection.send({image: params['video_element']});
                },
                width: 640,
                height: 480
        });
        console.log('camera loaded', this.camera)
            
        console.log('face detector on result set')
        // this.faceDetection.onResults(params['on_result'])
        this.faceDetection.onResults(result => console.log('result'))
        
    }

    start_checking() {
        console.log('camera started')
        this.camera.start()
    }
}


class Result{
    constructor(out) {
        this.out = out
        this.headrotationangle = 2.7
        this.head_buffer_right = 0
        this.head_buffer_left = 0
    }

    on_result(result) {
        console.log('result received')


    }

    //co-ordinates: left 123 right 152
    head_rotation(left_cheek, right_cheek, check){
        var dX = left_cheek.x - right_cheek.x;
        var dZ = left_cheek.z - right_cheek.z;
        var yaw = Math.atan2(dZ, dX);
        
        //condition when turning left
        if(Math.abs(yaw)<=headrotationangle){
            if (head_buffer_left <= 50){
                head_buffer_left++
                return "good data but buffer not filled"
            }else{
                // return "left"
                // $('#qw-form').submit();
                return "right"
            }
        }else{
            head_buffer_left = 0
            return "neutral"
            // console.log("neutral or not the right emotion")
        }
    }
}