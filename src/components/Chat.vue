<template>
  <v-container class="fill-height pa-0 ">
    <v-row class="no-gutters elevation-4">
      <v-col cols="auto" class="flex-grow-1 flex-shrink-0">
        <v-card flat class="d-flex flex-column fill-height">
          <v-card-title>
            [TEST] Support Chatbot
          </v-card-title>
          <v-card-text class="flex-grow-1 overflow-y-auto">
            <v-chip elevation="2" dark style="height:auto;white-space: normal;border-radius: 0px" class="pa-4 mb-2">
              {{ startMessage }}
            </v-chip>

            <template v-for="(chat, i) in chatHistory">
              <div :class="'d-flex flex-row-reverse'">
                <v-chip elevation="2" :color="'primary'" dark style="height:auto;white-space: normal;border-radius: 0px" class="pa-4 mb-2">
                  {{ chat.inputs.chat_input }}
                </v-chip>
              </div>
              <div>
                <v-chip elevation="2" dark style="height:auto;white-space: normal;border-radius: 0px" class="pa-4 mb-2">
                  {{ chat.outputs.chat_output }}
                </v-chip>
              </div>
            </template>
            <v-col v-if="loading" cols="6">
              <v-skeleton-loader :elevation="0" color="" type="paragraph"></v-skeleton-loader>
            </v-col>
          </v-card-text>
          <v-card-text class="flex-shrink-">
            <v-text-field :loading="loading" :disabled="loading" v-model="messageForm.content" label="Ihre Nachricht..." type="text" no-details outlined
              append-outer-icon="send" @keyup.enter="sendMessage()" @click:append-outer="sendMessage()" hide-details />
            <v-btn class="mt-2" prepend-icon="mdi-send" :disabled="!messageForm.content || loading" @click="sendMessage()"> Senden
            </v-btn>
          </v-card-text>
        </v-card>
        <v-snackbar
          v-model="snackbar"
        >
          {{ errorMessage }}

          <template v-slot:actions>
            <v-btn
              color="pink"
              variant="text"
              @click="snackbar = false"
            >
              Close
            </v-btn>
          </template>
        </v-snackbar>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
type MessageHistory = {
  inputs: {
    chat_input: string;
  };
  outputs: {
    chat_output: string;
  };
}[]

import axios from 'axios';
import { Ref, ref } from 'vue';

const loading = ref(false);
const snackbar = ref(false);
const errorMessage = ref("");

const startMessage = "Hallo, wie kann ich Ihnen helfen?";

const chatHistory: Ref<MessageHistory> = ref([]);
const messageForm = ref({ content: "", me: true });

[
  {
    'inputs': {'chat_input': 'hi¨'},
    'outputs': {'chat_output': 'Hello! How can I assist you today?'}
  },
  {
    'inputs': {'chat_input': 'Hallo können wir auch deutsch?'},
    'outputs': {'chat_output': 'Ja, wir können auf Deutsch kommunizieren. Wie kann ich Ihnen helfen?'}
  }
]

const sendMessage = async () => {
  errorMessage.value = "";

  if (messageForm.value.content.trim() == "") {
    return;
  }

  loading.value = true;

  const requestBody = {
    "chat_input": messageForm.value.content,
    "chat_history": chatHistory.value
  };

  const requestHeaders = new Headers({ "Content-Type": "application/json" });
  const apiKey = "iuTLmfTdZxifVCIviIwz9jW3NQniRjgw";
  if (!apiKey) {
    throw new Error("A key should be provided to invoke the endpoint");
  }
  requestHeaders.append("Authorization", "Bearer " + apiKey)

  // This header will force the request to go to a specific deployment.
  // Remove this line to have the request observe the endpoint traffic rules
  requestHeaders.append("azureml-model-deployment", "styler-ml-jjneg-2");
  const url = "https://corsproxy.io/?https://styler-ml-jjneg.switzerlandnorth.inference.ml.azure.com/score";
  const proxyUrl = "http://localhost:8010/proxy/score"

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey,
        "azureml-model-deployment": "styler-ml-jjneg-2"
      }
    });
    console.log({response})
    const output = response.data.chat_output;

    chatHistory.value.push({
      inputs: { chat_input: messageForm.value.content },
      outputs: { chat_output: output }
    });
    messageForm.value.content = "";

  } catch (error) {
    errorMessage.value = `An error occurred while sending the message: ${error}`;
    snackbar.value = true;
    console.log('error')
  }

  loading.value = false;
}
</script>
