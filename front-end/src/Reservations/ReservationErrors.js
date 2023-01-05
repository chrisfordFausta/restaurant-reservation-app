function ReservationErrors({ errors }) {
    if (errors) {
        if (errors.length) {
            return (
                <div className="alert alert-danger">
                    <p>Error:</p>
                    {errors.map((error, index) => {
                        return <p key={index}>{error.message}</p>
                    })}
                </div>
            )
        }
    }
    return null;
}
export default ReservationErrors;