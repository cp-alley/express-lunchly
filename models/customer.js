"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get full name (first last) of customer */

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
        this.firstName,
        this.lastName,
        this.phone,
        this.notes,
        this.id,
      ],
      );
    }
  }

  /** Returns an array of customer instances with firstName, lastName, id, and
   * reservationCount.
   */
  static async getTopTenCustomers() {
    const reservationResults = await db.query(
      `SELECT customer_id AS "id",
              COUNT(*) AS "resCount",
              first_name AS "firstName",
              last_name AS "lastName"
        FROM reservations
        JOIN customers
        ON customer_id = customers.id
      GROUP BY customer_id, first_name, last_name
      ORDER BY COUNT(*) DESC, last_name
      LIMIT 10;`
    );
    console.log("reservationresults=", reservationResults);

    const topTen = reservationResults.rows.map(function (c) {
      const customer = new Customer(c);
      customer.reservationCount = c.resCount;
      return customer;
    });
    console.log("topTen is:", topTen);

    return topTen;

  }

  /** Search for customers */
  static async searchForCustomers(qString){
    const searchResults = await db.query(
      `SELECT id,
      first_name AS "firstName",
      last_name  AS "lastName",
      phone,
      notes
      FROM customers
      WHERE first_name ILIKE '%' || $1 || '%'
        OR last_name ILIKE '%' || $1 || '%'
      ORDER BY last_name, first_name`,
      [qString]
    );
    return searchResults.rows.map(c => new Customer(c));
  }

}

module.exports = Customer;
