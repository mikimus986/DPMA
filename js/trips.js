/* =========================================
   DPMA ONLINE
   TRIPS.JS – FINÁLNÍ VERZE
========================================= */


/* =========================================
   ULOŽENÉ SPOJE
========================================= */

const allTrips = new Map();


/* =========================================
   PŘIŘAZENÍ VOZIDEL KE SPOJŮM
========================================= */

const tripVehicles = new Map();


/* =========================================
   VYTVOŘENÉ OBRATY
========================================= */

const tripTurnarounds = new Map();


/* =========================================
   PŘEVOD ČASU
========================================= */

function timeToMinutes(time) {

    const [hours, minutes] =
        time.split(":").map(Number);

    return hours * 60 + minutes;
}


function minutesToTime(minutes) {

    minutes =
        ((minutes % 1440) + 1440) % 1440;

    const hours =
        Math.floor(minutes / 60);

    const mins =
        minutes % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(mins).padStart(2, "0")
    );
}


/* =========================================
   TYP DNE
========================================= */

function getCurrentDayType() {

    const day =
        new Date().getDay();

    /*
        0 = neděle
        6 = sobota
    */

    if (
        day === 0 ||
        day === 6
    ) {

        return "weekends";

    }

    return "workdays";
}


/* =========================================
   VYTVOŘENÍ SPOJE
========================================= */

function buildTrip(
    lineData,
    direction,
    departure
) {

    const departureMinutes =
        timeToMinutes(
            departure
        );


    const stops = [];


    for (
        const stop of direction.stops
    ) {

        const arrivalMinutes =
            departureMinutes +
            Number(stop.min || 0);


        stops.push({

            name:
                stop.name,

            time:
                minutesToTime(
                    arrivalMinutes
                ),

            offset:
                Number(
                    stop.min || 0
                )

        });

    }


    const tripId =
        `${lineData.line}_${direction.id}_${departure}`;


    return {

        id:
            tripId,

        line:
            String(lineData.line),

        directionId:
            direction.id,

        origin:
            direction.origin,

        destination:
            direction.destination,

        departure:
            departure,

        stops:
            stops,

        vehicle:
            null,

        delay:
            null

    };
}


/* =========================================
   VYTVOŘENÍ VŠECH SPOJŮ LINKY
========================================= */

function createTrips(
    lineData
) {

    if (
        !lineData ||
        !lineData.directions
    ) {

        return [];

    }


    const dayType =
        getCurrentDayType();


    const lineTrips = [];


    for (
        const direction
        of lineData.directions
    ) {

        const timetable =
            direction
                .timetable
                ?. [dayType];


        if (
            !Array.isArray(
                timetable
            )
        ) {

            continue;

        }


        for (
            const departure
            of timetable
        ) {

            const trip =
                buildTrip(
                    lineData,
                    direction,
                    departure
                );


            /*
                Pokud spoj už existuje,
                použijeme ten původní.
            */

            if (
                allTrips.has(
                    trip.id
                )
            ) {

                const existing =
                    allTrips.get(
                        trip.id
                    );

                lineTrips.push(
                    existing
                );

            }

            else {

                allTrips.set(
                    trip.id,
                    trip
                );

                lineTrips.push(
                    trip
                );

            }

        }

    }


    return lineTrips;
}


/* =========================================
   VŠECHNY SPOJE
========================================= */

function getAllTrips() {

    return Array.from(
        allTrips.values()
    );

}


/* =========================================
   SPOJE LINKY
========================================= */

function getAllTripsForLine(
    lineData
) {

    if (!lineData) {
        return [];
    }


    return createTrips(
        lineData
    );

}


/* =========================================
   NAJÍT SPOJ
========================================= */

function findTrip(
    tripId
) {

    return (
        allTrips.get(
            tripId
        ) || null
    );

}


/* =========================================
   PŘÍJEZD NA KONEČNOU
========================================= */

function getTripArrivalTime(
    trip
) {

    if (
        !trip ||
        !trip.stops ||
        trip.stops.length === 0
    ) {

        return null;

    }


    return trip.stops[
        trip.stops.length - 1
    ].time;

}


/* =========================================
   KONEČNÁ SPOJE
========================================= */

function getTripFinalStop(
    trip
) {

    if (
        !trip ||
        !trip.stops ||
        trip.stops.length === 0
    ) {

        return null;

    }


    return trip.stops[
        trip.stops.length - 1
    ].name;

}


/* =========================================
   NAJÍT OPAČNÝ SMĚR
========================================= */

function getOppositeDirection(
    lineData,
    trip
) {

    if (
        !lineData ||
        !trip
    ) {

        return null;

    }


    /*
        Pokud máme A → hledáme B.
        Pokud máme B → hledáme A.
    */

    const oppositeId =
        trip.directionId === "A"
            ? "B"
            : "A";


    return lineData.directions.find(
        direction =>
            direction.id ===
            oppositeId
    ) || null;

}


/* =========================================
   NAJÍT NÁSLEDUJÍCÍ SPOJ
========================================= */

