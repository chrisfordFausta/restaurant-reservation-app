const knex = require("../db/connection");
const tableName = "reservations";


//Service-Level Controller Functions

/**
 * Performs a read operation on the database & returns all of the reservations booked for a specific date
 * @param {*} reservation_date 
 * @returns reservations @ specific date
 */
function list(reservation_date) {
    return knex(tableName)
        .select("*")
        .where({ reservation_date })
        .whereNot({ status: "finished"})
        .orderBy("reservation_time")
}
/**
 * Performs a read request on the database & return the data of a reservation @ a specific reservation_id
 * @param {*} reservation_id 
 * @returns  a reservation @ a specific reservation_id
 */
function read(reservation_id) {
    return knex(tableName)
        .select("*")
        .where({ reservation_id })
        .first();
}
/**
 * Performs a post request on the database & return the newly created reservation
 * @param {*} reservation 
 * @returns data of the newly created reservation
 */
function create(reservation) {
    return knex("reservations")
      .insert(reservation)
      .returning("*")
      .then((createdRecords) => createdRecords[0]);
  }
/**
 * Performs a put request on the database & return the updated reservation
 * @param {*} updatedRes 
 * @returns  the updated reservation
 */
function update(updatedRes) {
    return knex("reservations")
      .select("*")
      .where({ reservation_id: updatedRes.reservation_id })
      .update(updatedRes, "*")
      .then((createdRecords) => createdRecords[0]);
  }
/**
 * Performs a put request on the database & the reservation with the updated status
 * @param {*} reservation_id 
 * @param {*} status 
 * @returns the reservation with the updated status
 */
function updateStatus(reservation_id, status) {
    return knex("reservations")
      .select("*")
      .where({ reservation_id })
      .update({ status: status }, "*")
      .then((createdRecords) => createdRecords[0]);
  }
/**
 *  Search for a partial or complete phone number
 * @param {*} mobile_number 
 * @returns 
 */
function search(mobile_number) {
return knex("reservations")
    .whereRaw(
    "translate(mobile_number, '() -', '') like ?",
    `%${mobile_number.replace(/\D/g, "")}%`
    )
    .orderBy("reservation_date");
}

  module.exports = {
    list,
    search,
    read,
    create,
    update,
    updateStatus,
  };