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
   TYPY VOZIDEL PRO LINKY
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
   VOZIDLA
========================================= */

const createdVehicles =
    new Map();


/* =========================================
   NÁHODNÉ ČÍSLO
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


    const available = [];


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

            available.push(
                number
            );

        }

    }


    /*
        Všechna čísla už byla použita.
    */

    if (
        available.length === 0
    ) {

        return null;

    }


    const randomIndex =
        Math.floor(
            Math.random() *
            available.length
        );


    const fleetNumber =
        available[
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
    vehicleType
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


    /*
        Už není volné evidenční číslo.
    */

    if (
        fleetNumber === null
    ) {

        console.warn(
            `Pro typ ${vehicleType} už nejsou volná evidenční čísla.`
        );

        return null;

    }


    const vehicle = {

        fleetNumber:
            fleetNumber,

        type:
            vehicleType,

        airConditioning:
            config.airConditioning

    };


    createdVehicles.set(
        fleetNumber,
        vehicle
    );


    return vehicle;
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
   VOZIDLO PRO LINKU
========================================= */

function createVehicleForLine(
    lineNumber
) {

    const vehicleType =
        getVehicleTypeForLine(
            lineNumber
        );


    if (!vehicleType) {

        console.warn(
            `Linka ${lineNumber} nemá nastavený typ vozidla.`
        );

        return null;

    }


    return createVehicle(
        vehicleType
    );
}


/* =========================================
   VOZIDLO PRO SPOJ
========================================= */

function assignVehicleToDeparture(
    tripId,
    lineNumber
) {

    /*
        Pokud už má spoj vozidlo,
        nic nového nevytváříme.
    */

    if (
        tripVehicles.has(
            tripId
        )
    ) {

        return tripVehicles.get(
            tripId
        );

    }


    const vehicle =
        createVehicleForLine(
            lineNumber
        );


    if (!vehicle) {
        return null;
    }


    tripVehicles.set(
        tripId,
        vehicle
    );


    const trip =
        findTrip(
            tripId
        );


    if (trip) {

        trip.vehicle =
            vehicle;

    }


    return vehicle;
}


/* =========================================
   SEZNAM VOZIDEL
========================================= */

function getAllVehicles() {

    return Array.from(
        createdVehicles.values()
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
   KLIMATIZACE
========================================= */

function hasAirConditioning(
    vehicle
) {

    if (!vehicle) {
        return false;
    }


    return (
        vehicle.airConditioning ===
        true
    );

}


/* =========================================
   RESET VOZIDEL
========================================= */

function resetVehicles() {

    usedFleetNumbers.clear();

    createdVehicles.clear();

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
            "|",
            vehicle.airConditioning
                ? "KLIMA"
                : "BEZ KLIMY"

        );

    }


    console.log(
        "============================="
    );

}
