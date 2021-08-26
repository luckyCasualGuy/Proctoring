// import TabChange from "../Proctoring/tab_change.js";
// import { Mediapipe, on_result } from "../Proctoring/head_change.js";

const video_element = parent.document.getElementsByClassName('input_video')[0]
const start_element = document.getElementById('start')


const EVENT_BASED_TASK = [
    [TabChange, {}],
    [Mediapipe, {'camera': Camera ,'face_detector': FaceDetection, 'on_result': Result(out).on_result, 'video_element': video_element}]
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
}

start_element.addEventListener('click', ev => {

    EVENT_BASED_TASK.forEach(task => {
        let task_ = new task[0](out, task[1])
        task_.start_checking()
    });
})
