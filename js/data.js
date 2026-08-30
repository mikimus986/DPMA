let stopsData = {};
let vehiclesData = {};
let lineVehiclesData = {};

let lineData = {};


async function loadJSON(path) {

    const response = await fetch(path);

    if (!response.ok) {
        throw new Error("Nelze načíst " + path);
    }

    return await response.json();
}


async function loadBaseData() {

    stopsData = await loadJSON("data/stops.json");

    vehiclesData = await loadJSON("data/vehicles.json");

    lineVehiclesData =
        await loadJSON("data/line-vehicles.json");


    lineData["1"] =
        await loadJSON("data/lines/1.json");

}
