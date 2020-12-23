// Server API makes it possible to hook into various parts of Gridsome
// on server-side and add custom data to the GraphQL data layer.
// Learn more: https://gridsome.org/docs/server-api/

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const nodeExternals = require('webpack-node-externals')
const { google } = require('googleapis')
const path = require('path');
const fs = require('fs');
const ics = require('ics')
const moment = require('moment-timezone');

// key for google sheets
const AUTH_KEY = process.env.AUTH_KEY
// id of the google sheet
const SPREADSHEET_ID = process.env.SPREADSHEET_ID

function formatDate(input) {
  return input.trim().split(".").reverse().join("-");
}

function createJcal(api, races) {

  const { error, value } = ics.createEvents(
    races.map(race => {
      const duration = race.Rennen.includes("24") ? 24 : 2;
      const start = moment.tz(`${race.Start}${race.Rennstart?`T${race.Rennstart}`:''}`, "Europe/Berlin");
      let ende = moment.tz(race.Ende, "Europe/Berlin");
      if(start.isSame(ende) || duration==24) {
        ende = moment(start).add(duration, "hours");
      }
      return {
        title: race.Rennen,
        start: start.utc().format('YYYY-M-D-H-m').split("-"),
        end: ende.utc().format('YYYY-M-D-H-m').split("-"),
        description: race.Informationen,
        location: race.Ort,
        startInputType: 'utc',
        endInputType: 'utc'
      };
    })
  );
  
  if (error) {
    console.log(error)
    return
  }

  api.afterBuild(async ({ config }) => {
    const outFile = path.join(config.outputDir, 'ical.ics')
    await fs.writeFile(outFile, value, ()=>{});
  })
}

module.exports = function (api) {

  api.loadSource(async actions => {

    // acces data from google sheets using api key
    const spreadsheetData = google.sheets({
      version: 'v4',
      auth: AUTH_KEY
    })

    const spreadsheets = [
      {
        spreadsheetId: SPREADSHEET_ID,
        sheets: [
          {
            sheetName: "Motorsportkalender",
            collectionName: "Rennen", // (Must be unique)
            mapper: value => {
              const split = value.Datum.split("-");
              value.Start = formatDate(split[0])
              value.Ende = split.length > 1 ? formatDate(split[1]) : value.Start;
              value.date = `${value.Start} ${value.Rennstart}`.trim()
              return value;
            },
            sorter: (a, b) => {
              return Date.parse(a.date) - Date.parse(b.date)
            },
            createJcal: createJcal
          }
        ]
      }
    ]

    spreadsheets.forEach(spreadsheet => {
      spreadsheet.sheets.forEach(sheet => {
        api.loadSource(async actions => {
          const collection = actions.addCollection(sheet.collectionName)

          await spreadsheetData.spreadsheets.values
            .get({
              spreadsheetId: spreadsheet.spreadsheetId,
              range: `'${sheet.sheetName}'`,
            })
            .then(response => {
              const sheetData = response.data.values
              const titles = sheetData.shift()
              const nodes = sheetData.map((value, nodeIndex) => {
                return titles.reduce(
                  (title, key, index) => ({
                    ...title,
                    [key]: value[index],
                    id: nodeIndex,
                  }),
                  {}
                )
              })

              // get the date from Datum and Rennstart field
              nodes
                .map(sheet.mapper)
                .sort(sheet.sorter)
                .map(value => {
                  collection.addNode(value)
                })

              sheet.createJcal(api, nodes);
            })
            .catch(err => console.log(err))
        })
      })
    })
  })


  api.chainWebpack((config, { isServer }) => {
    if (isServer) {
      config.externals([
        nodeExternals({
          allowlist: [/^vuetify/]
        })
      ])
    }
  })

  api.createPages(({ createPage }) => {
    // Use the Pages API here: https://gridsome.org/docs/pages-api/
  })


}
