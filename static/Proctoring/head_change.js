class Mediapipe {
    constructor(out, params) {
        this.out = out
        this.params = params
        
        this.head_change_class = new this.params['on_result'](out,{'out_canvas': this.params["parent_canvas"]})

        this.out = out
        this.headrotationangle = 2.7
        this.head_buffer_right = 0
        this.head_buffer_left = 0

        this.out_canvas = params['out_canvas']
        console.log(this.out_canvas)
        this.out_ctx = params['out_canvas'].getContext('2d')

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
            onFrame: async () => {
                await this.faceDetection.send({image: params['video_element']});
            },
            width: 640,
            height: 480
        });
        console.log('camera loaded', this.camera)
        
        console.log("----------")
        console.log(this.out_ctx)
        this.func = results => {
            this.out_ctx.save()
            this.out_ctx.clearRect(0, 0, this.out_canvas.width, this.out_canvas.height);
            this.out_ctx.drawImage(results.image, 0, 0, this.out_canvas.width, this.out_canvas.height);
            this.out_ctx.restore()
        }


        console.log('face detector on result set')
        this.faceDetection.onResults(this.func)
        
    }

    start_checking() {
        console.log('camera started')
        this.camera.start()
    }

    on_result(results) {
        this.print(results)
    }

    draw_on_parent(results){
        this.out_ctx.save()
        this.out_ctx.clearRect(0, 0, this.out_canvas.width, this.out_canvas.height);
        this.out_ctx.drawImage(results.image, 0, 0, this.out_canvas.width, this.out_canvas.height);
        this.out_ctx.restore()
    }

    print(vari){
        console.log(vari)
    }
}


class HeadChange{
    constructor(out, params) {

    }
    
    on_result(results) {
        console.log('result received')
        this.print("test")
        // this.draw_on_parent(results)
    }

    draw_on_parent(results){
        this.out_ctx.save()
        this.out_ctx.clearRect(0, 0, this.out_canvas.width, this.out_canvas.height);
        this.out_ctx.drawImage(results.image, 0, 0, this.out_canvas.width, this.out_canvas.height);
        this.out_ctx.restore()
    }
    print(vari){
        console.log(vari)
    }

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