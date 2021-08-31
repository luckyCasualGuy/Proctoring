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
            'message': "Do not change your tab"
        }
    }

    start_checking() {
        parent.window.addEventListener('keydown', event => {
            console.log('From window')
            this.detect_alt_press(event);
            this.detect_windows_press(event);
        })
        
        parent.document.getElementById('client').contentWindow.addEventListener('keydown', event => {
            console.log('From client')
            this.detect_alt_press(event);
            this.detect_windows_press(event);
        })

        window.addEventListener('keydown', event => {
            console.log('From Self')
            this.detect_alt_press(event);
            this.detect_windows_press(event);
        })
    }

    detect_alt_press(event) {
        if (event.altKey) {
            let out_data = {
                'event': 'ALT KEYPRESS DETECTED',
                'timestamp': new Date(),
                'message': 'Dont try changing tabs!'
            }

            this.out(out_data)
        }
    }

    detect_windows_press(event) {
        if (event.keyCode === 91) {
            let out_data = {
                'event': 'WINDOWS KEYPRESS DETECTED',
                'timestamp': new Date(),
                'message': 'Dont try changing tabs!'
            }

            this.out(out_data)
        }
    }

}
