class Mediapipe {
    constructor(out, params) {
        this.out = out
        this.params = params

        this.Result = new this.params['on_result'](this.out, {'out_canvas': parent_canvas})
        this.on_result = this.Result.get_on_result()

        this.out_canvas = params['out_canvas']
        this.out_ctx = params['out_canvas'].getContext('2d')

        this.faceMesh = new params['face_mesh']({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }});
        
        this.faceMesh.setOptions({
            maxNumFaces: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.camera = new params['camera'](params['video_element'], {
            onFrame: async () => {
                await this.faceMesh.send({image: params['video_element']});
            },
            width: 640,
            height: 480
        });
        
        this.faceMesh.onResults(this.on_result)
    }
    
    start_checking() {
        this.camera.start()
    }

}


class HeadChange{
    constructor(out, params) {
        this.out = out
        this.params = params

        this.out = out
        this.head_rotation_angle = 2.9
        this.head_buffer = 0

        this.look_away_flag = 0

        this.parent_canvas_flag = 0

        this.out_canvas = params['out_canvas']
        this.canvas_ctx = this.out_canvas.getContext('2d')
    }
    
    get_on_result() {
        return result => {
            this.draw_FM_on_parent(result)
            this.check_head_status(result)
        }
    }

    check_head_status(result){
        // this.out({"event": "EVENT", "timestamp": "TIME"})
        if(typeof result.multiFaceLandmarks[0] !== 'undefined'){
            let landmarks = result.multiFaceLandmarks[0]
            let head_status = this.head_rotation(landmarks[123], landmarks[152])
            console.log(head_status)
            
            if(head_status == "LOOKING AWAY" && this.look_away_flag == 0){
                this.look_away_flag = 1

                console.log("send look away")
                this.out({"event": "LOOKING AWAY", "timestamp": new Date(), 'message': "Please don't look away from the screen"})
            }

            if(head_status == "NEUTRAL" && this.look_away_flag == 1){
                this.look_away_flag = 0
                console.log("send neutral")
                this.out({"event": "NEUTRAL", "timestamp": new Date(), 'message': ""})
            }
        }
    }

    head_rotation(left_cheek, right_cheek){
        //co-ordinates: left 123 right 152
        var dX = left_cheek.x - right_cheek.x;
        var dZ = left_cheek.z - right_cheek.z;
        var yaw = Math.atan2(dZ, dX);
        // console.log(yaw)

        //condition when turning left
        if(Math.abs(yaw)<=this.head_rotation_angle){
            if (this.head_buffer <= 100){
                this.head_buffer++
                return "BUFFERING"
            }else{
                // return "left"
                // $('#qw-form').submit()
                return "LOOKING AWAY"
            }
        }else{
            this.head_buffer = 0
            return "NEUTRAL"
            // console.log("neutral or not the right emotion")
        }
    }

    draw_FM_on_parent(results){
        if (this.parent_canvas_flag === 0) {
            this.parent_canvas_flag = 1
            this.params['out_canvas'].style.display = 'block'
        }
        this.canvas_ctx.save()
        this.canvas_ctx.drawImage(results.image, 0, 0, this.out_canvas.width, this.out_canvas.height);
        this.canvas_ctx.restore()
    }

    draw_FD_on_parent(results){
        // let head = this.head_rotation(landmarks[5], landmarks[4])
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
}