function findNextTrip(
    lineData,
    trip
) {

    if (
        !lineData ||
        !trip
    ) {

        return null;

    }


    /*
        Obrat může nastat pouze
        na konečné.
    */

    const arrivalTime =
        getTripArrivalTime(
            trip
        );


    if (!arrivalTime) {
        return null;
    }


    const arrivalMinutes =
        timeToMinutes(
            arrivalTime
        );


    const oppositeDirection =
        getOppositeDirection(
            lineData,
            trip
        );


    if (!oppositeDirection) {
        return null;
    }


    const dayType =
        getCurrentDayType();


    const timetable =
        oppositeDirection
            .timetable
            ?. [dayType];


    if (
        !Array.isArray(
            timetable
        )
    ) {

        return null;

    }


    /*
        Hledáme první odjezd
        po příjezdu vozidla.
    */

    for (
        const departure
        of timetable
    ) {

        const departureMinutes =
            timeToMinutes(
                departure
            );


        if (
            departureMinutes >=
            arrivalMinutes
        ) {

            const tripId =
                `${lineData.line}_${oppositeDirection.id}_${departure}`;


            /*
                Nejprve zkusíme existující spoj.
            */

            let nextTrip =
                allTrips.get(
                    tripId
                );


            /*
                Pokud ještě neexistuje,
                vytvoříme ho.
            */

            if (!nextTrip) {

                nextTrip =
                    buildTrip(
                        lineData,
                        oppositeDirection,
                        departure
                    );


                allTrips.set(
                    nextTrip.id,
                    nextTrip
                );

            }


            return nextTrip;

        }

    }


    return null;
}


/* =========================================
   PŘIŘAZENÍ VOZIDLA
========================================= */

function assignTripVehicle(
    trip,
    vehicle
) {

    if (
        !trip ||
        !vehicle
    ) {

        return false;

    }


    trip.vehicle =
        vehicle;


    tripVehicles.set(
        trip.id,
        vehicle
    );


    return true;
}


/* =========================================
   VOZIDLO SPOJE
========================================= */

function getTripVehicle(
    trip
) {

    if (!trip) {
        return null;
    }


    return (
        tripVehicles.get(
            trip.id
        ) ||
        trip.vehicle ||
        null
    );

}


/* =========================================
   OBRAT VOZIDLA
========================================= */

function createTurnaround(
    lineData,
    trip
) {

    if (
        !lineData ||
        !trip
    ) {

        return null;

    }


    /*
        Pokud jsme obrat už vytvořili,
        vrátíme uložený výsledek.
    */

    if (
        tripTurnarounds.has(
            trip.id
        )
    ) {

        return tripTurnarounds.get(
            trip.id
        );

    }


    const nextTrip =
        findNextTrip(
            lineData,
            trip
        );


    if (!nextTrip) {
        return null;
    }


    const vehicle =
        getTripVehicle(
            trip
        );


    if (!vehicle) {
        return null;
    }


    /*
        STEJNÉ VOZIDLO
        pokračuje na další spoj.
    */

    assignTripVehicle(
        nextTrip,
        vehicle
    );


    tripTurnarounds.set(
        trip.id,
        nextTrip
    );


    return nextTrip;
}


/* =========================================
   VYTVÁŘENÍ CELÉHO OBRATU
========================================= */

function buildVehicleRotation(
    lineData,
    firstTrip,
    maxTrips = 50
) {

    const rotation = [];


    if (
        !lineData ||
        !firstTrip
    ) {

        return rotation;

    }


    let currentTrip =
        firstTrip;


    for (
        let i = 0;
        i < maxTrips;
        i++
    ) {

        /*
            Přidáme současný spoj.
        */

        rotation.push(
            currentTrip
        );


        /*
            Najdeme následující spoj.
        */

        const nextTrip =
            findNextTrip(
                lineData,
                currentTrip
            );


        if (!nextTrip) {
            break;
        }


        /*
            Vozidlo pokračuje.
        */

        const vehicle =
            getTripVehicle(
                currentTrip
            );


        if (vehicle) {

            assignTripVehicle(
                nextTrip,
                vehicle
            );

        }


        /*
            Pokud se vrátíme
            na stejný spoj,
            zabráníme nekonečné smyčce.
        */

        if (
            rotation.some(
                trip =>
                    trip.id ===
                    nextTrip.id
            )
        ) {

            break;

        }


        currentTrip =
            nextTrip;

    }


    return rotation;
}


/* =========================================
   VŠECHNY SPOJE NA ZASTÁVCE
========================================= */

function getTripsAtStop(
    lineData,
    stopName
) {

    if (!lineData) {
        return [];
    }


    const trips =
        getAllTripsForLine(
            lineData
        );


    const result = [];


    for (
        const trip of trips
    ) {

        const stop =
            trip.stops.find(
                currentStop =>
                    currentStop.name ===
                    stopName
            );


        if (!stop) {
            continue;
        }


        result.push({

            ...trip,

            stop:
                stopName,

            stopTime:
                stop.time

        });

    }


    return result;
}


/* =========================================
   SEŘAZENÍ SPOJŮ
========================================= */

function sortTripsByTime(
    trips
) {

    return [
        ...trips
    ].sort(
        (a, b) => {

            return (
                timeToMinutes(
                    a.stopTime ||
                    a.departure
                ) -

                timeToMinutes(
                    b.stopTime ||
                    b.departure
                )
            );

        }
    );

}


/* =========================================
   RESET SYSTÉMU
========================================= */

function resetTrips() {

    allTrips.clear();

    tripVehicles.clear();

    tripTurnarounds.clear();

}


/* =========================================
   DEBUG
========================================= */

function debugTrip(
    trip
) {

    if (!trip) {

        console.log(
            "Spoj neexistuje."
        );

        return;

    }


    console.log(
        "========== SPOJ =========="
    );


    console.log(
        "ID:",
        trip.id
    );


    console.log(
        "Linka:",
        trip.line
    );


    console.log(
        "Směr:",
        trip.origin,
        "→",
        trip.destination
    );


    console.log(
        "Odjezd:",
        trip.departure
    );


    console.log(
        "Příjezd:",
        getTripArrivalTime(
            trip
        )
    );


    console.log(
        "Vozidlo:",
        getTripVehicle(
            trip
        )
    );


    console.log(
        "=========================="
    );

}
