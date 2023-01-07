import React, { useState } from "react";
import ReservationForm from "./ReservationForm";
import { useHistory } from "react-router-dom";
import ReservationErrors from "./ReservationErrors";
import { hasValidDateAndTime } from "./ValidateReservation";
import { CreateReservation } from "../utils/api";

function NewReservation() {
    const initialState = {
        first_name: "",
        last_name: "",
        mobile_number: "",
        reservation_date: "",
        reservation_time: "",
        people: ""
    };
    // state variables for reservations &  reservation errors
    const [reservation, setReservation] = useState({ ...initialState });
    const [reservationErrors, setReservationErrors] = useState(null);
    const history = useHistory();

    // change handler function
    const changeHandler = ({  target: { name, value } }) => {
        if (name === "people") {
            setReservation({
                ...reservation,
                [name]: Number(value)
            });
        } else {
            setReservation({
                ...reservation,
                [name]: value
            });
        }
    }

    //submit handler function
    const submitHandler = async (event) => {
        event.preventDefault();
        const abortController = new AbortController();

        const errors = hasValidDateAndTime(reservation); //either errors will be an empty arr or it will be filled with Error objects
        if (errors.length) return setReservationErrors(errors);

        try {
            await CreateReservation(reservation, abortController.signal); // POST request API call
            history.push(`/dashboard?date=${reservation.reservation_date}`);// move user to the updated dashboard for reservations @ specific dates
        } catch (error) {
            setReservationErrors(error); //update reservationErrors state variable
        }
        return () => abortController.abort();
    };

    return (
        <>
            <h2>Create a Reservation:</h2>
            <ReservationErrors errors={reservationErrors} />
            <ReservationForm
                reservation={reservation}
                changeHandler={changeHandler}
                submitHandler={submitHandler}
            />
        </>
    );   
}
export default NewReservation;