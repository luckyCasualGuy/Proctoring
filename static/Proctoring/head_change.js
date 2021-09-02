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

        this.head_rotation_angle = 2.9
        this.head_buffer = 0

        this.head_down_buffer = 0
        this.head_away_buffer = 0
        this.missing_person = 0
        this.missing_person_flag = "missing"

        this.previous_head_status
        this.current_head_status

        this.messages = {
            "LOOKING DOWN": "Please don't look down from the screen",
            "LOOKING AWAY": "Please don't look away from the screen",
            "NEUTRAL": false,
            "MISSING PERSON": "Please dont miss"
        }

        this.look_down_flag = 0
        this.look_away_flag = 0

        this.parent_canvas_flag = 0

        this.out_canvas = params['out_canvas']
        this.canvas_ctx = this.out_canvas.getContext('2d')
    }
    
    get_on_result() {
        return result => {
            this.draw_FM_on_parent(result)
            this.handle_head_status(result)
        }
    }

    handle_head_status(result){
        // this.out({"event": "EVENT", "timestamp": "TIME"})
        if(typeof result.multiFaceLandmarks[0] !== 'undefined'){
            this.missing_person = 0
            if(this.missing_person_flag == "missing"){
                this.missing_person_flag = "found"
                this.out(this.get_out_data("MISSING PERSON", "end"))
            }

            let landmarks = result.multiFaceLandmarks[0]

            let angles = this.calculate_head_rotation_v_h(landmarks)

            let raw_status = this.check_case_for_head_status(angles)
            console.log(raw_status)

            if((raw_status !== "DOWN BUFFERING") && (raw_status !== "AWAY BUFFERING") && (raw_status !== "NEUTRAL")){
                this.current_head_status = raw_status
            }

            if(this.previous_head_status !== this.current_head_status){
                //things have changed
                let temp = this.previous_head_status
                this.previous_head_status = this.current_head_status
    
                //send old_end
                this.out(this.get_out_data(temp, "END"))
    
                //send new_begin
                this.out(this.get_out_data(this.current_head_status, "START"))
            }
        }else{
            if (this.missing_person <= 100){
                this.missing_person++
                console.log("MISSING BUFFERING")
            }else{
                if(this.missing_person_flag == "found"){
                    this.missing_person_flag = "missing"
                    this.out(this.get_out_data("MISSING PERSON", "start"))
                }
                console.log("MISSING")
            }
        }
    }

    get_out_data(event, state){
        return {
            "event": event +" "+ state, 
            "timestamp": new Date(), 
            "display_msg": this.messages[event], 
            'message': this.messages[event],
            'beacon': false
        }
            
    }

    check_case_for_head_status(angles){
        
        let v_ang = angles[0]
        let h_ang = angles[1]

        if (v_ang <= -15){
            this.head_away_buffer = 0
            if (this.head_down_buffer <= 100){
                this.head_down_buffer++
                return "DOWN BUFFERING"
            }else{
                return "LOOKING DOWN"
            }
        } else if (v_ang >=20 || h_ang <= -20 || h_ang >= 20){
            this.head_down_buffer = 0
            if (this.head_away_buffer <= 100){
                this.head_away_buffer++
                return "AWAY BUFFERING"
            }else{
                return "LOOKING AWAY"
            }
        } else {
            this.head_away_buffer = 0
            this.head_down_buffer = 0
            return "NEUTRAL"
        }
    }

    calculate_head_rotation_v_h(landmarks){
        var nose_tip = [landmarks[1].x * 640, landmarks[1].y * 360, landmarks[1].z * 640]
        var mid = [(landmarks[234].x + landmarks[454].x) * 320, (landmarks[234].y + landmarks[454].y) * 180, (landmarks[234].z + landmarks[454].z) * 320]
        
        var h_ang = (nose_tip[0] - mid[0])/(nose_tip[2]-mid[2]) * 60
        var v_ang = (nose_tip[1] - mid[1])/(nose_tip[2]-mid[2]) * 60 + 15
        
        return [v_ang, h_ang]
    }

    calculate_head_rotation_away_or_neutral(left_cheek, right_cheek){
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

    flag_checking(){
        if(head_status == "LOOKING DOWN" && this.look_down_flag == 0){
            this.look_down_flag = 1
            this.look_away_flag = 0

            console.log("send look down")
            this.out({"event": "LOOKING DOWN", "timestamp": new Date(), "display_msg": true, 'message': "Please don't look down from the screen",})
        }
        
        if(head_status == "LOOKING AWAY" && this.look_away_flag == 0){
            this.look_away_flag = 1
            this.look_down_flag = 0

            console.log("send look away")
            this.out({"event": "LOOKING AWAY", "timestamp": new Date(), "display_msg": true, 'message': "Please don't look away from the screen",})
        }

        if(head_status == "NEUTRAL" && (this.look_away_flag == 1 || this.look_down_flag == 1)){
            this.look_away_flag = 0
            this.look_down_flag = 0

            console.log("send neutral")
            this.out({"event": "NEUTRAL", "timestamp": new Date(), "display_msg": false})
        }
    }
}

