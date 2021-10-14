const start_element = parent.document.getElementById('start')
const video_element = document.getElementById('input_video')
const parent_canvas = parent.document.getElementById('parent_canvas')
const ALERT = parent.document.getElementById('ALERT')
const alert_wrapper = parent.document.getElementById('alert_wrapper')
var media_start = false

const EVENT_BASED_TASK = [
    [TabChange, {}],
    [FocusChange, {}],
    [TabChangeKey, {}],
    [CopyCutPaste, {}],
    [PageLeave, {}],
    [KeyMouseTrap, {}],
];

// parent.window.addEventListener('message', receiveMessage, false);
// console.log('###', parent.window)
// function receiveMessage(event) {
//     console.log("got event: " + event.data);
// }


function out(out_data) {

    if (out_data["display_msg"]){

    }

    out_data['roll_no'] = roll_no_in.value
    out_data['session'] = "Sample Examination 2021 Day 1" //FROM CLIENT

    if (out_data['beacon']) {
        navigator.sendBeacon(parent.document.URL, JSON.stringify(out_data));
    }
    else {
        sendData(out_data, data => console.log('sent sucsessfully', data))
    }
}

var mp = null;
start_element.addEventListener('click', ev => {
    if (ready) {
        media_start = true
        EVENT_BASED_TASK.forEach(task => {
            let task_ = new task[0](out, task[1])
            console.log(task_)
            task_.start_checking()
        });

        mp = new Mediapipe(out, {'camera': Camera ,'face_mesh': FaceMesh, 'on_result': HeadChange, 'video_element': video_element, 'out_canvas': parent_canvas, "start_flag": media_start}) 
        mp.start_checking()
    }
})




let interval = 0
setInterval(
    function(){
        // console.log(mp.Result.pipe_stated)
        if (interval < 10 && mp.Result.pipe_stated){
            let pic = parent_canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let out_data = {
                'event': 'IMAGE',
                'image': pic,
                'timestamp': new Date(),
                'display_msg': false,
                'message': "",
                'beacon': false
            }
            // console.log(out_data["image"])
            console.log("sent image");
            interval += 1
            out(out_data)
        }
    }, 
    5000
);


function sendData(out_data, dothis) {
    $.ajax({
        type: "POST",
        enctype: 'JSON',
        url: parent.document.URL,
        data: JSON.stringify(out_data),
        processData: false,
        'contentType': 'application/json',
        cache: false,
        success: data => dothis(data) ,
        error: error => console.error('ERROR SENDING FORM: ', error)
    });
}