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
    // [CapturePics, {}],
    [Mediapipe, {'camera': Camera ,'face_mesh': FaceMesh, 'on_result': HeadChange, 'video_element': video_element, 'out_canvas': parent_canvas, "start_flag": media_start}]
];

parent.window.addEventListener('message', receiveMessage, false);
console.log('###', parent.window)
function receiveMessage(event) {
    console.log("got event: " + event.data);
}


function out(out_data) {
    let x;
    clearInterval(x)

    if (out_data["display_msg"]){
        ALERT.innerHTML = out_data['message']
        
        if (alert_wrapper.style.display != "flex"){
            alert_wrapper.style.display = "flex"
        }

        // clear interval
        x = setTimeout(2000, () => {
            alert_wrapper.style.display = "none"
        })
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

let interval = 0
setInterval(
    function(){
        console.log(media_start)
        if (interval < 10 && media_start){
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

start_element.addEventListener('click', ev => {
    if (ready) {
        media_start = true
        EVENT_BASED_TASK.forEach(task => {
            let task_ = new task[0](out, task[1])
            task_.start_checking()
        });
    }
})


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