class Proctor{
    config = {}

    constructor(config) {
        this.configuration = config
        this.pipe()
    }

    pipe() {
        // add dragable canvas to parent document
        // this._add_input_video_to_parent()
        this._add_canvas_to_parent()

    }

    //pipe
    _add_canvas_to_parent() {
        var parent_canvas = this.config['root']['parent'].document.createElement('canvas')
        parent_canvas.id = 'parent_canvas';
        parent_canvas.width = 640;
        parent_canvas.height = 480;
        parent_canvas.style.position = 'fixed';
        parent_canvas.style.right = 15;
        parent_canvas.style.top = 15;
        parent_canvas.style.height = 200; 
        parent_canvas.style.width = 250;
        parent_canvas.styleborder = '10px solid #1c1c1c';
        parent_canvas.style.zIndex = 9;
        parent_canvas.style.cusrsor = 'move';
        parent_canvas.style.display = 'move';
        this._dragElement(parent_canvas);
        this.parent_canvas = parent_canvas
        this.config['root']['parent'].document.getElementsByTagName('body')[0].prepend(parent_canvas)
    }

    // setter
    set configuration(config) {
        var required = {
            'root': {'parent': Window},
            'controls': {'start': Element, 'stop': Element, 'on_alert': Function},
            'credentials': {'indentification': String, 'session': String}
        };
        var error = this._config_check(required, config);
        if(!(error === undefined)) { throw error; }

        this.config = config;
    }

    //utility checkers
    _config_check(required, config) {
        for (const [key, value] of Object.entries(required)) {
            if(!(key in config)) { return 'ERROR: ' +  key + ' configuration missing'}
            if(!(config[key] instanceof Object)) { return 'ERROR: ' + key + ' should be {}' }

            for (const [key_, value_] of Object.entries(required[key])) {
                if(!(key in config)) { return 'ERROR: ' +  key_ + ' configuration key missing'}
                if(!(config[key][key_] instanceof value_)) { return 'ERROR: ' + key_ + ' should be ' + value_ }
            }
        }     
    }

    //element drag utility
    _dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        if (document.getElementById(elmnt.id + "header")) {
            // if present, the header is where you move the DIV from:
            document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
        } else {
            // otherwise, move the DIV from anywhere inside the DIV:
            elmnt.onmousedown = dragMouseDown;
        }
    
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            document.onmousemove = elementDrag;
        }
    
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }
    
        function closeDragElement() {
            // stop moving when mouse button is released:
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }
}