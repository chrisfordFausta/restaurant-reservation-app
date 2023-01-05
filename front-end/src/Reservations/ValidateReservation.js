export function hasValidDateAndTime(reservation) {
    const date = reservation.reservation_date;
    const time = reservation.reservation_time;
    const errors = [];
    
    const day = new Date(date).getUTCDay(); //returns a number, 0-6, starting from sunday (0) to saturday (6)

    // No reservations on Tuesdays
    //Check to see if the reservation_date is on tuesday
    if (day === 2) errors.push(new Error("Restaurant is closed on Tuesdays"));

    // No reservations before 10:30AM or after 9:30PM
    const hours = Number(time.split(":")[0]);
    const minutes = Number(time.split(":")[1]);
    //Check to see if reservation comes before 10:30AM
    if (hours < 10 || (hours === 10 && minutes < 30)) errors.push(new Error("No reservations before 10:30 AM"));
    //Check to see if reservation comes after 9:30PM
    if (hours > 21 || (hours === 21 && minutes > 30)) errors.push(new Error("No reservations after 9:30 PM"));

    // No reservations placed before the current date
    const selectedDate = new Date(`${date}T${time}`);
    if (selectedDate <= new Date()) errors.push(new Error("Reservations must be placed for future dates"));



    return errors;
}