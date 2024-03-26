<template>
  <v-container v-if="formSubmitted">
    <v-chip elevation="2" color="light-green-darken-2" dark style="height:auto;white-space: normal;border-radius: 0px" class="pa-4 mb-2">
      Es scheint, als ob unser Chatbot Ihnen nicht weiter helfen kann. Bitte füllen Sie das Formular aus,
      damit sich einer unserer Mitarbeiter bei Ihnen melden kann. Der Chatverlauf wird dabei an uns übermittelt.
    </v-chip>

    <v-form ref="form" v-model="valid" lazy-validation>
      <!-- Name Field -->
      <v-text-field
        v-model="name"
        :rules="nameRules"
        label="Vorname & Name *"
        required
      ></v-text-field>

      <!-- Company Name Field -->
      <v-text-field
        v-model="companyName"
        label="Firma (optional)"
      ></v-text-field>

      <!-- Email Field -->
      <v-text-field
        v-model="email"
        :rules="emailRules"
        label="E-Mail *"
        required
      ></v-text-field>

      <!-- Phone Number Field -->
      <v-text-field
        v-model="phoneNumber"
        label="Telefon für Rückruf (optional)"
        type="tel"
      ></v-text-field>

      <!-- Submit Button -->
      <v-btn :disabled="!valid" @click="submitForm">Absenden</v-btn>
      <v-btn @click="resetForm">Zurück</v-btn>
    </v-form>


  </v-container>
  <template v-else>
    <v-chip elevation="2" color="light-green-darken-2" dark style="height:auto;white-space: normal;border-radius: 0px" class="pa-4 mb-2">
      Ihre Anfrage wurde erfolgreich übermittelt. Ein Mitarbeiter wird sich in Kürze bei Ihnen melden.
    </v-chip>

  </template>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { VForm } from 'vuetify/components';

const props = defineProps({
  chatHistory: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['reset']);

const formSubmitted = ref(false);
const valid = ref(true);
const name = ref('');
const companyName = ref('');
const email = ref('');
const phoneNumber = ref('');

const nameRules = [(v: string) => !!v || 'Name ist benötigt'];
const emailRules = [
  (v: string) => !!v || 'E-mail ist benötigt',
  (v: string) => /.+@.+\..+/.test(v) || 'E-Mail muss gültig sein',
];

const form = ref<VForm | null>(null);

const submitForm = async () => {
  if (form.value) {
    // Await the promise returned by the validate method
    const result = await form.value.validate();

    // result.valid will be true or false based on the validation
    if (result.valid) {
      // Handle form submission, e.g., send data to an API
      console.log('Form submitted', {
        name: name.value,
        companyName: companyName.value,
        email: email.value,
        phoneNumber: phoneNumber.value,
        chatHistory: props.chatHistory,
      });
      // TODO: Send form data to an API

      // Show message that form was submitted
      formSubmitted.value = true;
    }
  }
};

const resetForm = () => {
  if (form.value) {
    form.value.reset();
    emit('reset');
  }
};
</script>
