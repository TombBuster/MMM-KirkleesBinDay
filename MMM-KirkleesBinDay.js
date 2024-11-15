Module.register('MMM-KirkleesBinDay', {

  // Default values
  defaults: {
    uprn: '',
    dateFormat: "dddd D MMMM",
  },

  // Define stylesheet
  getStyles: function () {
    return ["MMM-KirkleesBinDay.css"];
  },

  getScripts: function () {
    return ["moment.js"];
  },

  capFirst: function (string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  // Define required scripts.

  start: function () {
    Log.info('Starting module: ' + this.name);
    this.sendSocketNotification('MMM-KIRKLEESBINDAY-CONFIG', this.config)
    this.nextPickups = [];
    this.getPickups();
    this.timer = null;
  },

  // Get data from API passing the uprn
  getPickups: function () {
    clearTimeout(this.timer);
    this.timer = null;
    this.sendSocketNotification("MMM-KIRKLEESBINDAY-GET", {

      uprn: this.config.uprn
    });

    // Set check times
    var self = this;
    this.timer = setTimeout(function () {
      self.getPickups();
    }, 60 * 60 * 1000); // update once an hour
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification == "MMM-KIRKLEESBINDAY-RESPONSE") {
      this.nextPickups = payload;
      this.updateDom(1000);
    }
  },

  // Create Binday Icons from binday_icons.svg
  svgIconFactory: function (color) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttributeNS(null, "class", "binday-icon");
    //Switch for Legacy files
    switch (color) {
      case 'GreenBin':
        svg.setAttributeNS(null, "style", "fill: #00A651");
        break;
      case 'GreyBin':
        svg.setAttributeNS(null, "style", "fill: #787878");
        break;
      case 'BrownBin':
        svg.setAttributeNS(null, "style", "fill: #964B00");
        break;
      default:
        svg.setAttributeNS(null, "style", "fill: " + color);
        break;
    }
    var use = document.createElementNS('http://www.w3.org/2000/svg', "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", this.file("binday_icons.svg#bin"));
    svg.appendChild(use);
    return (svg);
  },

  getDom: function () {
    var wrapper = document.createElement("div");

    if (this.nextPickups.length == 0) {
      wrapper.innerHTML = this.translate("LOADING");
      wrapper.className = "dimmed light small";
      return wrapper;
    }
    for (i = 0; i < this.nextPickups.length; i++) {

      var pickup = this.nextPickups[i];
      var pickupContainer = document.createElement("div");
      pickupContainer.classList.add("binday-container");

      var dateContainer = document.createElement("span");
      dateContainer.classList.add("binday-date");

      moment.locale();
      var today = moment().startOf("day");
      var pickUpDate = moment(pickup.pickupDate);
      if (today.isSame(pickUpDate)) {
        dateContainer.innerHTML = "Today";
      } else if (moment(today).add(1, "days").isSame(pickUpDate)) {
        dateContainer.innerHTML = "Tomorrow";
      } else if (moment(today).add(7, "days").isAfter(pickUpDate)) {
        dateContainer.innerHTML = this.capFirst(pickUpDate.format("dddd"));
      } else {
        dateContainer.innerHTML = this.capFirst(pickUpDate.format(this.config.dateFormat));
      }

      pickupContainer.appendChild(dateContainer);

      var iconContainer = document.createElement("span");
      iconContainer.classList.add("binday-icon-container");
      iconContainer.appendChild(this.svgIconFactory(pickup.pickupType));

      pickupContainer.appendChild(iconContainer);
      wrapper.appendChild(pickupContainer);

    };

    return wrapper;
  }

});
