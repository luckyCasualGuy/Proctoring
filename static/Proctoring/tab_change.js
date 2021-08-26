

export default class TabChange {
    constructor(out) {
        this.out = out
        this.total_changed = 0
        this.changed = false
        this.change_state = 'visible'
        this.change_time = []
        this.return_time = []
        this.time_difference = []
        this.time_index = -1

        this.out_data = {
            'title': 'TAB CHANGED',
            'time': 'NAN'
        }
    }

    start_checking() {

        document.addEventListener("visibilitychange", event => {
            this.state = document.visibilityState
            this.changed = true

            let timeStamp = new Date()
            // let timeStamp = event.timeStamp

            if((this.state === 'visible') && (this.changed)) {
                this.return_time.push(timeStamp)
                
                let time_difference = this.get_difference_in_sec(timeStamp, this.change_time[this.time_index])
                this.time_difference.push(time_difference)

                this.out_data['time'] = time_difference['hour'].toString() + ' : ' + time_difference['minute'].toString() + ' : ' + time_difference['sec'].toString()
                this.out_data['weight'] = this.weight_scheme(time_difference)
                this.out(this.out_data)
            }
            else {
                this.change_time.push(timeStamp)
                this.time_index += 1
            }
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


    print(message) {
        console.log(message)
    }



    weight_scheme(time_difference) {
        let weight = 0
        if (time_difference['sec'] < 5) weight = -5
        else if (time_difference['sec'] < 15) weight = -10
        else if (time_difference['sec'] < 25) weight = -20
        else if (time_difference['sec'] < 40) weight = -30
        else weight = -50

        return weight
    }
}
