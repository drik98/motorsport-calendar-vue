// Server API makes it possible to hook into various parts of Gridsome
// on server-side and add custom data to the GraphQL data layer.
// Learn more: https://gridsome.org/docs/server-api/

// Changes here require a server restart.
// To restart press CTRL + C in terminal and run `gridsome develop`

const nodeExternals = require('webpack-node-externals')
const { google } = require('googleapis')


// key for google sheets
const AUTH_KEY = process.env.AUTH_KEY
// id of the google sheet
const SPREADSHEET_ID = process.env.SPREADSHEET_ID

function formatDate(input) {
  return input.trim().split(".").reverse().join("-");
}

function createJcal(api, races) {
  const jcal = ["vcalendar",
    [
      ["version", {}, "text", "2.0"],
      ["prodid", {}, "text", "-//Microsoft Corporation//Outlook 14.0 MIMEDIR//EN"]
    ],
    races.map(race => {
      const duration = race.Rennen.includes("24") ? 24 : 2;
      const start = race.date.replace(" ", "T");
      return [
        "vevent",
        [
          ["uid", {}, "text", race.id],
          ["dtstamp", {}, "date-time", start],
          ["dtstart", {}, "date-time", start],
          ["dtend", {}, "date", race.Ende],
          ["duration", {}, "duration", `PT${duration}H`],
          ["summary", { "language": "de-DE" }, "text", race.Rennen],
          ["description", {}, "text", race.Informationen],
          ["location", {}, "text", race.Ort]
        ]
      ];
    })
  ];
  api.configureServer(app => {
    app.get('/jcal.json', (req, res) => {
      res.send(jcal);
    })
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
