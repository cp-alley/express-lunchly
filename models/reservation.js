"use strict";

/** Reservation for Lunchly */

const moment = require("moment");

const { NotFoundError } = require("../expressError")

const db = require("../db");
const { Not } = require("nunjucks/src/nodes");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  /** formatter for startAt */

  getFormattedStartAt() {
    return moment(this.startAt).format("MMMM DD YYYY, h:mm a");
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id,
                  customer_id AS "customerId",
                  num_guests AS "numGuests",
                  start_at AS "startAt",
                  notes AS "notes"
           FROM reservations
           WHERE customer_id = $1`,
      [customerId],
    );

    return results.rows.map(row => new Reservation(row));
  }

  //** Get a reservation by id */

  static async getReservation(id) {
    const results = await db.query(
      `SELECT id,
                customer_id AS "customerId",
                start_at AS "startAt",
                num_guests AS "numGuests",
                notes
          FROM reservations
          WHERE id = $1`,
      [id]
    );

    const reservation = results.rows[0];

     if (reservation === undefined) {
      throw new NotFoundError("Reservation not found")
     }

     return new Reservation(reservation);
  }

  /** Saves a reservation to the database, creating it in the case that
   * it does not already exist.
   */
  async save() {
    //check for existing customer id first?

    //For reservation that does not exist yet
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
        [this.customerId, this.startAt, this.numGuests, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
           SET start_at = $1,
               num_guests = $2,
               notes = $3
           WHERE id = $4`,
        [this.startAt, this.numGuests, this.notes, this.id]
      );
    }

  }

}


module.exports = Reservation;
