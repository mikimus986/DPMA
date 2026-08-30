const activeTrips = new Map();
const tripVehicles = new Map();

const MAX_DEPARTURES = 10;


/* =========================================
   ČAS
========================================= */

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}


function getCurrentMinutes() {
    const now = new Date();

    return (
        now.getHours() * 60 +
        now.getMinutes()
    );
}


function getCurrentSeconds() {
    const now = new Date();

    return (
        now.getHours() * 3600 +
        now.getMinutes() * 60 +
        now.getSeconds()
    );
}


/* =========================================
   ROZDÍL ČASU
========================================= */

function getMinutesUntil(departureTime) {

    const now = new Date();

    const currentSeconds =
        now.getHours() * 3600 +
        now.getMinutes() * 60 +
        now.getSeconds();

    const [hours, minutes] =
        departureTime.split(":").map(Number);

    let departureSeconds =
        hours * 3600 +
        minutes * 60;

    let difference =
        departureSeconds - currentSeconds;


    // Spoj po půlnoci
    if (difference < -43200) {
        difference += 86400;
    }

    return Math.ceil(difference / 60);
}


/* =========================================
   ZPOŽDĚNÍ
========================================= */

function getDelayClass(delay) {

    if (delay <= 0) {
        return "ok";
    }

    if (delay <= 3) {
        return "warning";
    }

    return "bad";
}


function formatDelay(delay) {

    if (delay <= 0) {
        return "0 min";
    }

    return "+" + delay + " min";
}


/* =========================================
   ODPČET ODJEZDU
========================================= */

function formatDeparture(minutes) {

    if (minutes <= 0) {
        return "nyní";
    }

    if (minutes === 1) {
        return "za 1 min";
    }

    return "za " + minutes + " min";
}


/* =========================================
   ID SPOJE
========================================= */

function createTripId(
    line,
    directionId,
    stopName,
    departure
) {

    return (
        line +
        "_" +
        directionId +
        "_" +
        stopName +
        "_" +
        departure
    );
}


/* =========================================
   ZÍSKÁNÍ SPOJŮ ZE VŠECH LINEK
========================================= */

async function getAllLineDepartures(stopName) {

    const result = [];


    // V současnosti máme načtenou linku 1.
    // Později sem automaticky přidáme všechny
    // linky z data/lines/.

    for (const line of Object.keys(lineData)) {

        const data = lineData[line];

        if (!data || !data.directions) {
            continue;
        }


        for (const direction of data.directions) {

            for (const stop of direction.stops) {

                if (stop.name !== stopName) {
                    continue;
                }


                for (const departure of stop.departures) {

                    result.push({

                        line: line,

                        directionId:
                            direction.id,

                        direction:
                            direction.name,

                        stop:
                            stop.name,

                        platform:
                            stop.platform,

                        departure:
                            departure,

                        tripId:
                            createTripId(
                                line,
                                direction.id,
                                stop.name,
                                departure
                            )

                    });

                }

            }

        }

    }


    return result;
}


/* =========================================
   ZPOŽDĚNÍ SPOJE
========================================= */

function getTripDelay(tripId) {

    if (!activeTrips.has(tripId)) {

        // Zatím simulované zpoždění.
        // Později bude možné zadávat zpoždění
        // přes dispečink.

        const possibleDelays = [
            0,
            0,
            0,
            0,
            1,
            2,
            3
        ];

        const delay =
            possibleDelays[
                Math.floor(
                    Math.random() *
                    possibleDelays.length
                )
            ];


        activeTrips.set(tripId, {

            delay: delay,

            created:
                Date.now()

        });

    }


    return activeTrips.get(tripId).delay;
}


/* =========================================
   VOZIDLO
========================================= */

function getTripVehicle(trip) {

    /*
        Pokud už spoj vozidlo má,
        vrátíme stejné vozidlo.
    */

    if (tripVehicles.has(trip.tripId)) {

        return tripVehicles.get(
            trip.tripId
        );

    }


    /*
        Pokud nemá, vytvoříme nové.
    */

    const vehicle =
        assignVehicleToDeparture(
            trip.tripId,
            trip.line
        );


    if (!vehicle) {
        return null;
    }


    tripVehicles.set(
        trip.tripId,
        vehicle
    );


    return vehicle;
}


/* =========================================
   OBRAT NA KONEČNÉ
========================================= */

function findNextOppositeTrip(
    trip
) {

    const data =
        lineData[trip.line];

    if (!data) {
        return null;
    }


    /*
        Najdeme opačný směr.
    */

    const oppositeDirectionId =
        trip.directionId === "A"
            ? "B"
            : "A";


    const oppositeDirection =
        data.directions.find(
            direction =>
                direction.id ===
                oppositeDirectionId
        );


    if (!oppositeDirection) {
        return null;
    }


    /*
        Najdeme konečnou současného směru.
    */

    const currentDirection =
        data.directions.find(
            direction =>
                direction.id ===
                trip.directionId
        );


    if (!currentDirection) {
        return null;
    }


    const lastStop =
        currentDirection.stops[
            currentDirection.stops.length - 1
        ];


    if (!lastStop) {
        return null;
    }


    /*
        Najdeme poslední čas odjezdu
        z konečné, který odpovídá
        příjezdu vozidla.
    */

    const departures =
        oppositeDirection.stops[0]?.departures;


    if (!departures) {
        return null;
    }


    const currentDeparture =
        timeToMinutes(
            trip.departure
        );


    let nextDeparture = null;


    for (const departure of departures) {

        const minutes =
            timeToMinutes(departure);


        if (
            minutes >
            currentDeparture
        ) {

            nextDeparture =
                departure;

            break;

        }

    }


    if (!nextDeparture) {
        return null;
    }


    return {

        line:
            trip.line,

        directionId:
            oppositeDirection.id,

        direction:
            oppositeDirection.name,

        departure:
            nextDeparture,

        tripId:
            createTripId(
                trip.line,
                oppositeDirection.id,
                oppositeDirection.stops[0].name,
                nextDeparture
            )

    };
}


