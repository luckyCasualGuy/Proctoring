//co-ordinates: left 123 right 152
let headrotationangle = 2.7
var head_buffer_right = 0
var head_buffer_left = 0

export default function head_rotation(left_cheek, right_cheek, check){
    var dX = left_cheek.x - right_cheek.x;
    var dZ = left_cheek.z - right_cheek.z;
    
    var yaw = Math.atan2(dZ, dX);
    // console.log(yaw)

    if(yaw >= 0){
        //condition when turning left
        if(yaw<=headrotationangle && check == "right"){
            if (head_buffer_left <= 10){
                head_buffer_left++
                return "good data but buffer not filled"
            }else{
                // return "left"
                // $('#qw-form').submit();
                return "right"
            }
        }else{
            head_buffer_left = 0
            return "neutral"
            // console.log("neutral or not the right emotion")
        }
    }else{
        if(yaw<=0){
            //condition when turning right
            if((-1*yaw)<=headrotationangle && check == "left"){
                if (head_buffer_right <= 10){
                    head_buffer_right++
                    return "good data but buffer not filled"
                }else{
                    // return "right"
                    // $('#qw-form').submit();
                    return "left"
                }
            }else{
                head_buffer_right = 0
                return "neutral"
                // console.log("neutral or not the right emotion")
            }
        }
    }
  }