const service = require("./tables.service.js");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");
const hasProperties = require("../errors/hasProperties");
const reservationsController = require("../reservations/reservations.controller");

//Controller-Level Middleware
const hasRequiredProperties = hasProperties("table_name", "capacity");
const hasReservationId = hasProperties("reservation_id");

/**
 * Performs a read request on the database & checks to see if the table exists
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns the data from the read request and pass it down to the next function if the data exist, or it returns an error obj w/ a status of 404
 */
async function tableExists(req, res, next) {
  const table_id = req.params.table_id;
  const table = await service.read(table_id);
  if (table) {
    res.locals.table = table;
    return next();
  }
  next({ status: 404, message: `Table ${table_id} cannot be found.` });
}

/**
 * Checks to see if the capacity property in the request body data has value that is a number greater than or equal to 1.
 * @param {*} req 
 * @param {*} _res 
 * @param {*} next 
 * @returns an error obj w/ a status of 400 if capacity is least than 1 or if capacity is not a number, else it moves on to the next function.
 */
function hasValidCapacity(req, _res, next) {
    const { capacity } = req.body.data;
    if (typeof(capacity) !== "number" || capacity < 1) {
        return next({
            status: 400,
            message: `Invalid capacity`,
        });
    }
    next();
}

/**
 * Checks to see if the table_name property in the request's body data has a valid name
 * @param {*} req 
 * @param {*} _res 
 * @param {*} next 
 * @returns an error obj w/ a status of 400 if the length of the table_name is less than 2, or it moves on to the next function
 */
function hasValidName(req, _res, next) {
  const table_name = req.body.data.table_name;
  if (table_name.length < 2) {
    return next({
      status: 400,
      message: `Invalid table_name`,
    });
  }
  next();
}

/**
 * Checks to see if the table's capacity can hold the number of people under a reservation
 * @param {*} _req 
 * @param {*} res 
 * @param {*} next 
 * @returns an error obj w/ a status of 400 if the table's capacity is less than the number of people under a reservation
 */
function hasSufficientCapacity(_req, res, next) {
  const capacity = res.locals.table.capacity;
  const people = res.locals.reservation.people;

  if (capacity < people) {
    return next({
      status: 400,
      message: `Table does not have sufficient capacity`,
    });
  }
  next();
}
/**
 * Checks to see if a table is available 
 * @param {*} _req 
 * @param {*} res 
 * @param {*} next 
 * @returns an error obj w/ status of 400 if occupied property has a value of true, or it moves on to the next function
 */
function tableIsFree(_req, res, next) {
  if (res.locals.table.reservation_id) {
    return next({
      status: 400,
      message: `Table is occupied`,
    });
  }
  next();
}
/** 
 * Checks to see if the table already has customers seated at it
 * @param {*} _req 
 * @param {*} res 
 * @param {*} next 
 * @returns an error obj w/ a status of 400 if the status property has a value of "seated", or it moves on to the next function
 */
function tableIsNotSeated(_req, res, next) {
  if (res.locals.reservation.status === "seated") {
    return next({
      status: 400,
      message: `Table is already seated`,
    });
  }
  next();
}
/**
 * Checks to see if the table is occupied
 * @param {*} _req 
 * @param {*} res 
 * @param {*} next 
 * @returns an error obj w/ a status of 400 if the occupied property is false, else it moves to the next function.
 */
function tableIsOccupied(_req, res, next) {
  if (!res.locals.table.reservation_id) {
    return next({
      status: 400,
      message: `Table is not occupied`,
    });
  }
  next();
}

//Controller-Level Controller Function 

/**
 * Performs a list request on the database and respond with a list of all the tables.
 * @param {*} _req 
 * @param {*} res 
 */
async function list(_req, res) {
  res.json({ data: await service.list() });
}

/**
 * Performs a POST request on the database and respond with a status of 201 and the data of the newly created table
 * @param {*} req 
 * @param {*} res 
 */
async function create(req, res) {
  const data = await service.create(req.body.data);
  res.status(201).json({ data });
}
/**
 * Performs a PUT request on the database and responds with a status of 200 and the data of the updated table
 * @param {*} req 
 * @param {*} res 
 */
async function update(req, res) {
  const { reservation_id } = req.body.data;
  const data = await service.update(
    reservation_id,
    res.locals.table.table_id
  );
  res.status(200).json({ data });
}

/**
 * Performs a DELETE request on the database and responds with a status of 200 and the data with the update reservation_id property
 * @param {*} _req 
 * @param {*} res 
 */
async function finish(_req, res) {
  const data = await service.finish(
    res.locals.table.reservation_id,
    res.locals.table.table_id
  );
  res.status(200).json({ data });
}

module.exports = {
  list: asyncErrorBoundary(list),
  create: [
    hasRequiredProperties,
    hasValidName,
    hasValidCapacity,
    asyncErrorBoundary(create),
  ],
  update: [
    asyncErrorBoundary(tableExists),
    hasReservationId,
    reservationsController.reservationExists,
    hasSufficientCapacity,
    tableIsNotSeated,
    tableIsFree,
    asyncErrorBoundary(update),
  ],
  finish: [
    asyncErrorBoundary(tableExists),
    tableIsOccupied,
    asyncErrorBoundary(finish),
  ],
};