/**
 * Flask Bridge — HTTP client that forwards requests to the Python Flask API.
 */

const axios = require("axios");

const FLASK_BASE = process.env.FLASK_URL || "http://localhost:5001";

const flaskClient = axios.create({
  baseURL: FLASK_BASE,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

async function flaskGet(path, params = {}) {
  try {
    const res = await flaskClient.get(path, { params });
    return res.data;
  } catch (err) {
    console.error(`[Flask GET ${path}]`, err.message);
    throw new Error(`ML service error: ${err.message}`);
  }
}

async function flaskPost(path, body = {}) {
  try {
    const res = await flaskClient.post(path, body);
    return res.data;
  } catch (err) {
    console.error(`[Flask POST ${path}]`, err.message);
    throw new Error(`ML service error: ${err.message}`);
  }
}

module.exports = { flaskGet, flaskPost };
