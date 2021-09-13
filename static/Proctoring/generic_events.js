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
}


class FocusChange {
    constructor(out, params) {
        this.out = out
        this.params = params

        this.out_data = {
            'event': 'NAN',
            'timestamp': 'NAN',
            'display_msg': true,
            'message': "Do not change your focus",
            'beacon': false
        }

        this.focus_changed = false
        this.window_lost = false
        this.client_lost = false
    }

    start_checking() {
        // client
        parent.document.getElementById('client').contentWindow.addEventListener('blur', ev => {
            this.client_lost = true

            this.focus_changed = true
            this.out_data['timestamp'] = new Date()
            this.out_data['event'] = 'CLIENT PAGE FOCUS LOST'
            this.out(this.out_data)
        })

        parent.document.getElementById('client').contentWindow.addEventListener('focus', ev => {
            // if (this.window_lost) { 
            //     this.out_data['timestamp'] = new Date()
            //     this.out_data['event'] = '*WINDOW PAGE FOCUS GAINED'

            //     this.window_lost = false
            //     console.log(this.out_data)
            // }
            if (this.focus_changed) {
                this.client_lost = false
                this.out_data['event'] = 'CLIENT PAGE FOCUS GAINED'
                this.out(this.out_data)
            }
        })

        parent.window.addEventListener('unload', ev => {
            if (this.client_lost) {
                this.out_data['event'] = 'CLIENT PAGE FOCUS GAINED'
                this.out_data['beacon'] = true
                this.out(this.out_data)
                this.out_data['beacon'] = false
            }
        })

    }
}


class CopyCutPaste {
    constructor(out, params) {
        this.out = out
        this.params = params

        this.out_data = {
            'event': 'NAN',
            'timestamp': 'NAN',
            'display_msg': true,
            'message': "Do not copy or cut text",
            'beacon': false
        }
    }

    start_checking() {
        var evs = Array.from(['copy', 'cut', 'paste'])
        for (var i in evs) {
            parent.document.getElementById('client').contentWindow.addEventListener(evs[i], event => {
                console.log('!!!', evs[i])
                if (event['type'] === 'copy') this.out_data['event'] = 'COPY DETECTED'
                if (event['type'] === 'cut') this.out_data['event'] = 'CUT DETECTED'
                if (event['type'] === 'paste') this.out_data['event'] = 'PASTE DETECTED'
                
                console.log(event)

                this.out_data['timestamp'] = new Date()
                this.out(this.out_data)
            })
        }
    }
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
            'event': 'NAN',
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
    }

    handle_unload() {
        parent.window.addEventListener('unload', ev => {
            this.out_data['event'] = "ALL KEY TRAPS |K"+ this.key_traps 
            this.out_data['timestamp'] = new Date()
            this.out(this.out_data)
            this.out_data['event'] = "LEFT MOUSE TRAPS |L"+ this.left_mouse_traps
            this.out(this.out_data)
            this.out_data['event'] = "RIGHT MOUSE TRAPS |R"+ this.right_mouse_traps
            this.out(this.out_data)
        })
    }

    left_trap_mouse(event) {this.left_mouse_traps ++}
    right_trap_mouse(event) {this.right_mouse_traps ++}
    trap_key(event) { this.key_traps ++ }

    prevent_right_click_default(event) {
        event.preventDefault()
    }
}

