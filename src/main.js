// This is the main.js file. Import global CSS and scripts here.
// The Client API can be used here. Learn more: gridsome.org/docs/client-api

import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import Dark from '~/layouts/Dark'

export default function (Vue, { appOptions, head }) {
  // Vuetify uses Google's Roboto font and Material Design Icons
  // embedd them here
  head.link.push({
    rel: 'stylesheet',
    href: 'https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css',
  })
  
  head.link.push({
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900',
  });


  
  //opts includes, vuetify themes, icons, etc.
  const opts = {} 
  Vue.use(Vuetify)
  
  appOptions.vuetify = new Vuetify(opts);
  
  // Set default layout as a global component
  Vue.component('Layout', Dark)
}