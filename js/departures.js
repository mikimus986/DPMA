/* =========================================
   DPMA ONLINE
   AKTUÁLNÍ ODJEZDY
========================================= */


/* =========================================
   ELEMENTY STRÁNKY
========================================= */

let stopSelect = null;
let departuresContainer = null;
let refreshButton = null;
let systemStatus = null;
let lastUpdate = null;


/* =========================================
   INICIALIZACE
========================================= */

function initializeDepartures() {

    stopSelect =
        document.getElementById(
            "stopSelect"
        );

    departuresContainer =
        document.getElementById(
            "departuresContainer"
        );

    refreshButton =
        document.getElementById(
            "refreshButton"
        );

    systemStatus =
        document.getElementById(
            "systemStatus"
        );

    lastUpdate =
        document.getElementById(
            "lastUpdate"
        );


    if (!stopSelect) {

        console.warn(
            "stopSelect nebyl nalezen."
        );

        return;
    }


    if (!departuresContainer) {

        console.warn(
            "departuresContainer nebyl nalezen."
        );

        return;
    }


    /* ==============================
       NASTAVENÍ ZASTÁVEK
    ============================== */

    populateStops();


    /* ==============================
       ZMĚNA ZASTÁVKY
    ============================== */

    stopSelect.addEventListener(
        "change",
        () => {

            renderCurrentStop();

        }
    );


    /* ==============================
       TLAČÍTKO AKTUALIZACE
    ============================== */

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            () => {

                renderCurrentStop();

            }
        );

    }


    /*
        Výchozí zastávka
    */

    const stops =
        getAllStops();


    if (stops.length > 0) {

        stopSelect.value =
            stops[0];

        renderCurrentStop();

    }


    /*
        Automatická aktualizace
        každých 30 sekund.
    */

    setInterval(
        () => {

            renderCurrentStop();

        },
        30000
    );


    setStatus(
        "Systém připraven"
    );
}


/* =========================================
   NASTAVENÍ STATUSU
========================================= */

function setStatus(text) {

    if (systemStatus) {

        systemStatus.textContent =
            text;

    }
}


/* =========================================
   NAPLNĚNÍ SEZNAMU ZASTÁVEK
========================================= */

function populateStops() {

    if (!stopSelect) {
        return;
    }


    const stops =
        getAllStops();


    stopSelect.innerHTML = "";


    const defaultOption =
        document.createElement(
            "option"
        );


    defaultOption.value = "";

    defaultOption.textContent =
        "Vyber zastávku...";


    stopSelect.appendChild(
        defaultOption
    );


    for (const stop of stops) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            stop;

        option.textContent =
            stop;


        stopSelect.appendChild(
            option
        );

    }

}


/* =========================================
   AKTUÁLNÍ ZASTÁVKA
========================================= */

function renderCurrentStop() {

    if (!stopSelect) {
        return;
    }


    const stopName =
        stopSelect.value;


    if (!stopName) {

        departuresContainer.innerHTML =

            `<div class="loading">
                Vyber zastávku.
            </div>`;

        return;
    }


    renderDepartures(
        stopName
    );

}


/* =========================================
   PŘEVOD ČASU NA MINUTY
========================================= */

function getCurrentMinutes() {

    const now =
        new Date();


    return (
        now.getHours() * 60 +
        now.getMinutes()
    );

}


/* =========================================
   ROZDÍL DO ODJEDU
========================================= */

function getMinutesUntil(
    time
) {

    const now =
        getCurrentMinutes();


    let departure =
        timeToMinutes(
            time
        );


    let difference =
        departure - now;


    /*
        Přechod přes půlnoc.
    */

    if (difference < -720) {

        difference += 1440;

    }


    return difference;

}


/* =========================================
   FORMÁT ODPOČTU
========================================= */

function formatCountdown(
    minutes
) {

    if (minutes <= 0) {
        return "nyní";
    }


    if (minutes === 1) {
        return "za 1 min";
    }


    return `za ${minutes} min`;

}


/* =========================================
   ZPOŽDĚNÍ
========================================= */

function generateDelay(
    tripId
) {

    /*
        Zpoždění si uložíme,
        aby se při každém refreshi
        neměnilo.
    */

    const trip =
        activeTrips.get(
            tripId
        );


    if (!trip) {
        return 0;
    }


    if (
        typeof trip.delay !==
        "number"
    ) {

        const delays = [
            0,
            0,
            0,
            0,
            1,
            2,
            3
        ];


        trip.delay =
            delays[
                Math.floor(
                    Math.random() *
                    delays.length
                )
            ];

    }


    return trip.delay;

}


/* =========================================
   TŘÍDA ZPOŽDĚNÍ
========================================= */

function getDelayClass(
    delay
) {

    if (delay <= 0) {
        return "ok";
    }


    if (delay <= 3) {
        return "warning";
    }


    return "bad";

}


/* =========================================
   VYKRESLENÍ ODJEDŮ
========================================= */

