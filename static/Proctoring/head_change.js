class Mediapipe {
    constructor(out, params) {
        this.out = out
        this.params = params

        this.faceDetection = new params['face_detector']({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.0/${file}`
        }});

        this.camera = new params['camera'](params['video_element'], {
        // const camera = new Camera(videoElement, {
            onFrame: async () => {await this.faceDetection.send({image: params['video_element']});},
            width: 200,
            height: 200
        });

        this.faceDetection.setOptions({
            modelSelection: 0,
            minDetectionConfidence: 0.5
        });

        this.faceDetection.onResults(params['on_result'])
        
    }

    start_checking() {
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
        this.head_rotation(result)
        // this.head_rotation(result)
        // this.head_rotation(result)
        // this.head_rotation(result)
        // this.head_rotation(result)
        // this.head_rotation(result)
        // this.head_rotation(result)
        // this.head_rotation(result)
    }

    //co-ordinates: left 123 right 152
    head_rotation(left_cheek, right_cheek, check){
        var dX = left_cheek.x - right_cheek.x;
        var dZ = left_cheek.z - right_cheek.z;
        
        var yaw = Math.atan2(dZ, dX);
        // console.log(yaw)
    
        if(yaw >= 0){
            //condition when turning left
            if(yaw<=headrotationangle && check == "right"){
                if (head_buffer_left <= 10){
                    head_buffer_left++
                    return "good data but buffer not filled"
                }else{
                    // return "left"
                    // $('#qw-form').submit();
                    return "right"
                }
            }else{
                head_buffer_left = 0
                this.out({ 'title': 'A'})
                // console.log("neutral or not the right emotion")
            }
        }else{
            if(yaw<=0){
                //condition when turning right
                if((-1*yaw)<=headrotationangle && check == "left"){
                    if (head_buffer_right <= 10){
                        head_buffer_right++
                        return "good data but buffer not filled"
                    }else{
                        // return "right"
                        // $('#qw-form').submit();
                        return "left"
                    }
                }else{
                    head_buffer_right = 0
                    return "neutral"
                    // console.log("neutral or not the right emotion")
                }
            }
        }
    }
}
