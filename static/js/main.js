import TabChange from "./tabchange.js";

let out = document.getElementById('debug_out');
function debug(out) {
    let p = document.createElement('p');
    p.innerHTML = out
}

let start = document.getElementById('start');
let TC = new TabChange(debug);
TC.set_start(start);