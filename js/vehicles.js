const assignedVehicles = new Set();

const departureVehicles = new Map();


function getAvailableVehicleType(line) {

    const types = lineVehiclesData[line];

    if (!types || types.length === 0) {
        return null;
    }

    return types[
        Math.floor(Math.random() * types.length)
    ];
}


function getAvailableFleetNumber(type) {

    const vehicle = vehiclesData[type];

    if (!vehicle) {
        return null;
    }

    const available =
        vehicle.fleetNumbers.filter(
            number => !assignedVehicles.has(number)
        );


    if (available.length === 0) {

        console.warn(
            "Žádné volné vozidlo typu:",
            type
        );

        return null;
    }


    const number =
        available[
            Math.floor(
                Math.random() * available.length
            )
        ];


    assignedVehicles.add(number);

    return number;
}


function releaseVehicle(number) {

    assignedVehicles.delete(number);

}


function assignVehicleToDeparture(departureId, line) {

    const type =
        getAvailableVehicleType(line);

    if (!type) {
        return null;
    }


    const number =
        getAvailableFleetNumber(type);

    if (!number) {
        return null;
    }


    const vehicle = vehiclesData[type];


    const result = {

        type: type,

        fleetNumber: number,

        airConditioning:
            vehicle.airConditioning

    };


    departureVehicles.set(
        departureId,
        result
    );


    return result;
}


function getVehicleForDeparture(departureId) {

    return departureVehicles.get(
        departureId
    );
}
