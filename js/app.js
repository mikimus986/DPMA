const stopSelect =
    document.getElementById("stopSelect");

const stopPanel =
    document.getElementById("stopPanel");

const stopName =
    document.getElementById("stopName");

const departuresContainer =
    document.getElementById("departures");


async function startApp() {

    try {

        await loadBaseData();

        loadStops();

    } catch (error) {

        console.error(error);

        departuresContainer.innerHTML =
            `<div class="loading">
                Nepodařilo se načíst data.
            </div>`;
    }
}


function loadStops() {

    Object.keys(stopsData)
        .sort()
        .forEach(stop => {

            const option =
                document.createElement("option");

            option.value = stop;

            option.textContent = stop;

            stopSelect.appendChild(option);

        });

}


stopSelect.addEventListener(
    "change",
    () => {

        const stop =
            stopSelect.value;


        if (!stop) {

            stopPanel.classList.add(
                "hidden"
            );

            return;
        }


        stopPanel.classList.remove(
            "hidden"
        );


        stopName.textContent =
            stop;


        renderDepartures(stop);

    }
);


startApp();
