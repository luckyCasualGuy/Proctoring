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
        this.pipe_stated = false
        this.out = out
        this.params = params

        this.head_rotation_angle = 2.9
        this.head_buffer = 0

        this.head_down_buffer = 0
        this.head_away_buffer = 0
        this.missing_person = 0
        this.missing_person_flag = "found"

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

        this.wait = true

        parent.window.addEventListener('unload', ev => {
            if (this.current_head_status !== "NEUTRAL" && this.current_head_status !== 'undefined') {
                let out_data = {
                    "event": this.current_head_status + " END", 
                    "timestamp": new Date(), 
                    "display_msg": false, 
                    'message': "",
                    'beacon': true
                }

                this.out(out_data)
        }

            this.out_data['event'] = ''
            this.out_data['beacon'] = true
            this.out(this.out_data)
            this.out_data['beacon'] = false
        })
    }
    
    get_on_result() {
        return result => {
            this.draw_FM_on_parent(result)
            this.handle_head_status(result)
            this.pipe_stated = true
        }
    }

    handle_head_status(result){
        // this.out({"event": "EVENT", "timestamp": "TIME"})
        if(typeof result.multiFaceLandmarks[0] !== 'undefined'){
            this.missing_person = 0
            if(this.missing_person_flag == "missing"){
                this.missing_person_flag = "found"
                this.out(this.get_out_data("MISSING PERSON", "END"))
            }

            let landmarks = result.multiFaceLandmarks[0]

            let angles = this.calculate_head_rotation_v_h(landmarks)

            let raw_status = this.check_case_for_head_status(angles)
            // console.log(raw_status)

            if((raw_status !== "DOWN BUFFERING") && (raw_status !== "AWAY BUFFERING")){
                this.current_head_status = raw_status
            }

            if(this.previous_head_status !== this.current_head_status){
                //things have changed
                let temp = this.previous_head_status
                this.previous_head_status = this.current_head_status
    
                if (temp !== "NEUTRAL" && temp !== 'undefined') {
                    //send old_end
                    this.out(this.get_out_data(temp, "END"))
                }

                if (this.current_head_status !== "NEUTRAL") {
                    //send new_begin
                    this.out(this.get_out_data(this.current_head_status, "START"))
                }
            }
        }else{
            if (this.missing_person <= 100){
                this.missing_person++
                // console.log("MISSING BUFFERING")
            }else{
                if(this.missing_person_flag == "found"){
                    this.missing_person_flag = "missing"
                    this.out(this.get_out_data("MISSING PERSON", "START"))
                }
                // console.log("MISSING")
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



class TabChange {
    constructor(out, params) {
        this.out = out
        this.params = params
        this.total_changed = 0
        this.changed = false
        this.change_state = 'visible'
        this.change_time = []
        this.return_time = []
        this.time_difference = []
        this.time_index = -1

        this.out_data = {
            'event': 'NAN',
            'timestamp': 'NAN',
            'display_msg': true,
            'message': "Do not change your tab"
        }
    }

    start_checking() {
        console.log(this.params)
        console.log(this.params['parent'])
        console.log(this.params['parent'].document)
        this.params['parent'].document.addEventListener("visibilitychange", event => {
            this.state = this.params['parent'].document.visibilityState
            this.changed = true

            let timeStamp = new Date()

            if((this.state === 'visible') && (this.changed)) {
                this.return_time.push(timeStamp)
                this.out_data['event'] = 'TAB CHANGE VISIBLE'
                this.out_data['timestamp'] = timeStamp
            }
            
            else {
                this.change_time.push(timeStamp)
                this.out_data['event'] = 'TAB CHANGE INVISIBLE'
                this.out_data['timestamp'] = timeStamp
                this.time_index += 1
            }

            this.out(this.out_data)
        })
    }
}


class FocusChange {
    constructor(out, params) {
        this.out = out
        this.params = params

        this.out_data = {
            'event': 'NAN',
            'timestamp': 'NAN',
            'display_msg': true,
            'message': "Do not change your focus",
            'beacon': false
        }

        this.focus_changed = false
        this.window_lost = false
        this.client_lost = false
    }

    start_checking() {
        // client
        this.params['client'].addEventListener('blur', ev => {
            this.client_lost = true

            this.focus_changed = true
            this.out_data['timestamp'] = new Date()
            this.out_data['event'] = 'CLIENT PAGE FOCUS LOST'
            this.out(this.out_data)
        })

        this.params['client'].addEventListener('focus', ev => {
            if (this.window_lost) { 
                this.out_data['timestamp'] = new Date()
                this.out_data['event'] = '*WINDOW PAGE FOCUS GAINED'

                this.window_lost = false
                console.log(this.out_data)
            }
            if (this.focus_changed) {
                this.client_lost = false
                this.out_data['event'] = 'CLIENT PAGE FOCUS GAINED'
                this.out(this.out_data)
            }
        })

        this.params['parent'].addEventListener('unload', ev => {
            if (this.client_lost) {
                this.out_data['event'] = 'CLIENT PAGE FOCUS GAINED'
                this.out_data['beacon'] = true
                this.out(this.out_data)
                this.out_data['beacon'] = false
            }
        })
    }
}


class CopyCutPaste {
    constructor(out, params) {
        this.out = out
        this.params = params

        this.out_data = {
            'event': 'NAN',
            'timestamp': 'NAN',
            'display_msg': true,
            'message': "Do not copy or cut text",
            'beacon': false
        }
    }

    start_checking() {
        var evs = Array.from(['copy', 'cut', 'paste'])
        for (var i in evs) {
            this.params['client'].addEventListener(evs[i], event => {
                console.log('!!!', evs[i])
                if (event['type'] === 'copy') this.out_data['event'] = 'COPY DETECTED'
                if (event['type'] === 'cut') this.out_data['event'] = 'CUT DETECTED'
                if (event['type'] === 'paste') this.out_data['event'] = 'PASTE DETECTED'
                
                console.log(event)

                this.out_data['timestamp'] = new Date()
                this.out(this.out_data)
            })
        }
    }
}


class TabChangeKey {
    constructor(out, params) {
        this.out = out
        this.params = params

        this.out_data = {
            'event': 'NAN',
            'timestamp': 'NAN',
            'display_msg': true,
            'message': "Do not change your tab",
            'beacon': false
        }
    }

    start_checking() {
        this.params['parent'].addEventListener('keydown', event => {
            this.detect_alt_press(event);
            this.detect_windows_press(event);
        })
        
        console.log('setting client keydown')
        this.params['client'].addEventListener('keydown', event => {
            console.log('key down from client')
            this.detect_alt_press(event);
            this.detect_windows_press(event);
        })
    }

    detect_alt_press(event) {
        if (event.altKey) {
            let out_data = {
                'event': 'ALT KEYPRESS DETECTED',
                'timestamp': new Date(),
                'display_msg': true,
                'message': 'Dont try changing tabs!',
                'beacon': false
            }

            this.out(out_data)
        }
    }

    detect_windows_press(event) {
        if (event.keyCode === 91) {
            let out_data = {
                'event': 'WINDOWS KEYPRESS DETECTED',
                'timestamp': new Date(),
                'display_msg': true,
                'message': 'Dont try changing tabs!'
            }

            this.out(out_data)
        }
    }
}


class PageLeave{
    constructor(out, params) {
        this.out = out
        this.params = params

        this.out_data = {
            'event': 'PAGE LEAVE',
            'timestamp': 'NAN',
            'display_msg': false,
            'message': "",
            'beacon': true
        }
    }

    start_checking() {
        this.params['parent'].addEventListener('unload', ev => {
            this.out_data['timestamp'] = new Date()
            this.out(this.out_data)
        })
    }
}



class KeyMouseTrap {
    constructor(out, params) {
        this.out = out
        this.params = params

        this.key_traps = 0
        this.left_mouse_traps = 0
        this.right_mouse_traps = 0

        this.out_data = {
            'event': 'NAN',
            'timestamp': 'NAN',
            'display_msg': false,
            'message': '<BEACON>',
            'beacon': true
        }
    }

    start_checking() {
        this.handle_events('click')
        this.handle_events('keydown')
        this.handle_events('contextmenu')
        this.handle_unload()
    }

    handle_events(name) {
        this.params['parent'].addEventListener(name, event => {
            if (name === 'click') this.left_trap_mouse(event)
            if (name === 'keydown') this.trap_key(event)
            if (name === 'contextmenu') this.right_trap_mouse(event)
        })
        
        this.params['client'].addEventListener(name, event => {
            if (name === 'click') this.left_trap_mouse(event)
            if (name === 'keydown') this.trap_key(event)
            if (name === 'contextmenu') this.right_trap_mouse(event)
        })
    }

    handle_unload() {
        this.params['parent'].addEventListener('unload', ev => {
            this.out_data['event'] = "ALL KEY TRAPS |K"+ this.key_traps 
            this.out_data['timestamp'] = new Date()
            this.out(this.out_data)
            this.out_data['event'] = "LEFT MOUSE TRAPS |L"+ this.left_mouse_traps
            this.out(this.out_data)
            this.out_data['event'] = "RIGHT MOUSE TRAPS |R"+ this.right_mouse_traps
            this.out(this.out_data)
        })
    }

    left_trap_mouse(event) {this.left_mouse_traps ++}
    right_trap_mouse(event) {this.right_mouse_traps ++}
    trap_key(event) { this.key_traps ++ }

    prevent_right_click_default(event) {
        event.preventDefault()
    }
}




class Proctor{
    config = {}
    out = null
    interval = 0
    azyo_end_point = 'http://192.168.0.106:5003/'
    azyo_log_end_point = azyo_end_point + 'log'
    azyo_secret_end_point = azyo_end_point + 'secret_code_check'
    interval = 0
    creds = null

    constructor(config, secret) {
        this.configuration = config
        this.secret = secret
        this._sendSecret(res => {
            if (res['ERROR']) {
                alert('SECRET KEY INVALID')               
                this.start = () => {console.warn('API KEY INVALID', res)}
            }
        })
    }

    pipe() {
        this._add_input_video_to_parent()
        this._add_canvas_to_parent()
        this._register_out()
        this._register_events()
        this._register_mediapipe_events()
        this._set_image_interval()
        // this._set_start()
    }

    start() {
        this.pipe()

        this.EVENT_BASED_TASK.forEach(task => {
            let task_ = new task[0](this.out, task[1])
            task_.start_checking()
        });

        this.mp.start_checking()
    }

    //pipe
    _set_image_interval() {
        setInterval(this._get_on_image_send_interval() , 5000);
    }

    _add_input_video_to_parent() {
        var video_element = this.config['views']['parent'].document.createElement('video')
        video_element.id = 'input_video';
        video_element.style.display = "none";
        this.video_element = video_element;
        this.config['views']['parent'].document.getElementsByTagName('body')[0].prepend(video_element)
    }

    _add_canvas_to_parent() {
        var parent_canvas = this.config['views']['parent'].document.createElement('canvas')
        parent_canvas.id = 'parent_canvas';
        parent_canvas.width = 640;
        parent_canvas.height = 480;
        parent_canvas.style.position = 'fixed';
        parent_canvas.style.right = 15;
        parent_canvas.style.top = 15;
        parent_canvas.style.height = 200; 
        parent_canvas.style.width = 250;
        parent_canvas.styleborder = '10px solid #1c1c1c';
        parent_canvas.style.zIndex = 9;
        parent_canvas.style.cusrsor = 'move';
        parent_canvas.style.display = 'move';
        this._dragElement(parent_canvas);
        this.parent_canvas = parent_canvas
        this.config['views']['parent'].document.getElementsByTagName('body')[0].prepend(parent_canvas)
    }

    _register_mediapipe_events() {
        this.mp = new Mediapipe(this.out, {'camera': Camera ,'face_mesh': FaceMesh, 'on_result': HeadChange, 'video_element': this.video_element, 'out_canvas': this.parent_canvas}) 
    }

    _register_events() {
        var params = {'parent': this.config['views']['parent'], 'client': this.config['views']['frame']}
        this.EVENT_BASED_TASK = [
            [TabChange, params],
            [FocusChange, params],
            [TabChangeKey, params],
            [CopyCutPaste, params],
            [PageLeave, params],
            [KeyMouseTrap, params],
        ];
    }

    _register_out() {
        if(this.creds === null) {throw 'ERROR: credentials not set'}
        this.on_out = this.config['controls']['on_alert']
    }

    _set_start() {
        this.config['controls']['start'].addEventListener('click', ev => { this.start() })
    }

    // setter
    set credentials(creds) {
        var required = {'indentification': String, 'session': String}

        for (const [key, value] of Object.entries(required)) {
            if(!(key in creds)) { throw 'ERROR: ' +  key + ' configuration missing'}
            if((typeof(creds[key]) !== 'string')) { throw 'ERROR: ' + key + ' should be string' }
        }

        this.creds = creds
    }

    set on_out(on_out) {
        this.out = (out_data) => {
            if (out_data["display_msg"]){ on_out(out_data["message"]) }
            
                out_data['roll_no'] = this.creds['indentification']
                out_data['session'] = this.creds['session']
            
                if (out_data['beacon']) {navigator.sendBeacon(this.azyo_end_point, JSON.stringify(out_data));}
                else {this._sendData(out_data, data => console.log('sent sucsessfully', data))}
        }
    }

    set configuration(config) {
        var required = {
            'views': {'parent': Window, 'frame': Window},
            'controls': {'on_alert': Function},
        };
        // var error = this._config_check(required, config);
        // if(!(error === undefined)) { throw error; }

        this.config = config;
    }

    // image send utility (for interval)
    _get_on_image_send_interval() {
        return () => {
            if (this.interval < 10 && this.mp.Result.pipe_stated){
                let pic = this.parent_canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
                let out_data = {
                    'event': 'IMAGE',
                    'image': pic,
                    'timestamp': new Date(),
                    'display_msg': false,
                    'message': "",
                    'beacon': false
                }
                console.log("sent image");
                this.interval += 1
                this.out(out_data)
            }
        }
    }

    // utility send data
    _sendData(out_data, dothis) {
        $.ajax({
            type: "POST",
            enctype: 'JSON',
            url: this.azyo_end_point,
            headers: { 'Access-Control-Allow-Origin': 'http://192.168.0.106:5003/log' },
            data: JSON.stringify(out_data),
            processData: false,
            'contentType': 'application/json',
            cache: false,
            success: data => dothis(data) ,
            error: error => console.error('ERROR SENDING FORM: ', error)
        });
    }

    _sendSecret(dothis) {
        $.ajax({
            type: "POST",
            enctype: 'JSON',
            url: this.azyo_secret_end_point,
            headers: { 'Access-Control-Allow-Origin': 'http://192.168.0.106:5003/log' },
            data: JSON.stringify({'secret': this.secret}),
            processData: false,
            'contentType': 'application/json',
            cache: false,
            success: data => dothis(data) ,
            error: error => console.error('ERROR SENDING FORM: ', error)
        });
    }
    
    //utility checkers
    _config_check(required, config) {
        for (const [key, value] of Object.entries(required)) {
            if(!(key in config)) { return 'ERROR: ' +  key + ' configuration missing'}
            if(!(config[key] instanceof Object)) { return 'ERROR: ' + key + ' should be {}' }

            for (const [key_, value_] of Object.entries(required[key])) {
                if(!(key in config)) { return 'ERROR: ' +  key_ + ' configuration key missing'}
                if(!(config[key][key_] instanceof value_)) { return 'ERROR: ' + key_ + ' should be ' + value_ }
            }
        }     
    }

    //element drag utility
    _dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById(elmnt.id + "header")) {
            // if present, the header is where you move the DIV from:
            document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = dragMouseDown;
        }
    
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }
    
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }
    
        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
}