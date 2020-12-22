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
              <v-btn text color="primary" @click="modalVon = false"
                >Cancel</v-btn
              >
              <v-btn text color="primary" @click="$refs.dialogVon.save(dateVon)"
                >OK</v-btn
              >
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
              <v-btn text color="primary" @click="modalBis = false"
                >Cancel</v-btn
              >
              <v-btn text color="primary" @click="$refs.dialogBis.save(dateBis)"
                >OK</v-btn
              >
            </v-date-picker>
          </v-dialog>
        </v-col>
      </v-row>
    </v-container>
    <v-timeline :dense="toggleTimeLineDense">
      <v-timeline-item
        v-for="race in selectedEvents"
        :key="race.id"
        :icon="'mdi-flag-checkered'"
        :color="Date.parse(race.date) < Date.now() ? 'grey' : 'deep-orange'"
      >
        <span slot="opposite">{{ race.Datum }}</span>
        <v-card
          class="elevation-2"
          :disabled="Date.parse(race.date) < Date.now()"
        >
          <v-card-title class="headline">{{ race.Rennen }}</v-card-title>
          <v-card-subtitle>{{ race.Informationen }}</v-card-subtitle>
          <v-card-text class="renn-infos">
            <v-row v-show="race.Rennserie">
              <v-col md="3">
                <v-icon>mdi-car-multiple</v-icon>Rennserie:
              </v-col>
              <v-col md="9">{{ race.Rennserie }}</v-col>
            </v-row>
            <v-row v-show="race.Ort">
              <v-col md="3">
                <v-icon>mdi-map-marker-radius</v-icon>Austragungsort:
              </v-col>
              <v-col md="9">{{ race.Ort }}</v-col>
            </v-row>
            <v-row v-show="race.Rennstart">
              <v-col md="3">
                <v-icon>mdi-traffic-light</v-icon>Rennstart:
              </v-col>
              <v-col md="9">
                <span v-show="toggleTimeLineDense">{{ race.Datum }}</span>
                {{ race.Rennstart }}
              </v-col>
            </v-row>
            <v-row v-show="race.TV_und_Livestream">
              <v-col md="3">
                <v-icon>mdi-youtube-tv</v-icon>Übertragung:
              </v-col>
              <v-col md="9">{{ race.TV_und_Livestream }}</v-col>
            </v-row>
            <v-row v-show="race.public_viewing">
              <v-col md="3">
                <v-icon>mdi-account-multiple</v-icon>Public viewing:
              </v-col>
              <v-col md="9">{{ race.public_viewing }}</v-col>
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
        Start
        Ende
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
  computed: {
    selectedEvents() {
      const dateVon = Date.parse(this.dateVon);
      const dateBis = Date.parse(`${this.dateBis} 23:59:59`);
      return this.$page.allRennen.edges
        .map((edge) => edge.node)
        .filter((node) => {
          return (
            (Date.parse(node.Start) >= dateVon &&
              Date.parse(node.Start) <= dateBis) ||
            (Date.parse(node.Ende) >= dateVon &&
              Date.parse(node.Ende) <= dateBis)
          );
        });
    },
  },
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
