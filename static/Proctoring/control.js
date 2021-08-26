import TabChange from "../Proctoring/tab_change.js";


const EVENT_BASED_TASK = [
    TabChange
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


EVENT_BASED_TASK.forEach(task => {
    let task_ = new task(out)
    task_.start_checking()
});
