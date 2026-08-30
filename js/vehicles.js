/* =========================================
   DPMA ONLINE
   VEHICLES.JS – FINÁLNÍ VERZE
========================================= */


/* =========================================
   TYPY VOZIDEL
========================================= */

const VEHICLE_TYPES = {

    "Škoda 26TR": {
        airConditioning: false,
        from: 3104,
        to: 3130
    },

    "Škoda 27TR": {
        airConditioning: true,
        from: 3400,
        to: 3433
    },

    "Škoda 31TR": {
        airConditioning: false,
        from: 3209,
        to: 3230
    },

    "Škoda 32TR": {
        airConditioning: true,
        from: 3300,
        to: 3329
    }

};


/* =========================================
   TYP VOZIDLA PRO LINKU
========================================= */

const LINE_VEHICLE_TYPES = {

    "25": "Škoda 26TR",
    "26": "Škoda 27TR",
    "27": "Škoda 26TR",
    "30": "Škoda 32TR",
    "31": "Škoda 31TR",
    "32": "Škoda 27TR",
    "33": "Škoda 27TR",
    "34": "Škoda 32TR",
    "35": "Škoda 32TR",
    "37": "Škoda 32TR",
    "38": "Škoda 31TR"

};


/* =========================================
   POUŽITÁ EVIDENČNÍ ČÍSLA
========================================= */

const usedFleetNumbers =
    new Set();


/* =========================================
   VYTVOŘENÁ VOZIDLA
========================================= */

const createdVehicles =
    new Map();


/* =========================================
   VOZIDLA PODLE LINEK
========================================= */

const lineVehicles =
    new Map();


/* =========================================
   NÁHODNÉ EVIDENČNÍ ČÍSLO
========================================= */

function getRandomFleetNumber(
    vehicleType
) {

    const config =
        VEHICLE_TYPES[
            vehicleType
        ];


    if (!config) {
        return null;
    }


    const availableNumbers = [];


    for (
        let number = config.from;
        number <= config.to;
        number++
    ) {

        if (
            !usedFleetNumbers.has(
                number
            )
        ) {

            availableNumbers.push(
                number
            );

        }

    }


    if (
        availableNumbers.length === 0
    ) {

        console.warn(
            `Došla evidenční čísla pro ${vehicleType}.`
        );

        return null;

    }


    const randomIndex =
        Math.floor(
            Math.random() *
            availableNumbers.length
        );


    const fleetNumber =
        availableNumbers[
            randomIndex
        ];


    usedFleetNumbers.add(
        fleetNumber
    );


    return fleetNumber;
}


/* =========================================
   VYTVOŘENÍ VOZIDLA
========================================= */

function createVehicle(
    vehicleType,
    lineNumber = null
) {

    const config =
        VEHICLE_TYPES[
            vehicleType
        ];


    if (!config) {

        console.error(
            "Neznámý typ vozidla:",
            vehicleType
        );

        return null;

    }


    const fleetNumber =
        getRandomFleetNumber(
            vehicleType
        );


    if (
        fleetNumber === null
    ) {

        return null;

    }


    const vehicle = {

        fleetNumber:
            fleetNumber,

        type:
            vehicleType,

        airConditioning:
            config.airConditioning,

        line:
            lineNumber
                ? String(lineNumber)
                : null,

        trips:
            []

    };


    createdVehicles.set(
        fleetNumber,
        vehicle
    );


    return vehicle;
}


/* =========================================
   VYTVOŘENÍ VOZIDEL PRO LINKU
========================================= */

function createVehiclesForLine(
    lineNumber,
    count
) {

    lineNumber =
        String(lineNumber);


    const vehicleType =
        LINE_VEHICLE_TYPES[
            lineNumber
        ];


    if (!vehicleType) {

        console.warn(
            `Linka ${lineNumber} nemá nastavený typ vozidla.`
        );

        return [];

    }


    /*
        Pokud už jsme vozidla
        pro tuto linku vytvořili,
        použijeme je.
    */

    if (
        lineVehicles.has(
            lineNumber
        )
    ) {

        return lineVehicles.get(
            lineNumber
        );

    }


    const vehicles = [];


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const vehicle =
            createVehicle(
                vehicleType,
                lineNumber
            );


        if (!vehicle) {

            console.warn(
                `Nepodařilo se vytvořit vozidlo ${i + 1} pro linku ${lineNumber}.`
            );

            break;

        }


        vehicles.push(
            vehicle
        );

    }


    lineVehicles.set(
        lineNumber,
        vehicles
    );


    return vehicles;
}


/* =========================================
   PŘIŘAZENÍ VOZIDEL PODLE PLÁNU
========================================= */

