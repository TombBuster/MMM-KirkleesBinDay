var NodeHelper = require("node_helper");
var axios = require("axios");
var cheerio = require("cheerio");
var parseString = require('xml2js').parseString;
const multisort = require("multisort");
var moment = require("moment");
const querystring = require('querystring');
const { response } = require("express");

module.exports = NodeHelper.create({
  start: function () {
    console.log("Starting node_helper for module: " + this.name);
    this.schedule = null;
  },

  socketNotificationReceived: function (notification, payload) {
    var self = this;
    if (notification == "MMM-KIRKLEESBINDAY-CONFIG") {
      this.config = payload;
    } else if (notification == "MMM-KIRKLEESBINDAY-GET") {

      function createAxios() {
        const axios = require('axios');
        return axios.create({ withCredentials: true });
      }
      const axiosInstance = createAxios();

      const cookieJar = {
        myCookies: undefined,
      };

      const requestData = {
        "formValues": {
          "Search": {
            "validatedUPRN": {
              "value": payload.uprn
            }
          }
        }
      }

      const login = async () => {
        const response = await axiosInstance.get("https://my.kirklees.gov.uk");
        cookieJar.myCookies = response.headers['set-cookie'];
      }

      const request = async () => {
        const response = await axiosInstance.post('https://my.kirklees.gov.uk/apibroker/runLookup?id=65e08e60b299d',
          requestData,
          {
            headers: {
              cookie: cookieJar.myCookies[2],
            },
          });
        bins = response.data.integration.transformed.rows_data
        const greyScrape = bins[1801580].NextCollectionDate
        const greenScrape = bins[1816913].NextCollectionDate
        const brownScrape = bins[1702116].NextCollectionDate

        const schedule = [];


        greyMoment = moment(greyScrape);
        schedule.push({ pickupDate: greyMoment, pickupType: "GreyBin" });

        greenMoment = moment(greenScrape);
        schedule.push({ pickupDate: greenMoment, pickupType: "GreenBin" });

        brownMoment = moment(brownScrape);
        schedule.push({ pickupDate: brownMoment, pickupType: "BrownBin" });

        this.getNextPickups(payload, schedule)
      }

      login()
        .then(() => request())
        .catch(error => {
          console.error('Error:', error);
        });;


    }
  },

  getNextPickups: function (payload, schedule) {

    multisort(schedule, ["pickupDate"]);
    this.sendSocketNotification("MMM-KIRKLEESBINDAY-RESPONSE", schedule);
  },
});
