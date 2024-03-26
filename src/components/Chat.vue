<template>
  <v-container class="fill-height pa-0">
    <v-row class="no-gutters elevation-4">
      <v-col cols="auto" class="flex-grow-1 flex-shrink-0">
        <v-card flat class="d-flex flex-column fill-height">
          <v-card-title>
            [TEST] Support Chatbot
          </v-card-title>
          <v-card v-if="!productChoice">
            <v-card-title>
              Mit welcher Produktreihe können wir Ihnen helfen?
            </v-card-title>
            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="4" v-for="(product, index) in products" :key="index">
                    <v-card>
                      <v-card-title>{{ product.name }}

                        <v-img :src="product.imageSrc" aspect-ratio="1.8"></v-img>
                      </v-card-title>
                      <v-card-text>{{ product.description }}</v-card-text>
                      <v-card-actions>
                        <v-btn color="primary" @click="productChoice = product">Auswählen</v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>
              </v-container>
            </v-card-text>
          </v-card>

          <template v-if="productChoice && !showContactForm">
            <v-card-text class="flex-grow-1 overflow-y-auto">

              <div>
                <v-chip elevation="2" dark color="teal-darken-2"
                  style="height:auto;white-space: normal;border-radius: 0px" class="pa-4 mb-2">
                  Ausgewählte Produktreihe: {{ productChoice.name }}
                </v-chip>
              </div>

              <v-chip elevation="2" dark style="height:auto;white-space: normal;border-radius: 0px" class="pa-4 mb-2">
                {{ startMessage }}
              </v-chip>

              <template v-for="(chat, i) in chatHistory">
                <div :class="'d-flex flex-row-reverse'">
                  <v-chip elevation="2" :color="'primary'" dark
                    style="height:auto;white-space: normal;border-radius: 0px" class="pa-4 mb-2">
                    {{ chat.inputs.chat_input }}
                  </v-chip>
                </div>
                <div v-if="chat.outputs.chat_output">
                  <v-chip elevation="2" dark style="height:auto;white-space: normal;border-radius: 0px"
                    class="pa-4 mb-2 pl-8">
                    <div v-html="chat.outputs.chat_output"></div>
                  </v-chip>
                </div>
              </template>
              <v-col v-if="loading" cols="6">
                <v-skeleton-loader :elevation="0" color="" type="paragraph"></v-skeleton-loader>
              </v-col>
            </v-card-text>
            <v-card-text class="flex-shrink-">
              <v-text-field :loading="loading" :disabled="loading" v-model="messageForm.content"
                label="Ihre Nachricht..." type="text" no-details outlined append-outer-icon="send"
                @keyup.enter="sendMessage()" @click:append-outer="sendMessage()" hide-details />
              <v-btn class="mt-2" prepend-icon="mdi-send" :disabled="!messageForm.content || loading"
                @click="sendMessage()"> Senden
              </v-btn>
            </v-card-text>

          </template>

          <div v-if="showContactForm">
            <ContactForm :chatHistory="chatHistory" @reset="showContactForm = false" />
          </div>
        </v-card>


        <v-snackbar v-model="snackbar">
          {{ errorMessage }}

          <template v-slot:actions>
            <v-btn color="pink" variant="text" @click="snackbar = false">
              Close
            </v-btn>
          </template>
        </v-snackbar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import axios from 'axios';
import { Ref, ref, nextTick, watch, onMounted } from 'vue';
import { processChatGPTResponse, checkShowContactForm } from './util';
import { MessageHistory, Product } from './types';
import ContactForm from './ContactForm.vue';

const loading = ref(false);
const snackbar = ref(false);
const showContactForm = ref(false);
const productChoice: Ref<Product | null> = ref(null);
const errorMessage = ref("");

const startMessage = "Hallo, wie kann ich Ihnen helfen?";

