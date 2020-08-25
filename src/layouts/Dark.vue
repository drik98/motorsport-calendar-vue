<template>
  <v-app id="inspire">
    

    <v-app-bar app clipped-left>
      <v-toolbar-title>{{ $static.metadata.siteName }}</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container class="fill-height" fluid>
        <slot />
      </v-container>
    </v-main>

    <v-footer app class="justify-space-between">
      <span>&copy; {{ new Date().getFullYear() }}</span>
      <span>Hendrik Schmitz</span>
    </v-footer>
  </v-app>
</template>

<static-query>
query {
  metadata {
    siteName
  }
}
</static-query>

<script>
export default {
  props: {
    source: String,
  },
  data: () => ({
    drawer: null,
  }),
  created() {
    this.$vuetify.theme.dark = true;
  },
};
</script>