function renderDepartures(
    stopName
) {

    if (!departuresContainer) {
        return;
    }


    setStatus(
        "Aktualizuji..."
    );


    const departures =
        getDeparturesAtStop(
            stopName
        );


    const currentMinutes =
        getCurrentMinutes();


    /*
        Vybereme pouze budoucí spoje.
    */

    const upcoming =
        departures.filter(
            trip => {

                const difference =
                    getMinutesUntil(
                        trip.stopTime
                    );


                return difference >= 0;

            }
        );


    /*
        Seřadíme podle času.
    */

    upcoming.sort(
        (a, b) => {

            return (
                timeToMinutes(
                    a.stopTime
                ) -
                timeToMinutes(
                    b.stopTime
                )
            );

        }
    );


    /*
        Pouze 10 nejbližších.
    */

    const visible =
        upcoming.slice(
            0,
            10
        );


    departuresContainer.innerHTML =
        "";


    if (visible.length === 0) {

        departuresContainer.innerHTML =

            `<div class="loading">
                Žádné další odjezdy.
            </div>`;


        setStatus(
            "Žádné další spoje"
        );


        updateLastUpdate();

        return;
    }


    /*
        Vykreslení jednotlivých spojů.
    */

    for (const trip of visible) {

        const element =
            createDepartureElement(
                trip
            );


        departuresContainer.appendChild(
            element
        );

    }


    setStatus(
        `${visible.length} nejbližších spojů`
    );


    updateLastUpdate();

}


/* =========================================
   OBRAT VOZIDLA
========================================= */

function ensureVehicleForTrip(
    trip
) {

    /*
        Už vozidlo máme.
    */

    if (
        tripVehicles.has(
            trip.id
        )
    ) {

        return tripVehicles.get(
            trip.id
        );

    }


    /*
        Zkusíme zjistit,
        jestli vozidlo pokračuje
        z předchozího spoje.
    */

    const line =
        getLine(
            trip.line
        );


    if (line) {

        const directions =
            line.directions;


        for (
            const direction of directions
        ) {

            const trips =
                createTrips(
                    line
                );


            for (
                const previousTrip
                of trips
            ) {

                if (
                    previousTrip.id ===
                    trip.id
                ) {
                    continue;
                }


                const vehicle =
                    tripVehicles.get(
                        previousTrip.id
                    );


                if (!vehicle) {
                    continue;
                }


                const nextTrip =
                    findNextTrip(
                        line,
                        previousTrip
                    );


                if (
                    nextTrip &&
                    nextTrip.id ===
                    trip.id
                ) {

                    tripVehicles.set(
                        trip.id,
                        vehicle
                    );


                    return vehicle;

                }

            }

        }

    }


    /*
        Pokud vozidlo ještě nemáme,
        přidělíme nové.
    */

    return assignVehicleToDeparture(
        trip.id,
        trip.line
    );

}


/* =========================================
   VYTVOŘENÍ ŘÁDKU
========================================= */

function createDepartureElement(
    trip
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "departure";


    const minutes =
        getMinutesUntil(
            trip.stopTime
        );


    const delay =
        generateDelay(
            trip.id
        );


    const vehicle =
        ensureVehicleForTrip(
            trip
        );


    let vehicleHTML =
        "Vozidlo neuvedeno";


    if (vehicle) {

        const air =
            vehicle.airConditioning
                ? "❄️"
                : "";


        vehicleHTML = `

            <div class="vehicle">

                <div>

                    <div class="vehicle-number">
                        ${vehicle.fleetNumber}
                    </div>

                    <div>
                        ${vehicle.type}
                        ${air}
                    </div>

                </div>

            </div>

        `;

    }


    element.innerHTML = `

        <div class="line">
            ${trip.line}
        </div>

        <div class="direction">
            ${trip.destination}
        </div>

        <div class="time">

            <strong>
                ${trip.stopTime}
            </strong>

            <small>
                ${formatCountdown(minutes)}
            </small>

        </div>

        <div class="delay ${getDelayClass(delay)}">

            ${
                delay > 0
                    ? "+" + delay + " min"
                    : "Včas"
            }

        </div>

        ${vehicleHTML}

    `;


    /*
        Kliknutí na spoj.
    */

    element.addEventListener(
        "click",
        () => {

            showDepartureDetails(
                trip,
                vehicle,
                delay
            );

        }
    );


    return element;
}


/* =========================================
   DETAIL SPOJE
========================================= */

function showDepartureDetails(
    trip,
    vehicle,
    delay
) {

    let text =

        `LINKA ${trip.line}\n\n` +

        `Cíl: ${trip.destination}\n` +

        `Odjezd: ${trip.stopTime}\n` +

        `Zpoždění: ${
            delay > 0
                ? "+" + delay + " min"
                : "Včas"
        }`;


    if (vehicle) {

        text +=

            `\n\nVozidlo: ${
                vehicle.fleetNumber
            }` +

            `\nTyp: ${
                vehicle.type
            }` +

            `\nKlimatizace: ${
                vehicle.airConditioning
                    ? "Ano"
                    : "Ne"
            }`;

    }


    alert(text);

}


/* =========================================
   POSLEDNÍ AKTUALIZACE
========================================= */

function updateLastUpdate() {

    if (!lastUpdate) {
        return;
    }


    lastUpdate.textContent =
        "Aktualizováno " +
        new Date().toLocaleTimeString(
            "cs-CZ"
        );

}
