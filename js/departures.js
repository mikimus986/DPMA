const activeTrips = new Map();


function timeToMinutes(time) {

    const [hours, minutes] =
        time.split(":").map(Number);

    return hours * 60 + minutes;
}


function getCurrentMinutes() {

    const now = new Date();

    return now.getHours() * 60 +
           now.getMinutes();

}


function findNextDeparture(line, currentTime) {

    const data = lineData[line];

    if (!data) {
        return null;
    }


    const current =
        timeToMinutes(currentTime);


    let best = null;


    for (const direction of data.directions) {

        for (const stop of direction.stops) {

            for (const departure of stop.departures) {

                const dep =
                    timeToMinutes(departure);


                if (dep >= current) {

                    if (
                        !best ||
                        dep < best.minutes
                    ) {

                        best = {

                            direction:
                                direction,

                            stop:
                                stop,

                            departure:
                                departure,

                            minutes:
                                dep

                        };

                    }

                }

            }

        }

    }


    return best;
}
