/* =========================================
   DPMA ONLINE
   HLAVNÍ STARTOVACÍ SCRIPT
========================================= */

let vehiclesData = {};
let lineVehiclesData = {};


/* =========================================
   NAČTENÍ VOZIDEL
========================================= */

async function loadVehiclesData() {

    try {

        const response =
            await fetch(
                "data/vehicles.json"
            );

        if (!response.ok) {
            throw new Error(
                "vehicles.json nebyl nalezen."
            );
        }

        vehiclesData =
            await response.json();

        console.log(
            "✓ Vozidla načtena"
        );

    } catch (error) {

        console.error(
            "Chyba vehicles.json:",
            error
        );

    }
}


/* =========================================
   NAČTENÍ PŘIŘAZENÍ LINEK
========================================= */

async function loadLineVehiclesData() {

    try {

        const response =
            await fetch(
                "data/line-vehicles.json"
            );

        if (!response.ok) {
            throw new Error(
                "line-vehicles.json nebyl nalezen."
            );
        }

        lineVehiclesData =
            await response.json();

        console.log(
            "✓ Přiřazení vozidel načteno"
        );

    } catch (error) {

        console.error(
            "Chyba line-vehicles.json:",
            error
        );

    }
}


/* =========================================
   START CELÉHO SYSTÉMU
========================================= */

async function initializeApp() {

    console.log(
        "=============================="
    );

    console.log(
        "DPMA ONLINE – START"
    );

    console.log(
        "=============================="
    );


    /*
        Nejdříve načteme vozidla
        a jejich přiřazení.
    */

    await loadVehiclesData();

    await loadLineVehiclesData();


    /*
        Potom načteme všechny jízdní řády.
    */

    const lines =
        await initializeTimetable();


    console.log(
        `✓ Systém připraven – ${lines.length} linek`
    );


    /*
        Pokud existuje stránka
        departures.html, spustíme
        odjezdy.
    */

    if (
        typeof initializeDepartures ===
        "function"
    ) {

        initializeDepartures();

    }

}


/* =========================================
   SPUŠTĚNÍ
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeApp();

    }
);
