function get_images(session, roll_no) {
    $.ajax({
        type: "POST",
        enctype: 'JSON',
        url: "/get_img/",
        data: JSON.stringify({"session":session, "roll_no":roll_no}),
        // data: {"session":session, "roll_no":roll_no},
        processData: false,
        'contentType': 'application/json',
        cache: false,
        success: data => show_images(data),
        error: error => console.error('ERROR SENDING FORM: ', error)
    });
}

var img_holder = document.getElementById("image_disp")

function show_images(data){
    img_holder.innerHtml = ""
    // console.log("requested images")
    // console.log(data)
    let imgs = data.split("||")
    imgs.shift()
    // console.log(imgs)

    for(i in imgs){
        var img_el = document.createElement('img');
        img_el.classList.add("thumbnails")
        img_el.src = imgs[i];
        // img_el.style.flex = "33.33%";
        img_el.style.width = "100%"
        img_el.style.height = "100%"
        // img_el.style.padding = "20px"
        img_holder.appendChild(img_el);
        // img_holder.innerHTML = img_el
    }
}