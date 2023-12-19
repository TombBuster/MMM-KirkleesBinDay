var NodeHelper = require("node_helper");
var axios = require("axios");
var cheerio = require("cheerio");
var parseString = require('xml2js').parseString;
const multisort = require("multisort");
var moment = require("moment");
const querystring = require('querystring');

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

      const headers = {
        //"Cookie": "ASP.NET_SessionId=zlhhfjpvdnihcxwcvuygpkwq",
        "Content-Type": "application/x-www-form-urlencoded"
      }

      const requestData = {
        //transaction: 'bin-collection-dates',
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        __LASTFOCUS: '',
        __VIEWSTATE: "/wEPDwUJNTA3NDEyMzM4D2QWAmYPZBYCZg9kFgICAw9kFgICAQ9kFgICBw9kFgICAQ9kFgYCCQ9kFgICAQ8PFgIeBFRleHRkZGQCDw8PFgIeB1Zpc2libGVnZBYCAgMPZBYIAgIPZBYCAgEPZBYGAgMPDxYCHwAFF1Bvc3Rjb2RlIG9yIHN0cmVldCBuYW1lZGQCBQ8PZBYCHgtQbGFjZWhvbGRlcgUeRW50ZXIgcG9zdGNvZGUgb3Igc3RyZWV0IG5hbWUuZAIHDw8WBB8ABR5FbnRlciBwb3N0Y29kZSBvciBzdHJlZXQgbmFtZS4fAWhkZAIEDw8WAh8BaGQWAgIBD2QWAgIBD2QWAgIBD2QWAgIDDxBkZBYAZAIGDw8WAh8BaGQWAgIBD2QWAgIBD2QWAgIBD2QWAgIDDxBkZBYAZAIIDw8WAh8BaGQWAgIBD2QWBAIBDxYCHglpbm5lcmh0bWwFGFBsZWFzZSBzZWxlY3QgYW4gYWRkcmVzc2QCAw88KwALAGQCEw9kFgICAQ9kFgICCw8WAh8BaGRkdOJHNH3dGoHwzjfcwmIUGIEiEBk/4uN7LVo/7MFewBw=",
        __VIEWSTATEGENERATOR: "255667BB",
        __SCROLLPOSITIONX: '0',
        __SCROLLPOSITIONY: '0',
        __EVENTVALIDATION: "/wEdAAUdnFHpwBUIbmpw8UcygwhrBFs81DS/U2qI6WMTgivGTA1xW1g/EwI5S+J+r9vxHkdPwOk+385HtDJeMd9G+VGuiNfBseChletdZQdpKPUgVXLtlII7JPJezR7WhxgDbhN6RPpUqUf/3/96mPTM1NjV",
        'ctl00$ctl00$cphPageBody$cphContent$hdnBinUPRN': '',
        'ctl00$ctl00$cphPageBody$cphContent$thisGeoSearch$txtGeoPremises': payload.houseNumber,
        'ctl00$ctl00$cphPageBody$cphContent$thisGeoSearch$txtGeoSearch': payload.postcode,
        'ctl00$ctl00$cphPageBody$cphContent$thisGeoSearch$butGeoSearch': 'Search',

      }

      axios.post(
        'https://www.kirklees.gov.uk/beta/your-property-bins-recycling/your-bins/?transaction=bin-collection-dates',
        querystring.stringify(requestData),
        {
          headers
        }
      )
        .then(response => {
          const $ = cheerio.load(response.data);
          const greyScrape = $("#cphPageBody_cphContent_wtcDomestic240__hgcBinNextCollectionLabel")
          const greenScrape = $("#cphPageBody_cphContent_wtcRecycle240__hgcBinNextCollectionLabel")
          const brownScrape = $("#cphPageBody_cphContent_wtcGardenWaste240__hgcBinNextCollectionLabel")

          const schedule = [];

          const cleanedGreyDate = greyScrape.text().replace("Next collection ", "");
          greyMoment = moment(cleanedGreyDate, "dddd DD MMM YYYY");
          schedule.push({ pickupDate: greyMoment, pickupType: "GreyBin" });

          const cleanedGreenDate = greenScrape.text().replace("Next collection ", "");
          greenMoment = moment(cleanedGreenDate, "dddd DD MMM YYYY");
          schedule.push({ pickupDate: greenMoment, pickupType: "GreenBin" });

          const cleanedBrownDate = brownScrape.text().replace("Next collection ", "");
          brownMoment = moment(cleanedBrownDate, "dddd DD MMM YYYY");
          schedule.push({ pickupDate: brownMoment, pickupType: "BrownBin" });

          this.getNextPickups(payload, schedule)
        })
        .catch(error => {
          console.error('Error:', error);
        });

    }
  },

  getNextPickups: function (payload, schedule) {

    multisort(schedule, ["pickupDate"]);
    this.sendSocketNotification("MMM-KIRKLEESBINDAY-RESPONSE", schedule);
  },
});