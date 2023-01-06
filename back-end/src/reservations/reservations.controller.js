/**
 * List handler for reservation resources
 */
const service = require("./reservations.service");
const hasProperties = require("../errors/hasProperties");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");


// Controller-Level Middleware Functions
const hasRequiredProperties = hasProperties(
  "first_name",
  "last_name",
  "mobile_number",
  "reservation_date",
  "reservation_time",
  "people"
)

const VALID_PROPERTIES = [
  "reservation_id",
  "first_name",
  "last_name",
  "mobile_number",
  "reservation_date",
  "reservation_time",
  "people",
  "status",
  "created_at",
  "updated_at",
]

/**
 * Checks to see if the request body data only has valid properties
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns an error obj w/ a status of 400 if data contains any invalid properties, or it moves on to the next function.
 */
function hasOnlyValidProperties(req, res, next) {
  const { data = {} } = req.body;
  const invalidFields = Object.keys(data).filter(
    (key) => !VALID_PROPERTIES.includes(key)
  );

  if (invalidFields.length) {
    return next({
      status: 400,
      message: `Invalid field(s): ${invalidFields.join(", ")}`,
    });
  }
  next();
}
/**
 * Performs a read request on the database and check to see if the reservation exist.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns pass on the data of the searched reservation and move on to the next function, or sends an error obj w/ a status of 404.
 */
async function reservationExists(req, res, next) {
  const reservation_id = req.params.reservation_id || (req.body.data || {}).reservation_id;

  const reservation = await service.read(reservation_id);
  if (reservation) {
    res.locals.reservation = reservation;
    return next();
  }
  next({
    status: 404,
    message: `Reservation ${reservation_id} cannot be found.`,
  });
}
/**
 * Checks to see if reservations are place in the future, but not on tuesdays
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns an error obj w/ a status of 400 if the reservation date is not valid, placed in the past, or placed on tuesday, else it moves on to the next function. 
 */
function hasValidDate(req, res, next) {
  const { data = {} } = req.body;
  const date = data["reservation_date"];
  const time = data["reservation_time"];
  const formattedDate = new Date(`${date} ${time}`);
  const day = new Date(date).getUTCDay();

  if (isNaN(Date.parse(data["reservation_date"]))) {
    return next({
      status: 400,
      message: `Invalid reservation_date`,
    });
  }
  if (day === 2) {
    return next({
      status: 400,
      message: `Restaurant is closed on Tuesdays`,
    });
  }
  if (formattedDate <= new Date()) {
    console.log("100 formattedDate:", formattedDate);
    console.log("101 new Date():", new Date());
    console.log("102 new formattedDate:", new Date(`${data.reservation_date}T${data.reservation_time}`))
    return next({
      status: 400,
      message: `Reservation must be in the future`,
    });
  }
  next();
}
/**
 * Checks to see if reservation is placed under a valid time
 * @param {*} req 
 * @param {*} _res 
 * @param {*} next 
 * @returns an error w/ a status of 400 if the reservation time is invalid, before 10:30AM, or after 9:30PM, else it moves on to the next function.
 */
function hasValidTime(req, _res, next) {
  const { data = {} } = req.body;
  const time = data["reservation_time"];

  if (!/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/.test(time)) {
    next({
      status: 400,
      message: `Invalid reservation_time`,
    });
  }

  const hours = Number(time.split(":")[0]);
  const minutes = Number(time.split(":")[1]);
  if (hours < 10 || (hours === 10 && minutes < 30)) {
    next({
      status: 400,
      message: `Reservation must be after 10:30AM`,
    });
  }
  if (hours > 21 || (hours === 21 && minutes > 30)) {
    next({
      status: 400,
      message: `Reservation must be before 9:30PM`,
    });
  }
  next();
}

/**
 * Checks to see if the reservation has a valid amount of people
 * @param {*} req 
 * @param {*} _res 
 * @param {*} next 
 * @returns an error w/ a status of 400 if the people property has a value thats less than or equal to 0, or the value is not an integer, else it moves on to the next function.
 */
function hasValidNumber(req, _res, next) {
  const { people } = req.body.data;

  if (people === 0 || !Number.isInteger(people)) {
    return next({
      status: 400,
      message: `Invalid number of people`,
    });
  }
  next();
}

/**
 * Checks to see if the status property is valid
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns an error object w/ a status of 400 if the reservation is finished or cancelled, or if the status is invalid, else it moves on to the next function. 
 */
function hasValidStatus(req, res, next) {
  const { status } = req.body.data;
  const currentStatus = res.locals.reservation.status;

  if (currentStatus === "finished" || currentStatus === "cancelled") {
    return next({
      status: 400,
      message: `Reservation status is finished`,
    });
  }
  if (
    status === "booked" ||
    status === "seated" ||
    status === "finished" ||
    status === "cancelled"
  ) {
    res.locals.status = status;
    return next();
  }
  next({
    status: 400,
    message: `Invalid status: ${status}`,
  });
}

/**
 * Checks to see if a reservation has already been booked 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns an error obj w/ a status of 400 if status exist and has a value of booked, else it moves on to the next function.
 */
function isBooked(req, res, next) {
  const { status } = req.body.data;

  if (status && status !== "booked") {
    return next({
      status: 400,
      message: `Invalid status: ${status}`,
    });
  }
  next();
}

// Controller-Level Controller Functions

/**
 * Performs a get request and returns a list of reservation based on the query.
 * @param {*} req 
 * @param {*} res 
 * @returns if the date property exist in the query, then it responds with a json file of a list of reservations for that date. Else it responds with a json file of a list of reservation based on the mobile_number
 */
async function list(req, res) {
  const { date, mobile_number } = req.query;
  let data;
  if (date) {
    data = await service.list(date);
  } else {
    data = await service.search(mobile_number)
  }
  res.json({ data });
}

/**
 * Responds with a json file of the searched reservation
 * @param {*} req 
 * @param {*} res 
 */
async function read(req, res) {
  const data = res.locals.reservation;
  res.json({ data });
}

/**
 * Responds with a status of 201 and a json file of the data of the newly created reservation
 * @param {*} req 
 * @param {*} res 
 */
async function create(req, res) {
  res.status(201).json({ data: await service.create(req.body.data) });
}

/**
 * Responds with a status of 200 and a json file of the data of the updated reservation
 * @param {*} req 
 * @param {*} res 
 */
async function update(req, res) {
  const updatedRes = {
    ...req.body.data,
    reservation_id: res.locals.reservation.reservation_id,
  };
  const data = await service.update(updatedRes);
  res.status(200).json({ data });
}

/**
 * Responds with a status of 200 and a json file of the data of the reservation and its updated status
 * @param {*} req 
 * @param {*} res 
 */
async function updateStatus(req, res) {
  const { status } = res.locals;
  const { reservation_id } = res.locals.reservation;
  const data = await service.updateStatus(reservation_id, status);
  res.status(200).json({ data });
}



module.exports = {
  list: asyncErrorBoundary(list),
  read: [reservationExists, asyncErrorBoundary(read)],
  create: [
    hasOnlyValidProperties,
    hasRequiredProperties,
    hasValidDate,
    hasValidTime,
    hasValidNumber,
    isBooked,
    asyncErrorBoundary(create),
  ],
  update: [
    hasOnlyValidProperties,
    hasRequiredProperties,
    hasValidDate,
    hasValidTime,
    hasValidNumber,
    reservationExists,
    hasValidStatus,
    asyncErrorBoundary(update),
  ],
  updateStatus: [
    reservationExists,
    hasValidStatus,
    asyncErrorBoundary(updateStatus),
  ],
  reservationExists,
};
