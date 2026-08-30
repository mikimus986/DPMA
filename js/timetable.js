/* =========================================
   DPMA ONLINE
   NAČÍTÁNÍ JÍZDNÍCH ŘÁDŮ
========================================= */

const loadedLines = new Map();


/* =========================================
   SEZNAM LINEK
========================================= */

const LINE_NUMBERS = [
    "25",
    "26",
    "27",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "37",
    "38"
];


/* =========================================
   NAČTENÍ JEDNÉ LINKY
========================================= */

async function loadLine(lineNumber) {

    /*
        Pokud už je linka načtená,
        nepřenášíme ji znovu.
    */

    if (loadedLines.has(lineNumber)) {
        return loadedLines.get(lineNumber);
    }


    try {

        const response =
            await fetch(
                `data/lines/${lineNumber}.json`
            );


        if (!response.ok) {

            throw new Error(
                `Jízdní řád linky ${lineNumber} nebyl nalezen.`
            );

        }


        const data =
            await response.json();


        /*
            Základní kontrola JSONu
        */

        if (
            !data.line ||
            !data.directions
        ) {

            throw new Error(
                `Linka ${lineNumber} má neplatný JSON.`
            );

        }


        loadedLines.set(
            lineNumber,
            data
        );


        return data;

    }

    catch (error) {

        console.error(
            "Chyba při načítání linky:",
            lineNumber,
            error
        );

        return null;
    }
}


/* =========================================
   NAČTENÍ VŠECH LINEK
========================================= */

async function loadAllLines() {

    const promises =
        LINE_NUMBERS.map(
            line =>
                loadLine(line)
        );


    const results =
        await Promise.all(
            promises
        );


    const lines = [];


    for (const line of results) {

        if (line) {
            lines.push(line);
        }

    }


    return lines;
}


/* =========================================
   ZÍSKÁNÍ LINKY
========================================= */

function getLine(lineNumber) {

    return (
        loadedLines.get(
            String(lineNumber)
        ) || null
    );

}


/* =========================================
   ZÍSKÁNÍ VŠECH LINEK
========================================= */

function getLoadedLines() {

    return Array.from(
        loadedLines.values()
    );

}


/* =========================================
   SPOJE LINKY
========================================= */

function getLineTrips(lineNumber) {

    const line =
        getLine(lineNumber);


    if (!line) {
        return [];
    }


    return getAllTripsForLine(
        line
    );

}


/* =========================================
   SPOJE NA ZASTÁVCE
========================================= */

function getDeparturesAtStop(
    stopName
) {

    const result = [];


    for (
        const line of loadedLines.values()
    ) {

        const trips =
            getTripsAtStop(
                line,
                stopName
            );


        for (const trip of trips) {

            result.push({
                ...trip,

                stop:
                    stopName
            });

        }

    }


    /*
        Seřadíme podle času.
    */

    result.sort(
        (a, b) => {

            return (
                timeToMinutes(a.stopTime) -
                timeToMinutes(b.stopTime)
            );

        }
    );


    return result;
}


/* =========================================
   VŠECHNY ZASTÁVKY
========================================= */

function getAllStops() {

    const stops =
        new Set();


    for (
        const line of loadedLines.values()
    ) {

        for (
            const direction of line.directions
        ) {

            for (
                const stop of direction.stops
            ) {

                stops.add(
                    stop.name
                );

            }

        }

    }


    return Array.from(
        stops
    ).sort(
        (a, b) =>
            a.localeCompare(
                b,
                "cs"
            )
    );
}


/* =========================================
   NAČTENÍ SYSTÉMU
========================================= */

async function initializeTimetable() {

    console.log(
        "Načítám jízdní řády..."
    );


    const lines =
        await loadAllLines();


    console.log(
        `Načteno ${lines.length} linek.`
    );


    for (const line of lines) {

        console.log(
            `Linka ${line.line}: načtena`
        );

    }


    return lines;
}
