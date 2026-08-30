function updateClock() {

    const now = new Date();

    const time =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0") +
        ":" +
        now.getSeconds().toString().padStart(2, "0");

    const date =
        now.getDate().toString().padStart(2, "0") +
        "." +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        "." +
        now.getFullYear();


    document.getElementById("currentTime").textContent = time;

    document.getElementById("currentDate").textContent = date;
}


updateClock();

setInterval(updateClock, 1000);
