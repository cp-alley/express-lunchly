"use strict";

/** Routes for Lunchly */

const express = require("express");

const { BadRequestError } = require("./expressError");
const Customer = require("./models/customer");
const Reservation = require("./models/reservation");

const router = new express.Router();

/** Homepage: show list of customers. */

router.get("/", async function (req, res, next) {
  if (req.query.search) {
    const searchString = req.query.search;
    const matchedCustomers = await Customer.searchForCustomers(searchString);

    return res.render("customer_list.html", { customers: matchedCustomers });
  }

  const customers = await Customer.all();

  return res.render("customer_list.html", { customers });
});

/** Form to add a new customer. */

router.get("/add/", async function (req, res, next) {
  console.log("hit add customer route");
  return res.render("customer_new_form.html");
});

/** Handle adding a new customer. */

router.post("/add/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const { firstName, lastName, phone, notes } = req.body;
  const customer = new Customer({ firstName, lastName, phone, notes });
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Show top ten customers by reservation count */

router.get("/top-ten/", async function (req, res, next) {
  console.log("hit top ten route");
  const topTen = await Customer.getTopTenCustomers();
  console.log("topTen=", topTen, "toptenvalue=", topTen[0].value);
  return res.render("top_ten_customers.html", { customers: topTen });
});

/** Show a customer, given their ID. */

router.get("/:id/", async function (req, res, next) {
  console.log("hit id route");
  const customer = await Customer.get(req.params.id);

  const reservations = await customer.getReservations();

  return res.render("customer_detail.html", { customer, reservations });
});

/** Show form to edit a customer. */

router.get("/:id/edit/", async function (req, res, next) {
  const customer = await Customer.get(req.params.id);

  res.render("customer_edit_form.html", { customer });
});

/** Handle editing a customer. */

router.post("/:id/edit/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const customer = await Customer.get(req.params.id);
  customer.firstName = req.body.firstName;
  customer.lastName = req.body.lastName;
  customer.phone = req.body.phone;
  customer.notes = req.body.notes;
  await customer.save();

  return res.redirect(`/${customer.id}/`);
});

/** Handle adding a new reservation. */

router.post("/:id/add-reservation/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }
  const customerId = req.params.id;
  const startAt = new Date(req.body.startAt);
  const numGuests = req.body.numGuests;
  const notes = req.body.notes;

  const reservation = new Reservation({
    customerId,
    startAt,
    numGuests,
    notes,
  });
  await reservation.save();

  return res.redirect(`/${customerId}/`);
});

router.get("/reservation/:id/", async function (req, res, next) {
  const id = req.params.id;
  const reservation = await Reservation.getReservation(id);
  const customer = await Customer.get(reservation.customerId)

  return res.render("reservation_edit.html", { reservation, customer })
});

router.post("/reservation/:id/", async function (req, res, next) {
  if (req.body === undefined) {
    throw new BadRequestError();
  }

  const reservation = await Reservation.getReservation(req.params.id);
  //const customer = await Customer.get(reservation.customerId)

  reservation.startAt = new Date(req.body.startAt);
  reservation.numGuests = req.body.numGuests;
  reservation.notes = req.body.notes;
  await reservation.save();

  return res.redirect(`/${reservation.customerId}/`);
});

module.exports = router;
