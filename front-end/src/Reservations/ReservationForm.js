import React from "react";
import { useHistory } from "react-router";

function ReservationForm ({ reservation, changeHandler, submitHandler }) {
    const history = useHistory();
    return (
        <div>
            <form onSubmit={submitHandler}>
                <div className="form-group">
                    <label htmlFor="first_name">First Name: </label>
                    <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={reservation.first_name}
                        onChange={changeHandler}
                        required={true}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="last_name">Last Name: </label>
                    <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={reservation.last_name}
                        onChange={changeHandler}
                        required={true}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="mobile_number">Mobile Number:</label>
                    <input
                        id="mobile_number"
                        name="mobile_number"
                        type="text"
                        pattern="[0-9\-]+"
                        placeholder="123-456-7890"
                        value={reservation.mobile_number}
                        onChange={changeHandler}
                        required={true}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="reservation_date">Reservation Date:</label>
                    <input
                        id="reservation_date"
                        name="reservation_date"
                        type="date"
                        placeholder="YYYY-MM-DD"
                        pattern="\d{4}-\d{2}-\d{2}"
                        value={reservation.reservation_date}
                        onChange={changeHandler}
                        required={true}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="reservation_time">Reservation Time:</label>
                    <input
                        id="reservation_time"
                        name="reservation_time"
                        type="time"
                        placeholder="HH:MM"
                        pattern="[0-9]{2}:[0-9]{2}"
                        value={reservation.reservation_time}
                        onChange={changeHandler}
                        required={true}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="people">Table For:</label>
                    <input  
                        id="people"
                        name="people"
                        type="text"
                        value={reservation.people}
                        onChange={changeHandler}
                        required={true}
                    />
                </div>
                <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={() => history.goBack()}>
                        Cancel
                </button>
                <button className="btn btn-primary" type="submit">Submit</button>

            </form>
        </div>
    )
}
export default ReservationForm;