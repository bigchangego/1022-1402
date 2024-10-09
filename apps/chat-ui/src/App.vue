<template>
  <div class="flex h-screen">
    <!-- Left Column (Empty) -->
    <div class="w-1/5 bg-gray-100 p-4"></div>

    <!-- Center Column (Chat) -->
    <div class="flex flex-col w-3/5 bg-black text-white p-4">
      <div class="flex-grow overflow-y-auto mb-4">
        <ul>
          <li v-for="(conv, index) in conversations" :key="index" class="mb-2">
            <strong>用户:</strong> {{ conv.user }}<br/>
            <strong>AI:</strong> {{ conv.ai }}
          </li>
        </ul>
      </div>
      <div class="flex items-center mt-auto">
        <textarea v-model="message" placeholder="输入您的消息" class="input flex-grow mr-2 p-2 rounded bg-gray-800 text-white resize-none"></textarea>
        <button 
          @click="sendMessage"
          :disabled="!message || !model || loading"
          class="button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {{ loading ? '发送中...' : '发送' }}
        </button>
      </div>
    </div>

    <!-- Right Column (Configuration) -->
    <div class="w-1/5 bg-gray-200 p-4">
      <h2 class="text-lg font-bold mb-4">配置V1</h2>
      <select v-model="model" class="select w-full mb-4 p-2 rounded bg-white text-black">
        <option v-for="(model, index) in modelOptions" :key="index" :value="model.value">{{ model.label }}</option>
      </select>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      message: '',
      model: '', // Default model
      models: [
        { provider: 'baidu', name: 'ernie-4.0-8k-latest' },
        { provider: 'baidu', name: 'ernie-3.0' },
        { provider: 'alicloud', name: 'qianyi-tongwen-v1' },
        { provider: 'alicloud', name: 'qianyi-tongwen-v2' }
      ],
      conversations: [],
      loading: false // Loading state for send button
    };
  },
  computed: {
    modelOptions() {
      return this.models.map(model => ({
        value: model,
        label: `${model.name} (${model.provider})`
      }));
    }
  },
  methods: {
    async sendMessage() {
      console.log('sendMessage called');
      
      if (!this.message || !this.model) {
        console.log('Message or model is empty');
        return;
      }

      const apiUrl = `${process.env.VUE_APP_FUNCTIONCAT_SYSTEM_URL}/apps/chatapi/chat`;
      console.log('API URL:', apiUrl);

      try {
        this.loading = true; // Set loading state to true
        const response = await axios.post(apiUrl, {
          message: this.message,
          provider: this.model.provider,
          model: this.model.name
        });

        console.log('Response:', response.data);

        this.conversations.push({
          user: this.message,
          ai: response.data.response
        });

        this.message = '';
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        this.loading = false; // Reset loading state
      }
    }
  },
  created() {
    // Automatically select the first model when the component is created
    if (this.models.length > 0) {
      this.model = this.models[0];
    }
  }
};
</script>
