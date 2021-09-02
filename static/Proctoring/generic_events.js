class TabChange {
    constructor(out, params) {
        this.out = out
        this.params = params
        this.total_changed = 0
        this.changed = false
        this.change_state = 'visible'
        this.change_time = []
        this.return_time = []
        this.time_difference = []
        this.time_index = -1

        this.out_data = {
            'event': 'NAN',
            'timestamp': 'NAN',
            'display_msg': true,
            'message': "Do not change your tab"
        }
    }

    start_checking() {

        document.addEventListener("visibilitychange", event => {
            this.state = document.visibilityState
            this.changed = true

            let timeStamp = new Date()

            if((this.state === 'visible') && (this.changed)) {
                this.return_time.push(timeStamp)
                this.out_data['event'] = 'TAB CHANGE VISIBLE'
                this.out_data['timestamp'] = timeStamp    
            }
            else {
                this.change_time.push(timeStamp)
                this.out_data['event'] = 'TAB CHANGE INVISIBLE'
                this.out_data['timestamp'] = timeStamp
                this.time_index += 1
            }

            this.out(this.out_data)
        })
    }


    get_difference_in_sec(end, start) {

        var hrs = end.getHours() - start.getHours();
        var min = end.getMinutes() - start.getMinutes(); 
        var sec = end.getSeconds() - start.getSeconds();  
        
        var hour_carry = 0;
        var minutes_carry = 0;
        if(min < 0){
            min += 60;
            hour_carry += 1;
        }
        hrs = hrs - hour_carry;
        if(sec < 0){
            sec += 60;
            minutes_carry += 1;
        }
        
        min = min - minutes_carry;

        return {'hour': hrs, 'minute': min, 'sec': sec}
    }


    print(message) {console.log(message)}
}


class TabChangeKey {
    constructor(out, params) {
        this.out = out
        this.params = params

        this.out_data = {
            'event': 'NAN',
            'timestamp': 'NAN',
            'display_msg': true,
            'message': "Do not change your tab",
            'beacon': false
        }
    }

    start_checking() {
        parent.window.addEventListener('keydown', event => {
            this.detect_alt_press(event);
            this.detect_windows_press(event);
        })
        
        parent.document.getElementById('client').contentWindow.addEventListener('keydown', event => {
            this.detect_alt_press(event);
            this.detect_windows_press(event);
        })

        window.addEventListener('keydown', event => {
            this.detect_alt_press(event);
            this.detect_windows_press(event);
        })
    }

    detect_alt_press(event) {
        if (event.altKey) {
            let out_data = {
                'event': 'ALT KEYPRESS DETECTED',
                'timestamp': new Date(),
                'display_msg': true,
                'message': 'Dont try changing tabs!',
                'beacon': false
            }

            this.out(out_data)
        }
    }

    detect_windows_press(event) {
        if (event.keyCode === 91) {
            let out_data = {
                'event': 'WINDOWS KEYPRESS DETECTED',
                'timestamp': new Date(),
                'display_msg': true,
                'message': 'Dont try changing tabs!'
            }

            this.out(out_data)
        }
    }

}


class PageLeave{
    constructor(out, params) {
        this.out = out
        this.params = params

        this.out_data = {
            'event': 'PAGE LEAVE',
            'timestamp': 'NAN',
            'display_msg': false,
            'message': "",
            'beacon': true
        }
    }

    start_checking() {
        parent.window.addEventListener('unload', ev => {
            this.out_data['timestamp'] = new Date()
            this.out(this.out_data)
        })
    }
}


class KeyMouseTrap {
    constructor(out, params) {
        this.out = out
        this.params = params

        this.key_traps = 0
        this.left_mouse_traps = 0
        this.right_mouse_traps = 0

        this.out_data = {
            'event': 'PAGE LEAVE',
            'timestamp': 'NAN',
            'display_msg': false,
            'message': '<BEACON>',
            'beacon': true
        }
    }

    start_checking() {
        this.handle_events('click')
        this.handle_events('keydown')
        this.handle_events('contextmenu')
        this.handle_unload()
    }

    handle_events(name) {
        parent.window.addEventListener(name, event => {
            if (name === 'click') this.left_trap_mouse(event)
            if (name === 'keydown') this.trap_key(event)
            if (name === 'contextmenu') this.right_trap_mouse(event)
        })
        
        parent.document.getElementById('client').contentWindow.addEventListener(name, event => {
            if (name === 'click') this.left_trap_mouse(event)
            if (name === 'keydown') this.trap_key(event)
            if (name === 'contextmenu') this.right_trap_mouse(event)
        })

        window.addEventListener(name, event => {
            if (name === 'click') this.left_trap_mouse(event)
            if (name === 'keydown') this.trap_key(event)
            if (name === 'contextmenu') this.right_trap_mouse(event)
        })

        // Array([parent.window, parent.document.getElementById('client').contentWindow, window]).forEach(el => {
        //     console.log(el)
        //     el.addEventListener(name, ev => {
        //         if (name === 'click') left_trap_mouse(ev)
        //         if (name === 'keydown') trap_key(ev)
        //         if (name === 'contextmenu') right_trap_mouse(ev)
        //     })
        // })
    }

    handle_unload() {
        parent.window.addEventListener('unload', ev => {
            this.out_data['event'] = "KEY TRAPS |K"+ this.key_traps +"|L"+ this.left_mouse_traps +"|R" + this.right_mouse_traps
            this.out_data['timestamp'] = new Date()
            this.out(this.out_data)
        })
    }

    // el.addEventListener('contextmenu', function(ev) {
    //     ev.preventDefault();
    //     alert('success!');
    //     return false;
    // }, false);

    left_trap_mouse(event) {this.left_mouse_traps ++}
    right_trap_mouse(event) {this.right_mouse_traps ++}
    trap_key(event) { this.key_traps ++ }

    prevent_right_click_default(event) {
        event.preventDefault()
    }
}