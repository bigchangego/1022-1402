// apps/backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;
const ALICLOUD_ACCESS_KEY_ID = process.env.ALICLOUD_ACCESS_KEY_ID;
const ALICLOUD_ACCESS_KEY_SECRET = process.env.ALICLOUD_ACCESS_KEY_SECRET;

let baiduAccessToken = null;
let baiduTokenExpiry = null;

app.use(cors());
app.use(bodyParser.json());

// Function to get access token from Baidu
async function getBaiduAccessToken() {
  if (!baiduAccessToken || new Date() >= baiduTokenExpiry) {
    const response = await axios.post(`https://aip.baidubce.com/oauth/2.0/token`, null, {
      params: {
        grant_type: 'client_credentials',
        client_id: BAIDU_API_KEY,
        client_secret: BAIDU_SECRET_KEY,
      },
    });
    console.log("response", response)
    baiduAccessToken = response.data.access_token;
    baiduTokenExpiry = new Date(new Date().getTime() + response.data.expires_in * 1000);
  }
  return baiduAccessToken;
}

// Function to get signature for Alibaba Cloud API requests
function getAlibabaSignature(params, secret) {
  const sortedParams = Object.keys(params).sort().map(key => `${key}=${encodeURIComponent(params[key])}`).join('&');
  const stringToSign = `POST&%2F&${encodeURIComponent(sortedParams)}`;
  return crypto.createHmac('sha1', `${secret}&`).update(stringToSign).digest('base64');
}
app.get('/', async (req, res) => {
    const timestamp = new Date().toISOString(); // Get current time in ISO format

    return res.json({"message": "hello, I'm chat-api", "timestamp": timestamp})
})

app.get('/v', async (req, res) => {
    return res.json("v:1")
})
app.post('/chat', async (req, res) => {
  const { message, provider, model } = req.body;

  try {
    let ai_response;

    if (provider === 'baidu') {
      // Use Baidu ERNIE API
      const accessToken = await getBaiduAccessToken();
      
      const response = await axios.post(
        `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${model}?access_token=${accessToken}`,
        {
          messages: [{ role: "user", content: message }],
          temperature: 0.8,
          top_p: 0.8,
          penalty_score: 1,
          disable_search: false,
          enable_citation: false,
          collapsed: true
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      ai_response = response.data.result;

    } else if (provider === 'alicloud') {
      // Use Alibaba Cloud 千义通问 model family
      const params = {
        Action: 'GetResponse',
        Version: '2020-06-01',
        RegionId: 'cn-hangzhou',
        Text: message,
        ModelName: model,
        Timestamp: new Date().toISOString(),
        Format: 'JSON',
        SignatureMethod: 'HMAC-SHA1',
        SignatureVersion: '1.0',
        AccessKeyId: ALICLOUD_ACCESS_KEY_ID,
        SignatureNonce: Math.random().toString(36).substring(2)
      };

      params.Signature = getAlibabaSignature(params, ALICLOUD_ACCESS_KEY_SECRET);

      const response = await axios.post(
        'https://nlp.cn-hangzhou.aliyuncs.com/',
        null,
        { params }
      );

      ai_response = response.data.Response;

    } else {
      return res.status(400).send('Invalid AI provider specified');
    }

    res.json({ response: ai_response });

  } catch (error) {
    console.error(error);
    res.status(500).send('Error communicating with AI provider');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});