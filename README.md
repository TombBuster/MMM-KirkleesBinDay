MMM-KirkleesBinDay
Magic Mirror Module to display bin collection details from Kirklees Council's API

Screenshot

Installation
Clone this repository in your modules folder, and install dependencies:

cd ~/MagicMirror/modules 
git clone https://github.com/TombBuster/MMM-KirkleesBinDay.git
cd MMM-KirkleesBinDay
npm install 
Configuration
Go to the MagicMirror/config directory and edit the config.js file. Add the module to your modules array in your config.js.

You'll need your uprn (Unique Property Reference Number) for the Kirklees API. I had to intercept the request using BurpSuite to find this, there may be an easier way.

Enter this in the config.js for your MagicMirror installation:

    {
        module: 'MMM-WestBerksBinDay',
        position: 'top_left',
        header: 'Bin Day',
        config: {
            uprn: "123456789",
            dateFormat: "dddd D MMMM"
        }
    },
Module configuration
The module only has two possible configuration options:

Option	Description
uprn	Unique Property Reference Number for your house.

Default: undefined
dateFormat	Format to use for the date of events

Default: dddd D MMMM (e.g. January 18)
Possible values: See https://momentjs.com/

Thanks
This whole module is shamelessly stolen from https://github.com/hdurdle/MMM-WestBerksBinDay. I've just modified the API call.
