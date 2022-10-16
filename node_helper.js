var NodeHelper = require("node_helper");
var axios = require("axios");
var parseString = require('xml2js').parseString;
const multisort = require("multisort");
var moment = require("moment");

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
      if (this.schedule == null) {

        axios.get("https://www.kirklees.gov.uk/webservices/Utils/bins.asmx/GetBinCollectionsForPropertyNew2", {
            params: {
                uprn: payload.json,
            }
        })
          .then(function (response) {
            parseString(response.data, (err, result) => {
                if(err) {
                    //Do something
                } else {
                    self.schedule = result.BinsForFirmstepWidget.binCollections[0].collections[0].Bin;
                    self.getNextPickups(payload)
                }
            })
          })
          .catch(function (error) {
            // TODO: alert on errors
          });
      } else {
        this.getNextPickups(payload);
      }
    }
  },

  getNextPickups: function (payload) {
    var nextPickups = [];

    this.schedule.forEach((element) => {
      if (element.binType[0] == "240 litre domestic bin") {
        var greyPickup = {
          pickupDate: moment(element.nextCollection[0]),
          pickupType: "GreyBin",
        };
        nextPickups.push(greyPickup);
      }
      if (element.binType[0] == "240 litre recycling bin") {
        var greenPickup = {
          pickupDate: moment(element.nextCollection[0]),
          pickupType: "GreenBin",
        };
        nextPickups.push(greenPickup);
      }
      if (element.binType[0] == "240 litre garden waste bin") {
        var brownPickup = {
          pickupDate: moment(element.nextCollection[0]),
          pickupType: "BrownBin",
        };
        nextPickups.push(brownPickup);
      }
    });

    multisort(nextPickups, ["pickupDate"]);
    this.sendSocketNotification("MMM-KIRKLEESBINDAY-RESPONSE", nextPickups);
  },
});