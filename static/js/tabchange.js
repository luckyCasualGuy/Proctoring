
export default class TabChange {
    constructor(debug) {
        this.debug = debug;
    }

    set_start(start) {
        start.addEventListener('click', ev => {
            document.addEventListener("visibilitychange", event => {
                this.debug({'title': 'TAB CHANGED', 'time': Date.now()})
            })
        })
    }
}


