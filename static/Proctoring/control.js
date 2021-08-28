const start_element = document.getElementById('start')

const result = new Result(out)
const on_result = result.on_result


const EVENT_BASED_TASK = [
    [TabChange, {}],
    // [Mediapipe, {'camera': Camera ,'face_detector': FaceDetection, 'on_result': on_result, 'video_element': video_element}]
];


function out(out_data) {
    let out_html = `
    <div class="card-body out-card">
        <div class="out-title">
            <h5 class="card-title out-title">` + out_data["title"] + `</h5>
        </div>
        <div class="out-time">
            <p><strong>` + out_data['weight'] + `</strong>
            <p><strong>time: </strong>` + out_data['time'] + `</p>
        </div>
    </div>
    `
    let c = document.getElementById('out');
    c.insertAdjacentHTML('beforeend', out_html)

    sendData(out_data, data => console.log('sent sucsessfully', data))
}

start_element.addEventListener('click', ev => {

    EVENT_BASED_TASK.forEach(task => {
        let task_ = new task[0](out, task[1])
        task_.start_checking()
    });
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