/* =========================================
   PŘEDÁNÍ VOZIDLA NA DALŠÍ SPOJ
========================================= */

function transferVehicleToNextTrip(
    trip
) {

    const vehicle =
        tripVehicles.get(
            trip.tripId
        );


    if (!vehicle) {
        return;
    }


    const nextTrip =
        findNextOppositeTrip(
            trip
        );


    if (!nextTrip) {
        return;
    }


    /*
        Stejné vozidlo dostane
        následující spoj.
    */

    tripVehicles.set(
        nextTrip.tripId,
        vehicle
    );


    /*
        Starý spoj už vozidlo
        nepotřebuje.
    */

    tripVehicles.delete(
        trip.tripId
    );

}


/* =========================================
   VYTVOŘENÍ ŘÁDKU
========================================= */

function createDepartureElement(
    trip
) {

    const element =
        document.createElement("div");

    element.className =
        "departure";


    const delay =
        getTripDelay(
            trip.tripId
        );


    const minutes =
        getMinutesUntil(
            trip.departure
        );


    const vehicle =
        getTripVehicle(
            trip
        );


    let vehicleHTML =
        "—";


    if (vehicle) {

        const air =
            vehicle.airConditioning
                ? "❄️"
                : "";


        vehicleHTML = `

            <div class="vehicle">

                <div class="vehicle-number">
                    ${vehicle.fleetNumber}
                </div>

                <div>
                    ${vehicle.type}
                    <span class="air">
                        ${air}
                    </span>
                </div>

            </div>

        `;

    }


    const delayClass =
        getDelayClass(
            delay
        );


    element.innerHTML = `

        <div class="line">
            ${trip.line}
        </div>


        <div class="direction">
            ${trip.direction}
        </div>


        <div class="time">
            ${formatDeparture(minutes)}
        </div>


        <div class="delay ${delayClass}">
            ${formatDelay(delay)}
        </div>


        <div class="platform">
            Nást. ${trip.platform}
        </div>


        ${vehicleHTML}

    `;


    /*
        Kliknutí na spoj
    */

    element.addEventListener(
        "click",
        () => {

            showTripDetails(
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

function showTripDetails(
    trip,
    vehicle,
    delay
) {

    let message =

        "Linka " +
        trip.line +
        "\n\n" +

        "Směr: " +
        trip.direction +
        "\n\n" +

        "Odjezd: " +
        trip.departure +
        "\n\n" +

        "Zpoždění: " +
        formatDelay(delay) +
        "\n\n" +

        "Nástupiště: " +
        trip.platform;


    if (vehicle) {

        message +=

            "\n\nVozidlo: " +
            vehicle.fleetNumber +

            "\nTyp: " +
            vehicle.type +

            "\nKlimatizace: " +
            (
                vehicle.airConditioning
                    ? "Ano"
                    : "Ne"
            );

    }


    alert(message);
}


/* =========================================
   HLAVNÍ FUNKCE
========================================= */

async function renderDepartures(
    stopName
) {

    departuresContainer.innerHTML =
        `<div class="loading">
            Načítám odjezdy...
        </div>`;


    const departures =
        await getAllLineDepartures(
            stopName
        );


    const now =
        getCurrentMinutes();


    /*
        Odstraníme spoje,
        které už dávno odjely.
    */

    const upcoming =
        departures.filter(
            trip => {

                const departure =
                    timeToMinutes(
                        trip.departure
                    );


                let difference =
                    departure - now;


                if (difference < -720) {
                    difference += 1440;
                }


                return difference >= 0;

            }
        );


    /*
        Seřadíme podle času.
    */

    upcoming.sort(
        (a, b) => {

            const aTime =
                timeToMinutes(
                    a.departure
                );

            const bTime =
                timeToMinutes(
                    b.departure
                );


            return aTime - bTime;

        }
    );


    /*
        Maximálně 10 odjezdů.
    */

    const visible =
        upcoming.slice(
            0,
            MAX_DEPARTURES
        );


    departuresContainer.innerHTML = "";


    if (visible.length === 0) {

        departuresContainer.innerHTML =

            `<div class="loading">
                Žádné další odjezdy.
            </div>`;

        return;
    }


    for (const trip of visible) {

        const element =
            createDepartureElement(
                trip
            );


        departuresContainer.appendChild(
            element
        );

    }


    document.getElementById(
        "lastUpdate"
    ).textContent =
        "Aktualizováno: " +
        new Date().toLocaleTimeString(
            "cs-CZ"
        );

}


/* =========================================
   AUTOMATICKÁ AKTUALIZACE
========================================= */

setInterval(
    () => {

        const stop =
            stopSelect?.value;


        if (stop) {

            renderDepartures(
                stop
            );

        }

    },
    30000
);
