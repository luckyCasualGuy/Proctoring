


export default class TabChange {
    constructor() {

    }

    set_start(start) {
        start.addEventListener('click', ev => {
            document.addEventListener("visibilitychange", event => {
                let debug = document.getElementById('debug');
                debug.append('<p>'+'>>'+ Date.now() +'TAB CHANGED'+'</p><br>');
            })
        })
    }
}


