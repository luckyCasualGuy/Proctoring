// "CLIENT PAGE FOCUS LOST",
// "LOOKING AWAY START",
// "LOOKING DOWN START",
// "MISSING PERSON START",
// "TAB CHANGE INVISIBLE",
// "ALT KEYPRESS DETECTED",
// "KEY TRAPS",
// "LEFT MOUSE TRAPS",
// "PAGE LEAVE",
// "RIGHT MOUSE TRAPS",
// "WINDOWS KEYPRESS DETECTED",

const graph_data = {
    labels: events,
    
    datasets: [{
        label: 'Class Average',
        data: global_avg_per_event,
        fill: true,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgb(255, 99, 132)',
        pointBackgroundColor: 'rgb(255, 99, 132)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(255, 99, 132)'
    }]
};

const config = {
    type: 'radar',
    data: graph_data,
    options: {
        elements: {
            line: {
                borderWidth: 3
            }
        },
        responsive: true,
        plugins: {
        title: {
            display: true,
            text: 'Session Comparision'
        }
        }
    },
};

var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, config)
console.log(myChart.data.datasets)
// console.log("events: ", events)

var student_graph = {
    label: 'Student Data',
    data: [],
    fill: true,
    backgroundColor: 'rgba(54, 162, 235, 0.2)',
    borderColor: 'rgb(54, 162, 235)',
    pointBackgroundColor: 'rgb(54, 162, 235)',
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: 'rgb(54, 162, 235)'
}

function change_graph(stu_data){
    
    // const values = []
    // for(value in stu_data){
    //     values.push(stu_data[value])
    // }

    const values = stu_data

    student_graph.data = values

    // var myChart = new Chart(ctx, config)

    console.log(myChart.data.datasets)

    myChart.data.datasets[1] = student_graph

    myChart.update()
}

function change_graph_old(){

    // var myChart = new Chart(ctx, config)

    console.log(myChart.data.datasets)

    myChart.data.datasets[1] = student_graph

    myChart.update()
}