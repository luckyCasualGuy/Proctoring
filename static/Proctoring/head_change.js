class Mediapipe {
    constructor(out, params) {
        this.out = out
        this.params = params


        this.Result = new this.params['on_result'](this.out, {'out_canvas': parent_canvas})
        this.on_result = this.Result.get_on_result()

        this.out = out
        this.headrotationangle = 2.7
        this.head_buffer_right = 0
        this.head_buffer_left = 0

        this.out_canvas = params['out_canvas']
        this.out_ctx = params['out_canvas'].getContext('2d')

        this.faceDetection = new params['face_detector']({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.3.1620080281/${file}`
        }});
        
        this.faceDetection.setOptions({
            modelSelection: 0,
            minDetectionConfidence: 0.5
        });
        
        this.camera = new params['camera'](params['video_element'], {
            onFrame: async () => {
                await this.faceDetection.send({image: params['video_element']});
            },
            width: 640,
            height: 480
        });
        
        this.faceDetection.onResults(this.on_result)
    }
    
    start_checking() {
        this.camera.start()
    }

}


class HeadChange{
    constructor(out, params) {
        this.out = out
        this.params = params
        this.out_canvas = params['out_canvas']
        this.canvas_ctx = this.out_canvas.getContext('2d')
    }
    
    get_on_result() {
        return result => {
            this.draw_on_parent(result)
            
        }
    }

    draw_on_parent(results){
        this.canvas_ctx.save()
        this.canvas_ctx.clearRect(0, 0, this.out_canvas.width, this.out_canvas.height);
        this.canvas_ctx.drawImage(results.image, 0, 0, this.out_canvas.width, this.out_canvas.height);

        if (results.detections.length > 0) {
            drawRectangle(
                this.canvas_ctx, results.detections[0].boundingBox,
                {color: 'red', lineWidth: 5, fillColor: '#00000000'});
            drawLandmarks(this.canvas_ctx, results.detections[0].landmarks, {
              color: 'red',
              radius: 5,
            });
        }


        this.canvas_ctx.restore()
    }

    print_(vari){console.log(vari)}

    head_rotation(left_cheek, right_cheek, check){
        //co-ordinates: left 123 right 152
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