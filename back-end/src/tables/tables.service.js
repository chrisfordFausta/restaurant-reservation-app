const knex = require("../db/connection");
const tableName = "tables";

/**
 * @returns a list of all the tables ordered by their names
 */
function list() {
    return knex(tableName).select("*").orderBy("table_name");
  }
  
/**
 * Takes the newly created table and insert it into the "tables" database
 * @param {*} table 
 * @returns the newly created table
 */
function create(table) {
  return knex(tableName)
    .insert(table)
    .returning("*")
    .then((createdRecords) => createdRecords[0]);
}

/**
 * search the database for a specific table_id
 * @param {*} table_id 
 * @returns the data of the specific table
 */
function read(table_id) {
  return knex(tableName).select("*").where({ table_id }).first();
}
  
 /**
  * Performs a PUT request on the database that updates the status of the reservation obj to seated and updates the table reservation_id 
  * @param {*} reservation_id 
  * @param {*} table_id 
  * @returns data of the updated table and updates the reservation's status to seated
  */ 
function update(reservation_id, table_id) {
  return knex.transaction((trx) => {
    return trx(tableName)
      .where({ table_id: table_id })
      .update({ reservation_id }, "*")
      .then((updatedTable) => updatedTable[0])
      .then(() => {
        return trx("reservations")
          .where({ reservation_id })
          .update({ status: "seated" })
      });
  });
}
/**
 * Removes the reservation from the table
 * @param {*} reservation_id 
 * @param {*} table_id 
 * @returns the data of table with the reservation_id property set to null and updates the reservation's, with the specific reservation_id, status to finished
 */
function finish(reservation_id, table_id) {
  return knex.transaction((trx) => {
    return trx(tableName)
      .where({ table_id })
      .update({ reservation_id: null })
      .then(() => {
        return trx("reservations")
          .where({ reservation_id })
          .update({ status: "finished"})
      });
  });
}
  
  module.exports = {
    list,
    read,
    create,
    update,
    finish,
  };