const chatHistory: Ref<MessageHistory> = ref([]);
const messageForm = ref({ content: "", me: true });
const url = "https://corsproxy.io/?https://styler-ml-jjneg.switzerlandnorth.inference.ml.azure.com/score";
const proxyUrl = "http://localhost:8010/proxy/score";
const apiKey = "iuTLmfTdZxifVCIviIwz9jW3NQniRjgw";

const products: Product[] = [
  { name: 'Dominoswiss', description: 'MX FE ULTRA, MX FE PRO, MaxFlex, LX RLUP1A, etc ..', imageSrc: 'src/assets/dominoswiss.png' },
  { name: 'KnockautX', description: 'Sturzsensor, Thermostat, LED E14, Shaky, etc ...', imageSrc: 'src/assets/knockautx.png' },
  { name: 'Andere', description: 'Knockaut Titan, Paystar, Apps, etc ...', imageSrc: 'src/assets/knockautx.png' },
]

const sendMessage = async () => {
  if (!apiKey) {
    throw new Error("A key should be provided to invoke the endpoint");
  }

  if (messageForm.value.content.trim() == "") {
    return;
  }

  errorMessage.value = "";
  loading.value = true;

  const requestBody = {
    "chat_input": messageForm.value.content,
    "chat_history": chatHistory.value
  };

  chatHistory.value.push({
    inputs: { chat_input: messageForm.value.content },
    outputs: { chat_output: undefined }

  });

  messageForm.value.content = "Brelag Support antwortet..."

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
        "azureml-model-deployment": "styler-ml-jjneg-2"
      }
    });
    /*
    const response = {
      data: {
        chat_output: "Um eine KnockautX LED-Leuchtmittel zu installieren, befolgen Sie bitte die folgenden Schritte:\n\n1. Laden Sie die kostenlose KnockautX App aus dem Google Play Store oder dem iOS App Store herunter.\n2. Erstellen Sie einen neuen Benutzeraccount (folgen Sie dazu den Schritten in der App).\n3. Nehmen Sie das KnockautX Master Gateway TWO gemäss entsprechender Gebrauchsanleitung in Betrieb.\n4. Schrauben Sie das LED-Leuchtmittel in eine Leuchte oder Lampe mit entsprechender Fassung des Typs E27 oder E14, je nach Modell des Leuchtmittels.\n5. Schliessen Sie die Leuchte oder Lampe an die Stromversorgung an und schalten Sie sie ein.\n6. Das LED-Leuchtmittel beginnt für 6 Sekunden lang zu blinken und geht danach automatisch für 3 Minuten in den Kopplungsmodus.\n7. Wechseln Sie nun zu Ihrem Smartphone, öffnen Sie die KnockautX App und führen Sie die Schritte in Abschnitt 5 durch.\n\nBitte beachten Sie, dass die genauen Schritte je nach Modell des Leuchtmittels variieren können (Source: Gebrauchsanleitung KnockautX LED-Leuchtmittel RGB Full Color E27 9W.pdf, Gebrauchsanleitung KnockautX LED-Leuchtmittel RGB Full Color E14 6W.pdf)."
        // chat_output: "{{SHOW_CONTACT_FORM}}"
      }
    }
    */


    console.log({ response })
    showContactForm.value = checkShowContactForm(response.data.chat_output)

    if (!showContactForm.value) {
      const parsedHtml = await processChatGPTResponse(response.data.chat_output);
      console.log({ parsedHtml })

      const output = parsedHtml
      chatHistory.value[chatHistory.value.length - 1].outputs = { chat_output: output };
    }
  } catch (error) {
    errorMessage.value = `An error occurred while sending the message: ${error}`;
    snackbar.value = true;
    console.log('error')
  }
  messageForm.value.content = "";

  loading.value = false;
}

// Create a method to scroll to the bottom of the chat container
const scrollToBottom = () => {
  nextTick(() => {
    window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
  });
};

// Call the scrollToBottom method whenever a new message is added
watch(chatHistory.value, () => {
  scrollToBottom();
}, { immediate: true });

onMounted(scrollToBottom);

</script>
