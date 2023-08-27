var NodeHelper = require("node_helper");
var axios = require("axios");
var cheerio = require("cheerio");
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
      const headers = {
        "Cookie": "ASP.NET_SessionId=nkdq0iquq5ivr25zfvvkevx0"
      }
      const requestData = {
        transaction: 'bin-collection-dates',
        __EVENTTARGET: '',
        __EVENTARGUMENT: '',
        __LASTFOCUS: '',
        __VIEWSTATE: '/wEPDwUJNzM1OTY0Mzk0D2QWAmYPZBYCZg9kFgICAw9kFgICAQ9kFgICBw9kFgICAQ9kFgYCCQ9kFgICAQ8PFgIeBFRleHRkZGQCDw8PFgIeB1Zpc2libGVnZBYCAgMPZBYIAgIPZBYCAgEPZBYGAgMPDxYCHwAFF1Bvc3Rjb2RlIG9yIHN0cmVldCBuYW1lZGQCBQ8PZBYCHgtQbGFjZWhvbGRlcgUeRW50ZXIgcG9zdGNvZGUgb3Igc3RyZWV0IG5hbWUuZAIHDw8WBB8ABR5FbnRlciBwb3N0Y29kZSBvciBzdHJlZXQgbmFtZS4fAWhkZAIEDw8WAh8BaGQWAgIBD2QWAgIBD2QWAgIBD2QWAgIDDxBkZBYAZAIGDw8WAh8BaGQWAgIBD2QWAgIBD2QWAgIBD2QWAgIDDxBkZBYAZAIIDw8WAh8BaGQWAgIBD2QWBAIBDxYCHglpbm5lcmh0bWwFGFBsZWFzZSBzZWxlY3QgYW4gYWRkcmVzc2QCAw88KwALAGQCEw9kFgICAQ9kFgICCw8WAh8BaGRkSkksp2dORgO7eg5b0To4gQTXssxt2%2Bkr3mU32tg7XEc%3D',
        __VIEWSTATEGENERATOR: '255667BB',
        __SCROLLPOSITIONX: '0',
        __SCROLLPOSITIONY: '0',
        __EVENTVALIDATION: '/wEdAAXNghFmzP7PjE%2Bkuj8UVfwZBFs81DS%2FU2qI6WMTgivGTA1xW1g%2FEwI5S%2BJ%2Br9vxHkdPwOk%2B385HtDJeMd9G%2BVGuiNfBseChletdZQdpKPUgVe4455bDQLSIhTawagDCl5CLkhytsSYsy%2BaPDw%2FpgRAz',
        'ctl00$ctl00$cphPageBody$cphContent$hdnBinUPRN': '',
        'ctl00$ctl00$cphPageBody$cphContent$thisGeoSearch$txtGeoPremises': payload.houseNumber,
        'ctl00$ctl00$cphPageBody$cphContent$thisGeoSearch$txtGeoSearch': payload.postcode,
        'ctl00$ctl00$cphPageBody$cphContent$thisGeoSearch$butGeoSearch': 'Search',

      }

      axios.post(
        'https://www.kirklees.gov.uk/beta/your-property-bins-recycling/your-bins/?transaction=bin-collection-dates',
        requestData,
        { headers }
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