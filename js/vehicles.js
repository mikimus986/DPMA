/* =========================================
   DPMA ONLINE – SYSTÉM VOZIDEL
========================================= */


/*
    Vozidla aktuálně přiřazená ke spojům.

    KEY:
        ID spoje

    VALUE:
        informace o vozidle
*/

const tripVehicles = new Map();


/*
    Evidenční čísla, která jsou právě
    obsazená nějakým aktivním spojem.
*/

const assignedVehicles = new Set();


/* =========================================
   VYTVOŘENÍ EVIDENČNÍCH ČÍSEL
========================================= */

function generateFleetNumbers(vehicleData) {

    const numbers = [];


    if (
        !vehicleData.fleetNumbers ||
        typeof vehicleData.fleetNumbers !== "object"
    ) {
        return numbers;
    }


    const from =
        Number(vehicleData.fleetNumbers.from);

    const to =
        Number(vehicleData.fleetNumbers.to);


    if (
        Number.isNaN(from) ||
        Number.isNaN(to)
    ) {
        return numbers;
    }


    for (
        let number = from;
        number <= to;
        number++
    ) {

        numbers.push(
            String(number)
        );

    }


    return numbers;
}


/* =========================================
   DOSTUPNÁ EVIDENČNÍ ČÍSLA
========================================= */

function getAvailableFleetNumbers(type) {

    const vehicle =
        vehiclesData[type];


    if (!vehicle) {
        return [];
    }


    const allNumbers =
        generateFleetNumbers(vehicle);


    return allNumbers.filter(
        number =>
            !assignedVehicles.has(number)
    );
}


/* =========================================
   NÁHODNÉ VOZIDLO
========================================= */

function getRandomVehicleType(line) {

    const types =
        lineVehiclesData[line];


    if (
        !types ||
        types.length === 0
    ) {

        console.warn(
            "Pro linku " +
            line +
            " nejsou nastavena vozidla."
        );

        return null;
    }


    /*
        Zamícháme seznam typů,
        aby výběr nebyl vždy stejný.
    */

    const shuffled =
        [...types].sort(
            () => Math.random() - 0.5
        );


    /*
        Zkusíme najít typ,
        který má volné vozidlo.
    */

    for (const type of shuffled) {

        const available =
            getAvailableFleetNumbers(
                type
            );


        if (available.length > 0) {
            return type;
        }

    }


    console.warn(
        "Na lince " +
        line +
        " není žádné volné vozidlo."
    );


    return null;
}


/* =========================================
   PŘIDĚLENÍ VOZIDLA
========================================= */

function assignVehicleToDeparture(
    departureId,
    line
) {

    /*
        Pokud už spoj vozidlo má,
        vrátíme ho.
    */

    if (
        tripVehicles.has(
            departureId
        )
    ) {

        return tripVehicles.get(
            departureId
        );

    }


    const type =
        getRandomVehicleType(
            line
        );


    if (!type) {
        return null;
    }


    const available =
        getAvailableFleetNumbers(
            type
        );


    if (available.length === 0) {
        return null;
    }


    /*
        Náhodné evidenční číslo
    */

    const fleetNumber =
        available[
            Math.floor(
                Math.random() *
                available.length
            )
        ];


    /*
        Označíme vozidlo jako obsazené.
    */

    assignedVehicles.add(
        fleetNumber
    );


    const vehicleData =
        vehiclesData[type];


    const vehicle = {

        type: type,

        fleetNumber:
            fleetNumber,

        category:
            vehicleData.category,

        airConditioning:
            vehicleData.airConditioning

    };


    tripVehicles.set(
        departureId,
        vehicle
    );


    return vehicle;
}


/* =========================================
   ZÍSKÁNÍ VOZIDLA SPOJE
========================================= */

function getVehicleForDeparture(
    departureId
) {

    return tripVehicles.get(
        departureId
    ) || null;

}


/* =========================================
   PŘEVOD VOZIDLA NA DALŠÍ SPOJ
========================================= */

function transferVehicle(
    oldTripId,
    newTripId
) {

    const vehicle =
        tripVehicles.get(
            oldTripId
        );


    if (!vehicle) {
        return false;
    }


    /*
        Stejné vozidlo pokračuje
        na další spoj.
    */

    tripVehicles.set(
        newTripId,
        vehicle
    );


    /*
        Starý spoj už vozidlo
        nevlastní.
    */

    tripVehicles.delete(
        oldTripId
    );


    return true;
}


/* =========================================
   UVOLNĚNÍ VOZIDLA
========================================= */

function releaseVehicle(
    tripId
) {

    const vehicle =
        tripVehicles.get(
            tripId
        );


    if (!vehicle) {
        return;
    }


    /*
        Evidenční číslo se znovu
        stane dostupným.
    */

    assignedVehicles.delete(
        vehicle.fleetNumber
    );


    tripVehicles.delete(
        tripId
    );

}


/* =========================================
   KONTROLA KLIMATIZACE
========================================= */

function hasAirConditioning(
    vehicle
) {

    if (!vehicle) {
        return false;
    }


    return vehicle.airConditioning === true;
}


/* =========================================
   IKONA KLIMATIZACE
========================================= */

function getAirConditioningIcon(
    vehicle
) {

    if (
        hasAirConditioning(
            vehicle
        )
    ) {

        return "❄️";

    }


    return "";

}


/* =========================================
   INFORMACE O VOZIDLE
========================================= */

function getVehicleInfo(
    vehicle
) {

    if (!vehicle) {

        return {

            type: "Neuvedeno",

            fleetNumber: "—",

            category: "—",

            airConditioning: false

        };

    }


    return {

        type:
            vehicle.type,

        fleetNumber:
            vehicle.fleetNumber,

        category:
            vehicle.category,

        airConditioning:
            vehicle.airConditioning

    };

}
