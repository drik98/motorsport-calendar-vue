<template>
  <Layout>
    <v-container>
      <v-row justify="center">
        <v-col class="headline text-center">Motorsportrennen im Zeitraum</v-col>
      </v-row>
      <v-row justify="center">
        <v-col cols="12" sm="6" md="2">
          <v-dialog
            ref="dialogVon"
            v-model="modalVon"
            :return-value.sync="dateVon"
            persistent
            width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="dateVon"
                label="Von"
                prepend-icon="mdi-calendar"
                readonly
                v-bind="attrs"
                v-on="on"
              ></v-text-field>
            </template>
            <v-date-picker v-model="dateVon" scrollable>
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="modalVon = false">Cancel</v-btn>
              <v-btn text color="primary" @click="$refs.dialogVon.save(dateVon)">OK</v-btn>
            </v-date-picker>
          </v-dialog>
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-dialog
            ref="dialogBis"
            v-model="modalBis"
            :return-value.sync="dateBis"
            persistent
            width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="dateBis"
                label="Bis"
                prepend-icon="mdi-calendar"
                readonly
                v-bind="attrs"
                v-on="on"
              ></v-text-field>
            </template>
            <v-date-picker v-model="dateBis" scrollable>
              <v-spacer></v-spacer>
              <v-btn text color="primary" @click="modalBis = false">Cancel</v-btn>
              <v-btn text color="primary" @click="$refs.dialogBis.save(dateBis)">OK</v-btn>
            </v-date-picker>
          </v-dialog>
        </v-col>
      </v-row>
    </v-container>
    <v-timeline :dense="toggleTimeLineDense">
      <v-timeline-item
        v-for="row in $page.allRennen.edges"
        :key="row.node.id"
        :icon="'mdi-flag-checkered'"
        :color=" Date.parse(row.node.date) < Date.now() ? 'grey': 'deep-orange'"
        v-if="Date.parse(row.node.date) >= Date.parse(dateVon) && Date.parse(row.node.date) <= Date.parse(`${dateBis} 23:59:59`) "
      >
        <span slot="opposite">{{row.node.Datum}}</span>
        <v-card class="elevation-2">
          <v-card-title class="headline">{{row.node.Rennen}}</v-card-title>
          <v-card-subtitle>{{row.node.Informationen}}</v-card-subtitle>
          <v-card-text class="renn-infos">
            <v-row v-if="row.node.Rennserie">
              <v-col md="3">
                <v-icon>mdi-car-multiple</v-icon>Rennserie:
              </v-col>
              <v-col md="9">{{row.node.Rennserie}}</v-col>
            </v-row>
            <v-row v-if="row.node.Ort">
              <v-col md="3">
                <v-icon>mdi-map-marker-radius</v-icon>Austragungsort:
              </v-col>
              <v-col md="9">{{row.node.Ort}}</v-col>
            </v-row>
            <v-row v-if="row.node.Rennstart">
              <v-col md="3">
                <v-icon>mdi-traffic-light</v-icon>Rennstart:
              </v-col>
              <v-col md="9">
                <span v-if="toggleTimeLineDense">{{row.node.Datum}}</span>
                {{row.node.Rennstart}}
              </v-col>
            </v-row>
            <v-row v-if="row.node.TV_und_Livestream">
              <v-col md="3">
                <v-icon>mdi-youtube-tv</v-icon>Übertragung:
              </v-col>
              <v-col md="9">{{row.node.TV_und_Livestream}}</v-col>
            </v-row>
            <v-row v-if="row.node.public_viewing">
              <v-col md="3">
                <v-icon>mdi-account-multiple</v-icon>Public viewing:
              </v-col>
              <v-col md="9">{{row.node.public_viewing}}</v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-timeline-item>
    </v-timeline>
  </Layout>
</template>

<page-query>
query {
  allRennen(sortBy: "date" order: ASC) {
    edges {
      node {
        id
        date
        Rennen
        Rennstart
        Datum
        Rennserie
        Ort
        TV_und_Livestream
        Informationen
        public_viewing
      }
    }
  }
}
</page-query>

<script>
const curr = new Date(); // get current date
const first = curr.getDate() - curr.getDay() + 1;

const firstday = new Date(curr.setDate(first));
const lastday = new Date(curr.setDate(firstday.getDate() + 6));

export default {
  metaInfo: {
    title: "Ansicht",
  },
  data: () => ({
    dateVon: firstday.toISOString().substr(0, 10),
    dateBis: lastday.toISOString().substr(0, 10),
    modalVon: false,
    modalBis: false,
    toggleTimeLineDense: false,
  }),
  mounted() {
    this.$nextTick(function () {
      window.addEventListener("resize", this.setToggleTimeLineDense);

      //Init
      this.setToggleTimeLineDense();
    });
  },
  methods: {
    setToggleTimeLineDense(event) {
      this.toggleTimeLineDense = document.documentElement.clientWidth < 576;
    },
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.setToggleTimeLineDense);
  },
};
</script>

<style>
.v-timeline {
  width: 100%;
  padding: 10%;
}

.renn-infos .col-md-9.col {
  font-weight: bold;
}

.v-card__title.headline {
  word-break: normal;
}
@media (max-width: 480px) {
  .renn-infos .row {
    flex-direction: column;
  }

  .v-card__title.headline {
    font-size: 1.1em !important;
  }
}
</style>
