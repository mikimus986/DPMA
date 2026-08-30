/* =========================================
   DPMA ONLINE
   TRIPS.JS
   PŘÍMÉ ČASY ZE SKUTEČNÉHO JÍZDNÍHO ŘÁDU
========================================= */

const allTrips = new Map();
const tripVehicles = new Map();
const tripTurnarounds = new Map();
const lineFleetPlans = new Map();


/* =========================================
   ČAS
========================================= */

function timeToMinutes(time) {

    if (!time) return null;

    const parts =
        time.split(":").map(Number);

    return (
        parts[0] * 60 +
        parts[1]
    );
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
    index
) {

    const stopNames =
        direction.stops;


    const departures =
        direction.departures;


    if (
        !Array.isArray(stopNames)
    ) {
        return null;
    }


    const firstStop =
        stopNames[0];


    const firstTimes =
        departures[firstStop];


    if (
        !Array.isArray(firstTimes) ||
        !firstTimes[index]
    ) {

        return null;

    }


    const departure =
        firstTimes[index];


    const stops = [];


    for (
        const stopName
        of stopNames
    ) {

        const times =
            departures[stopName];


        if (
            !Array.isArray(times)
        ) {
            continue;
        }


        const time =
            times[index];


        if (!time) {
            continue;
        }


        stops.push({

            name:
                stopName,

            time:
                time

        });

    }


    if (
        stops.length === 0
    ) {

        return null;

    }


    const tripId =
        `${lineData.line}_${direction.id}_${departure}_${index}`;


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
   VYTVOŘENÍ SPOJŮ LINKY
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

        /*
            V novém formátu může být
            jízdní řád rozdělen podle dnů.
        */

        let departuresData =
            direction;


        if (
            direction.timetable
        ) {

            departuresData =
                direction.timetable[
                    dayType
                ];

        }


        if (
            !departuresData
        ) {

            continue;

        }


        const stopNames =
            departuresData.stops;


        const departures =
            departuresData.departures;


        if (
            !Array.isArray(
                stopNames
            ) ||
            !departures
        ) {

            continue;

        }


        const firstStop =
            stopNames[0];


        const firstTimes =
            departures[firstStop];


        if (
            !Array.isArray(
                firstTimes
            )
        ) {

            continue;

        }


        for (
            let i = 0;
            i < firstTimes.length;
            i++
        ) {

            const trip =
                buildTripFromData(
                    lineData,
                    direction,
                    departuresData,
                    i
                );


            if (!trip) {
                continue;
            }


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
        spočítáme potřebný počet vozidel.
    */

    calculateRequiredVehicles(
        lineData,
        lineTrips
    );


    return lineTrips;
}


/* =========================================
   VYTVOŘENÍ SPOJE Z DAT
========================================= */

function buildTripFromData(
    lineData,
    direction,
    data,
    index
) {

    const stopNames =
        data.stops;


    const departures =
        data.departures;


    if (
        !Array.isArray(stopNames)
    ) {
        return null;
    }


    const firstStop =
        stopNames[0];


    const firstTimes =
        departures[firstStop];


    if (
        !Array.isArray(firstTimes)
    ) {
        return null;
    }


    const departure =
        firstTimes[index];


    if (!departure) {
        return null;
    }


    const stops = [];


    for (
        const stopName
        of stopNames
    ) {

        const times =
            departures[stopName];


        if (
            !Array.isArray(times)
        ) {
            continue;
        }


        const time =
            times[index];


        if (!time) {
            continue;
        }


        stops.push({

            name:
                stopName,

            time:
                time

        });

    }


    const tripId =
        `${lineData.line}_${direction.id}_${departure}_${index}`;


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
   SPOJ PODLE ID
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


    const opposite =
        getOppositeDirection(
            lineData,
            trip
        );


    if (!opposite) {
        return null;
    }


    /*
        Získáme skutečné spoje
        opačného směru.
    */

    const trips =
        createTrips(
            lineData
        );


    const candidates =
        trips.filter(
            candidate => {

                if (
                    candidate.directionId !==
                    opposite.id
                ) {
                    return false;
                }


                return (
                    timeToMinutes(
                        candidate.departure
                    ) >=
                    arrivalMinutes
                );

            }
        );


    candidates.sort(
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


    return (
        candidates[0] ||
        null
    );

}


/* =========================================
   AUTOMATICKÝ VÝPOČET VOZIDEL
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

        return [];

    }


    /*
        Všechny spoje obou směrů
        seřadíme podle času.
    */

    const sorted =
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


    const vehicles = [];


    /*
        Každé vozidlo obsahuje:

        id
        location
        availableAt
        trips
    */


    for (
        const trip of sorted
    ) {

        const departure =
            timeToMinutes(
                trip.departure
            );


        let selected =
            null;


        /*
            Hledáme vozidlo,
            které už je na místě
            výchozí zastávky.
        */

        for (
            const vehicle
            of vehicles
        ) {

            if (
                vehicle.location ===
                trip.origin &&

                vehicle.availableAt <=
                departure
            ) {

                if (
                    !selected ||
                    vehicle.availableAt <
                    selected.availableAt
                ) {

                    selected =
                        vehicle;

                }

            }

        }


        /*
            Pokud žádné není,
            vytvoříme nové.
        */

        if (!selected) {

            selected = {

                id:
                    vehicles.length + 1,

                location:
                    trip.origin,

                availableAt:
                    0,

                trips:
                    []

            };


            vehicles.push(
                selected
            );

        }


        /*
            Přiřazení spoje.
        */

        selected.trips.push(
            trip.id
        );


        /*
            Vozidlo přijede
            na konečnou.
        */

        const arrival =
            getTripArrivalTime(
                trip
            );


        selected.availableAt =
            timeToMinutes(
                arrival
            );


        selected.location =
            trip.destination;

    }


    lineFleetPlans.set(
        String(lineData.line),
        vehicles
    );


    console.log(
        `Linka ${lineData.line}: ${vehicles.length} vozidel`
    );


    return vehicles;
}


/* =========================================
   POČET VOZIDEL
========================================= */

function getRequiredVehicleCount(
    lineNumber
) {

    const plan =
        lineFleetPlans.get(
            String(lineNumber)
        );


    return plan
        ? plan.length
        : 0;

}


/* =========================================
   PLÁN VOZIDEL
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
   PŘIŘAZENÍ VOZIDLA KE SPOJI
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


    if (
        !vehicle.trips.includes(
            trip.id
        )
    ) {

        vehicle.trips.push(
            trip.id
        );

    }


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
   SPOJE NA ZASTÁVCE
========================================= */

function getTripsAtStop(
    lineData,
    stopName
) {

    const trips =
        getAllTripsForLine(
            lineData
        );


    return trips
        .filter(
            trip =>
                trip.stops.some(
                    stop =>
                        stop.name ===
                        stopName
                )
        )
        .map(
            trip => {

                const stop =
                    trip.stops.find(
                        stop =>
                            stop.name ===
                            stopName
                    );


                return {

                    ...trip,

                    stop:
                        stopName,

                    stopTime:
                        stop.time

                };

            }
        );

}


/* =========================================
   SEŘAZENÍ
========================================= */

function sortTripsByTime(
    trips
) {

    return [...trips].sort(
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
   DEBUG
========================================= */

function debugFleet(
    lineNumber
) {

    const plan =
        getVehiclePlan(
            lineNumber
        );


    console.log(
        `===== LINKA ${lineNumber} =====`
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
            vehicle.trips
        );

    }

}
