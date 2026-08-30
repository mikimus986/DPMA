/* =========================================
   DPMA ONLINE
   TRIPS.JS – FINÁLNÍ VERZE
   + AUTOMATICKÝ VÝPOČET VOZIDEL
========================================= */


/* =========================================
   ULOŽENÉ SPOJE
========================================= */

const allTrips = new Map();


/* =========================================
   VOZIDLA SPOJŮ
========================================= */

const tripVehicles = new Map();


/* =========================================
   OBRATY
========================================= */

const tripTurnarounds = new Map();


/* =========================================
   VYPOČTENÉ VOZOVÉ PARKY LINEK
========================================= */

const lineFleetPlans = new Map();


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

        const stopTime =
            departureMinutes +
            Number(stop.min || 0);


        stops.push({

            name:
                stop.name,

            time:
                minutesToTime(
                    stopTime
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
   VYTVOŘENÍ VŠECH SPOJŮ
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


            if (
                allTrips.has(
                    trip.id
                )
            ) {

                lineTrips.push(
                    allTrips.get(
                        trip.id
                    )
                );

            } else {

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


    /*
        Po vytvoření spojů
        automaticky spočítáme
        potřebný počet vozidel.
    */

    calculateRequiredVehicles(
        lineData,
        lineTrips
    );


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
   KONEČNÁ
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
   OPAČNÝ SMĚR
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
   NÁSLEDUJÍCÍ SPOJ
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


            let nextTrip =
                allTrips.get(
                    tripId
                );


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
   AUTOMATICKÝ VÝPOČET POTŘEBNÉHO POČTU VOZŮ
========================================= */

function calculateRequiredVehicles(
    lineData,
    trips
) {

    if (
        !lineData ||
        !trips ||
        trips.length === 0
    ) {

        return null;

    }


    /*
        Seřadíme všechny spoje
        podle odjezdu.
    */

    const sortedTrips =
        [...trips].sort(
            (a, b) => {

                return (
                    timeToMinutes(
                        a.departure
                    ) -
                    timeToMinutes(
                        b.departure
                    )
                );

            }
        );


    /*
        Vozidla, která máme
        momentálně k dispozici.
    */

    const availableVehicles = [];


    /*
        Výsledný plán.
    */

    const vehicles = [];


    /*
        Každý prvek obsahuje:

        vehicleId
        availableAt
        location
        trips
    */


    for (
        const trip
        of sortedTrips
    ) {

        const departureTime =
            timeToMinutes(
                trip.departure
            );


        /*
            Hledáme vozidlo,
            které:

            1. je už na místě odjezdu
            2. přijelo před odjezdem
        */

        let selectedVehicle =
            null;


        let selectedIndex =
            -1;


        for (
            let i = 0;
            i < availableVehicles.length;
            i++
        ) {

            const vehicle =
                availableVehicles[i];


            if (
                vehicle.location ===
                trip.origin &&

                vehicle.availableAt <=
                departureTime
            ) {

                /*
                    Vybereme vozidlo,
                    které čeká nejdéle.
                */

                if (
                    !selectedVehicle ||
                    vehicle.availableAt <
                    selectedVehicle.availableAt
                ) {

                    selectedVehicle =
                        vehicle;

                    selectedIndex =
                        i;

                }

            }

        }


        /*
            Pokud žádné vozidlo
            není k dispozici,
            vytvoříme nové.
        */

        if (!selectedVehicle) {

            selectedVehicle = {

                id:
                    vehicles.length + 1,

                availableAt:
                    0,

                location:
                    trip.origin,

                trips:
                    []

            };


            vehicles.push(
                selectedVehicle
            );

            availableVehicles.push(
                selectedVehicle
            );

        }


        /*
            Přiřadíme vozidlo ke spoji.
        */

        assignTripVehicle(
            trip,
            selectedVehicle
        );


        selectedVehicle.trips.push(
            trip.id
        );


        /*
            Spočítáme příjezd.
        */

        const arrivalTime =
            getTripArrivalTime(
                trip
            );


        const arrivalMinutes =
            timeToMinutes(
                arrivalTime
            );


        /*
            Vozidlo je nyní na
            opačné konečné.
        */

        selectedVehicle.availableAt =
            arrivalMinutes;


        selectedVehicle.location =
            trip.destination;

    }


    /*
        Uložíme výsledek.
    */

    lineFleetPlans.set(
        String(lineData.line),
        vehicles
    );


    console.log(
        `Linka ${lineData.line}: potřebuje ${vehicles.length} vozidel.`
    );


    return vehicles;
}


/* =========================================
   POČET POTŘEBNÝCH VOZIDEL
========================================= */

function getRequiredVehicleCount(
    lineNumber
) {

    const plan =
        lineFleetPlans.get(
            String(lineNumber)
        );


    if (!plan) {
        return 0;
    }


    return plan.length;
}


/* =========================================
   PLÁN VOZIDEL LINKY
========================================= */

function getVehiclePlan(
    lineNumber
) {

    return (
        lineFleetPlans.get(
            String(lineNumber)
        ) || []
    );

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
   OBRAT
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
   CELÝ OBRAT
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

        rotation.push(
            currentTrip
        );


        const nextTrip =
            findNextTrip(
                lineData,
                currentTrip
            );


        if (!nextTrip) {
            break;
        }


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
   SPOJE NA ZASTÁVCE
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
   SEŘAZENÍ
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
   RESET
========================================= */

function resetTrips() {

    allTrips.clear();

    tripVehicles.clear();

    tripTurnarounds.clear();

    lineFleetPlans.clear();

}


/* =========================================
   DEBUG SPOJE
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


/* =========================================
   DEBUG VOZOVÉHO PARKU
========================================= */

function debugFleet(
    lineNumber
) {

    const plan =
        getVehiclePlan(
            lineNumber
        );


    console.log(
        `========== LINKA ${lineNumber} ==========`
    );


    console.log(
        "Potřebný počet vozidel:",
        plan.length
    );


    for (
        const vehicle of plan
    ) {

        console.log(
            "Vozidlo:",
            vehicle.id
        );


        console.log(
            "Počet spojů:",
            vehicle.trips.length
        );


        console.log(
            "Spoje:",
            vehicle.trips
        );

    }


    console.log(
        "================================"
    );

}
