/* =========================================
   DPMA ONLINE
   SYSTÉM SPOJŮ A OBRATŮ
========================================= */

const activeTrips = new Map();
const tripVehicles = new Map();


/* =========================================
   POMOCNÉ FUNKCE
========================================= */

function timeToMinutes(time) {
    const [hours, minutes] = time.split(":").map(Number);

    return hours * 60 + minutes;
}


function minutesToTime(minutes) {
    minutes = minutes % 1440;

    if (minutes < 0) {
        minutes += 1440;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(mins).padStart(2, "0")
    );
}


/* =========================================
   PRACOVNÍ DEN / VÍKEND
========================================= */

function getDayType() {
    const day = new Date().getDay();

    if (day === 0 || day === 6) {
        return "weekends";
    }

    return "workdays";
}


/* =========================================
   VYTVOŘENÍ SPOJŮ
========================================= */

function createTrips(lineData) {

    const trips = [];

    if (!lineData || !lineData.directions) {
        return trips;
    }


    const dayType = getDayType();


    for (const direction of lineData.directions) {

        const timetable =
            direction.timetable?.[dayType];

        if (!timetable) {
            continue;
        }


        for (const departure of timetable) {

            const tripId =
                `${lineData.line}_${direction.id}_${departure}`;


            const stops = [];


            for (const stop of direction.stops) {

                const departureMinutes =
                    timeToMinutes(departure);

                const stopTime =
                    departureMinutes + stop.min;


                stops.push({

                    name: stop.name,

                    time:
                        minutesToTime(stopTime),

                    offset:
                        stop.min

                });

            }


            const trip = {

                id: tripId,

                line:
                    lineData.line,

                directionId:
                    direction.id,

                origin:
                    direction.origin,

                destination:
                    direction.destination,

                departure:
                    departure,

                stops:
                    stops

            };


            trips.push(trip);

            activeTrips.set(
                tripId,
                trip
            );

        }

    }


    return trips;
}


/* =========================================
   NALEZENÍ SPOJE
========================================= */

function findTrip(tripId) {
    return activeTrips.get(tripId) || null;
}


/* =========================================
   NALEZENÍ PŘÍJEZDU NA KONEČNOU
========================================= */

function getTripArrivalTime(trip) {

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
   NALEZENÍ DALŠÍHO SPOJE
========================================= */

function findNextTrip(
    lineData,
    trip
) {

    if (!lineData || !trip) {
        return null;
    }


    const oppositeDirectionId =
        trip.directionId === "A"
            ? "B"
            : "A";


    const direction =
        lineData.directions.find(
            d =>
                d.id ===
                oppositeDirectionId
        );


    if (!direction) {
        return null;
    }


    const dayType = getDayType();

    const timetable =
        direction.timetable?.[dayType];


    if (!timetable) {
        return null;
    }


    const arrival =
        timeToMinutes(
            getTripArrivalTime(trip)
        );


    /*
        Vozidlo může pokračovat
        pouze na spoj, který odjíždí
        až po jeho příjezdu.
    */

    for (const departure of timetable) {

        const departureTime =
            timeToMinutes(
                departure
            );


        if (
            departureTime >=
            arrival
        ) {

            return {

                id:
                    `${lineData.line}_${direction.id}_${departure}`,

                line:
                    lineData.line,

                directionId:
                    direction.id,

                origin:
                    direction.origin,

                destination:
                    direction.destination,

                departure:
                    departure

            };

        }

    }


    return null;
}


/* =========================================
   PŘIDĚLENÍ VOZIDLA
========================================= */

function assignTripVehicle(
    trip,
    vehicle
) {

    if (!trip || !vehicle) {
        return;
    }


    tripVehicles.set(
        trip.id,
        vehicle
    );


    trip.vehicle =
        vehicle;

}


/* =========================================
   OBRAT VOZIDLA
========================================= */

function createTurnaround(
    lineData,
    trip
) {

    if (!trip) {
        return null;
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
        tripVehicles.get(
            trip.id
        );


    if (!vehicle) {
        return null;
    }


    /*
        Stejné vozidlo pokračuje
        na opačný směr.
    */

    tripVehicles.set(
        nextTrip.id,
        vehicle
    );


    nextTrip.vehicle =
        vehicle;


    return nextTrip;
}


/* =========================================
   VYTVOŘENÍ CELÉHO OBRĚHU
========================================= */

function buildVehicleRotation(
    lineData,
    firstTrip
) {

    const rotation = [];

    let currentTrip =
        firstTrip;


    if (!currentTrip) {
        return rotation;
    }


    for (let i = 0; i < 20; i++) {

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
            tripVehicles.get(
                currentTrip.id
            );


        if (!vehicle) {
            break;
        }


        tripVehicles.set(
            nextTrip.id,
            vehicle
        );


        nextTrip.vehicle =
            vehicle;


        currentTrip =
            nextTrip;

    }


    return rotation;
}


/* =========================================
   VŠECHNY SPOJE
========================================= */

function getAllTripsForLine(
    lineData
) {

    return createTrips(
        lineData
    );

}


/* =========================================
   SPOJE PRO ZASTÁVKU
========================================= */

function getTripsAtStop(
    lineData,
    stopName
) {

    const trips =
        getAllTripsForLine(
            lineData
        );


    const result = [];


    for (const trip of trips) {

        const stop =
            trip.stops.find(
                s =>
                    s.name ===
                    stopName
            );


        if (!stop) {
            continue;
        }


        result.push({

            ...trip,

            stopTime:
                stop.time

        });

    }


    return result;
}
