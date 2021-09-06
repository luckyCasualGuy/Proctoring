const start_element = parent.document.getElementById('start')
const video_element = document.getElementById('input_video')
const parent_canvas = parent.document.getElementById('parent_canvas')
const ALERT = parent.document.getElementById('ALERT')
const alert_wrapper = parent.document.getElementById('alert_wrapper')

const EVENT_BASED_TASK = [
    [TabChange, {}],
    [FocusChange, {}],
    [TabChangeKey, {}],
    [PageLeave, {}],
    [KeyMouseTrap, {}],
    [Mediapipe, {'camera': Camera ,'face_mesh': FaceMesh, 'on_result': HeadChange, 'video_element': video_element, 'out_canvas': parent_canvas}]
];


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
            // visivliy None
            // if (alert_wrapper.style.display != "none"){
            //     alert_wrapper.style.display = "none"
            // }
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

start_element.addEventListener('click', ev => {
    if (ready) {
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