function assignVehiclesFromFleetPlan(
    lineNumber
) {

    lineNumber =
        String(lineNumber);


    /*
        Už jsme přiřazovali?
    */

    if (
        lineVehicles.has(
            lineNumber
        )
    ) {

        return lineVehicles.get(
            lineNumber
        );

    }


    const requiredCount =
        getRequiredVehicleCount(
            lineNumber
        );


    if (
        requiredCount <= 0
    ) {

        return [];

    }


    /*
        Vytvoříme přesně tolik
        vozidel, kolik vypočítal
        trips.js.
    */

    const vehicles =
        createVehiclesForLine(
            lineNumber,
            requiredCount
        );


    /*
        Získáme spoje linky.
    */

    const lineData =
        getLine(
            lineNumber
        );


    if (!lineData) {

        return vehicles;

    }


    const plan =
        getVehiclePlan(
            lineNumber
        );


    /*
        Propojíme plán s
        reálnými vozidly.
    */

    for (
        let i = 0;
        i < plan.length;
        i++
    ) {

        const rotation =
            plan[i];


        const vehicle =
            vehicles[i];


        if (!vehicle) {
            continue;
        }


        for (
            const tripId
            of rotation.trips
        ) {

            const trip =
                findTrip(
                    tripId
                );


            if (!trip) {
                continue;
            }


            assignTripToVehicle(
                trip,
                vehicle
            );

        }

    }


    return vehicles;
}


/* =========================================
   PŘIŘAZENÍ SPOJE K VOZIDLU
========================================= */

function assignTripToVehicle(
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


    /*
        Spoj přidáme do seznamu
        pouze jednou.
    */

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
   VOZIDLO PRO SPOJ
========================================= */

function getVehicleForTrip(
    trip
) {

    if (!trip) {
        return null;
    }


    /*
        Už má vozidlo?
    */

    const existing =
        getTripVehicle(
            trip
        );


    if (existing) {
        return existing;
    }


    /*
        Pokusíme se vytvořit
        celý vozový park linky.
    */

    assignVehiclesFromFleetPlan(
        trip.line
    );


    /*
        Zkusíme znovu.
    */

    return getTripVehicle(
        trip
    );

}


/* =========================================
   STARÁ FUNKCE
   ZACHOVÁNA PRO departures.js
========================================= */

function assignVehicleToDeparture(
    tripId,
    lineNumber
) {

    const trip =
        findTrip(
            tripId
        );


    if (!trip) {
        return null;
    }


    /*
        Pokud už vozidlo existuje,
        nebudeme vytvářet nové.
    */

    const existing =
        getTripVehicle(
            trip
        );


    if (existing) {
        return existing;
    }


    /*
        Vytvoříme vozový park
        podle automatického výpočtu.
    */

    assignVehiclesFromFleetPlan(
        lineNumber
    );


    return getTripVehicle(
        trip
    );
}


/* =========================================
   TYP VOZIDLA PRO LINKU
========================================= */

function getVehicleTypeForLine(
    lineNumber
) {

    return (
        LINE_VEHICLE_TYPES[
            String(lineNumber)
        ] || null
    );

}


/* =========================================
   INFORMACE O TYPU
========================================= */

function getVehicleTypeInfo(
    vehicleType
) {

    return (
        VEHICLE_TYPES[
            vehicleType
        ] || null
    );

}


/* =========================================
   NAJÍT VOZIDLO
========================================= */

function findVehicle(
    fleetNumber
) {

    return (
        createdVehicles.get(
            Number(fleetNumber)
        ) || null
    );

}


/* =========================================
   VŠECHNA VOZIDLA
========================================= */

function getAllVehicles() {

    return Array.from(
        createdVehicles.values()
    );

}


/* =========================================
   VOZIDLA LINKY
========================================= */

function getVehiclesForLine(
    lineNumber
) {

    return (
        lineVehicles.get(
            String(lineNumber)
        ) || []
    );

}


/* =========================================
   KLIMATIZACE
========================================= */

function hasAirConditioning(
    vehicle
) {

    return (
        vehicle &&
        vehicle.airConditioning === true
    );

}


/* =========================================
   RESET
========================================= */

function resetVehicles() {

    usedFleetNumbers.clear();

    createdVehicles.clear();

    lineVehicles.clear();

}


/* =========================================
   DEBUG
========================================= */

function debugVehicles() {

    console.log(
        "========== VOZIDLA =========="
    );


    for (
        const vehicle
        of createdVehicles.values()
    ) {

        console.log(

            vehicle.fleetNumber,
            "|",
            vehicle.type,
            "| linka:",
            vehicle.line,
            "|",
            vehicle.airConditioning
                ? "❄️ KLIMA"
                : "BEZ KLIMY",
            "| spojů:",
            vehicle.trips.length

        );

    }


    console.log(
        "============================="
    );

}


/* =========================================
   DEBUG LINKY
========================================= */

function debugLineVehicles(
    lineNumber
) {

    const vehicles =
        getVehiclesForLine(
            lineNumber
        );


    console.log(
        `========== LINKA ${lineNumber} ==========`
    );


    console.log(
        "Typ:",
        getVehicleTypeForLine(
            lineNumber
        )
    );


    console.log(
        "Počet:",
        vehicles.length
    );


    for (
        const vehicle
        of vehicles
    ) {

        console.log(

            vehicle.fleetNumber,
            "|",
            vehicle.type,
            "|",
            vehicle.airConditioning
                ? "KLIMA"
                : "BEZ KLIMY",
            "| spojů:",
            vehicle.trips.length

        );

    }


    console.log(
        "================================"
    );

}
