const start_element = parent.document.getElementById('start')
const video_element = document.getElementById('input_video')
const parent_canvas = parent.document.getElementById('parent_canvas')
const ALERT = parent.document.getElementById('ALERT')

const EVENT_BASED_TASK = [
    [TabChange, {}],
    [Mediapipe, {'camera': Camera ,'face_detector': FaceDetection, 'on_result': HeadChange, 'video_element': video_element, 'out_canvas': parent_canvas, 'drawing_rectangle': drawRectangle}]
];


function out(out_data) {
    ALERT.innerHTML = "WARNING " + out_data['title'] + " detected!"
    console.log(ALERT)
    out_data['roll_no'] = roll_no_in.value
    sendData(out_data, data => console.log('sent sucsessfully', data))
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