<template>
  <v-container class="fill-height pa-0">
    <v-row class="no-gutters elevation-4">
      <v-col cols="auto" class="flex-grow-1 flex-shrink-0">
        <v-card flat class="d-flex flex-column fill-height">
          <v-card-title>
            Brelag Support Chatbot
          </v-card-title>
          <v-card v-if="!productChoice">
            <v-card-title>
              Mit welcher Produktreihe können wir Ihnen helfen?
            </v-card-title>
            <v-card-text>
              <v-container>
                <v-row>
                  <v-col cols="12" sm="6" v-for="(product, index) in products" :key="index">
                    <v-card :style="'background-color: #414141; color: white'">
                      <v-card-title>{{ product.name }}
                        <v-img :src="product.imageSrc" aspect-ratio="1.7"></v-img>
                      </v-card-title>
                      <v-card-text>{{ product.description }}</v-card-text>
                      <v-card-actions>
                        <v-btn color="white" variant="outlined" @click="productChoice = product">Auswählen</v-btn>
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

              <template v-for="(chat, i) in chatHistory">
                <div :class="'d-flex flex-row-reverse'" v-if="chat.inputs.chat_input">
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
              <v-btn v-if="showContactFormOption" class="mt-4 primary" color="red" variant="outlined"
                @click="showContactForm = true">
                Support kontaktieren
              </v-btn>
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
import { Ref, ref, nextTick, watch, onMounted } from 'vue';
import { processChatGPTResponse, checkShowContactForm } from './util';
import { MessageHistory, Product } from './types';
import ContactForm from './ContactForm.vue';
import { SSE } from 'sse.js';
import axios from 'axios';

const loading = ref(false);
const snackbar = ref(false);
const showContactForm = ref(false);
const showContactFormOption = ref(false);
const productChoice: Ref<Product | null> = ref(null);
const errorMessage = ref("");

const startMessage = "Hallo, wie kann ich Ihnen helfen?";

const chatHistory: Ref<MessageHistory> = ref([{ inputs: { chat_input: undefined }, outputs: { chat_output: startMessage } }]);
const messageForm = ref({ content: "", me: true });
const url = "https://corsproxy.io/?https://styler-ml-jjneg.switzerlandnorth.inference.ml.azure.com/score";
const proxyUrl = "http://localhost:8010/proxy/score";
const apiUrl = "https://stylerapimanagement.azure-api.net/score"
const apiKey = "iuTLmfTdZxifVCIviIwz9jW3NQniRjgw";

const products: Product[] = [
  { value: 'dominoswiss', name: 'Dominoswiss', description: 'MX FE ULTRA, MX FE PRO, MaxFlex, LX RLUP1A, etc ..', imageSrc: 'https://raw.githubusercontent.com/Brelag-Schweiz-AG/Chatbot-Support-UI/master/docs/assets/dominoswiss.png' },
  { value: 'knockautx', name: 'KnockautX', description: 'Sturzsensor, Thermostat, LED E14, Shaky, etc ...', imageSrc: 'https://raw.githubusercontent.com/Brelag-Schweiz-AG/Chatbot-Support-UI/master/docs/assets/knockautx.png' },
  // { name: 'Andere', description: 'Knockaut Titan, Paystar, Apps, etc ...', imageSrc: 'src/assets/knockautx.png' },
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
    "product_line": productChoice.value?.value,
    "chat_input": messageForm.value.content,
    "chat_history": chatHistory.value
  };

  chatHistory.value.push({
    inputs: { chat_input: messageForm.value.content },
    outputs: { chat_output: undefined }

  });

  messageForm.value.content = "Brelag SupportBot antwortet..."

  const useApi = true;
  let response = {
    data: {
      // chat_output: "Mit dem MaxFlex Sender können Sie Ihr individuelles Gebäude steuern und nutzen. Dank des modularen Systems und der wechselbaren Tastenkappen können Sie den Funktaster so konfigurieren, dass er alle Funktionen, Szenarien und Routinen Ihres Gebäudes steuert (Source: 1XiYER5-dEN6AntkGcbG-pKeSNyRCd6mR__MANUAL_Dominoswiss_MaxFlex_v1.1.pdf)."
      // chat_output: "Ich kann ihnen leider nicht helfen. {{SHOW_CONTACT_FORM}}"
      chat_output: "Der Dominoswiss MX FE ULTRA hat die Abmessungen 51 x 51 x 16.5 mm ohne Federzugklemme und 51 x 51 x 19.5 mm mit Federzugklemme (Source: azureml://locations/switzerlandnorth/workspaces/8fa915ff-765f-47cd-8d2d-605decf9e9b0/data/Anleitungen_DominoSwiss/versions/1/1n3Xt40gg5STAOuCOKV2IiXjzgxEAPFta__Dominoswiss MX FE ULTRA_Produktblatt_Brelag Schweiz AG.pdf). Bitte beachten Sie, dass die genauen asföalsjdföas. Und danach kommt nochmal so eine Source (Source: azureml://locations/switzerlandnorth/workspaces/8fa915ff-765f-47cd-8d2d-605decf9e9b0/data/Anleitungen_DominoSwiss/versions/1/1n3Xt40gg5STAOuCOKV2IiXjzgxEAPFta__Dominoswiss MX FE ULTRA_Produktblatt_Brelag Schweiz AG.pdf)."

    }
  }

  const chatLength = chatHistory.value.length - 1
  chatHistory.value[chatLength].outputs = { chat_output: "" };
  const source = new SSE(apiUrl, {
    headers: {
      "Accept": "text/event-stream",
      "Authorization": "Bearer " + apiKey,
      "Ocp-Apim-Subscription-Key": "39ae1ae82dfb47838bf1f8ccacf67a50"
    },
    payload: JSON.stringify(requestBody),
    start: false
  });
  let streamMessage = ""
  let isProcessing = false
  let isFirstMessage = true
  source.addEventListener('message', async (e: any) => {
    const data = JSON.parse(e.data);
    const newData = data.chat_output;
    streamMessage += newData
    const isEndMessage = newData === "" && !isFirstMessage
    isFirstMessage = false

    if (isProcessing && !isEndMessage) return
    // If it's still processing the last message, wait for isProcessing to be false
    while (isProcessing) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    isProcessing = true

    const streamMessageCopy = streamMessage

    const { showForm, parsedResponse } = checkShowContactForm(streamMessageCopy)
    showContactFormOption.value = showForm

    const parsedHtml = await processChatGPTResponse(parsedResponse);

    chatHistory.value[chatLength].outputs.chat_output = parsedHtml;
    isProcessing = false
    if (isEndMessage) {
      source.close()
      loading.value = false
      messageForm.value.content = ""
    }
  });
  source.stream()
  return;
  // This was the code for the old non-streaming api approach
  try {
    if (useApi) {
      response = await axios.post(apiUrl, requestBody, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey,
          "Ocp-Apim-Subscription-Key": "39ae1ae82dfb47838bf1f8ccacf67a50"
        }
      });
    }

    console.log({ response })
    const { showForm, parsedResponse } = checkShowContactForm(response.data.chat_output)
    showContactFormOption.value = showForm
    console.log(showContactForm)
    response.data.chat_output = parsedResponse

    const parsedHtml = await processChatGPTResponse(response.data.chat_output);
    console.log({ parsedHtml })

    const output = parsedHtml
    chatHistory.value[chatHistory.value.length - 1].outputs = { chat_output: output };
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
