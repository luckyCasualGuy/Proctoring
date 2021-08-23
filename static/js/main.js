import TabChange from "./tabchange";

function debug(out) {
    
    
}

let start = document.getElementById('start');
let TC = new TabChange(debug);
TC.set_start(start);