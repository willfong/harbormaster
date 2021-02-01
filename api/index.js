const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const cors = require("cors");
const yaml = require('js-yaml');

const DB = require("./db");
const { response } = require("express");

// Setup
const app = express();
app.use(bodyParser.json());
app.use(cors());

var apiRouter = express.Router();
app.use('/api', apiRouter);

const REGISTRY_HOST = process.env.REGISTRY_HOST || "localhost:5000";
const REGISTRY_URL = `http://${REGISTRY_HOST}/v2`;
console.log(`[CONFIG] REGISTRY_URL: ${REGISTRY_URL}`);
const axios_registry = axios.create({ baseURL: REGISTRY_URL });


const staticPagePath = process.env.STATIC_PAGE_PATH || "../client/dist";
console.log(`[CONFIG] STATIC_PAGE_PATH: ${staticPagePath}`);
app.use(express.static(staticPagePath));

const DOCKER_SOCK = process.env.DOCKER_SOCK || '/var/run/docker.sock';
console.log(`[CONFIG] DOCKER_SOCK: ${DOCKER_SOCK}`);
const axios_docker = axios.create({ socketPath: DOCKER_SOCK });


// Routes
apiRouter.get("/repository/list", async (req, res) => {
  const response = await axios_registry.get("/_catalog");
  return res.json(response.data);
});

apiRouter.get("/repository/tags", async (req, res) => {
  const repository = req.query.repository;
  if (!repository) return res.status(404).send("404 - Please provide a repository");
  const response = await axios_registry.get(`/${repository}/tags/list`);
  return res.json(response.data);
});

apiRouter.post("/repository/deploy", async (req, res) => {
  const repository = req.body.repository;
  if (!repository) return res.status(403).send("401 - Please provide a repository");
  const tag = req.body.tag;
  if (!tag) return res.status(403).send("402 - Please provide a tag");

  const Image = `${REGISTRY_HOST}/${repository}:${tag}`;

  let extraConfig;
  try {
    const results = await DB.all("SELECT yaml FROM configs WHERE name = ?", [repository]).catch(console.error);
    const yamlConfig = results[0].yaml;
    extraConfig = yaml.load(yamlConfig, { json: true });
  } catch (e) {
    console.log(e);
  }

  try {
    console.log(`[${repository}] Stopping container...`);
    await axios_docker.post(`/v1.41/containers/${repository}/stop`, {})
  } catch (e) {
    if (e.response.data.message && !e.response.data.message.startsWith('No such container')) {
      console.log('error from stop', e.response.data.message);
    }
  }

  try {
    console.log(`[${repository}] Deleting ontainer...`);
    await axios_docker.delete(`/v1.41/containers/${repository}`);
  } catch (e) {
    if (!e.response.data.message.startsWith('No such container')) {
      console.log('error from delete', e.response.data.message);
    }
  }
  try {
    console.log(`[${repository}] Creating container using '${Image}'...`)
    const params = { Image, ...extraConfig };
    await axios_docker.post('/v1.41/containers/create', params, { params: { name: repository } });
  } catch (e) {
    console.log('error from create', e.response);
  }

  try {
    console.log(`[${repository}] Starting container...`)
    await axios_docker.post(`/v1.41/containers/${repository}/start`, {});
  } catch (e) {
    console.log('error from start', e.response);
  }

  return res.json("ok");
});

apiRouter.get("/repository/status", async (req, res) => {
  const repository = req.query.repository;
  if (!repository) return res.status(403).send("401 - Please provide a repository");
  try {
    console.log(`[${repository}] Getting container status...`);
    const response = await axios_docker.get(`/v1.41/containers/${repository}/json`, {})
    return res.json(response.data);
  } catch (e) {
    console.log("Full Error getting status")
    console.log(e);
    if (e.response.data && !e.response.data.message.startsWith('No such container')) {
      console.log('error from getting status', e.response.data.message);
    }
  }
  return res.json(false);
});

apiRouter.get("/repository/config", async (req, res) => {
  const repository = req.query.repository;
  if (!repository) return res.status(404).send("404 - Please provide a repository");
  const results = await DB.all("SELECT yaml FROM configs WHERE name = ?", [repository]).catch(console.error);
  return res.json(results[0]);
});

apiRouter.post("/repository/config", async (req, res) => {
  const repository = req.body.repository;
  if (!repository) return res.status(404).send("404 - Please provide a repository");
  const config = req.body.config;
  if (!config) return res.status(404).send("404 - Please provide the config");
  const results = await DB.run("INSERT INTO configs (name, yaml) VALUES (?,?) ON CONFLICT(name) DO UPDATE SET yaml = ?", [repository, config, config]).catch(console.error);
  return res.json(results);
});

apiRouter.get("/deploy", async (req, res) => {
  const repository = req.query.repository;
  if (!repository) return res.status(404).send("404 - Please provide a repository");
  const repoKey = `${DEPLOY_PREFIX}-${repository}`;
  const repoResponse = await getAsync(repoKey).catch(console.error);
  const repo = JSON.parse(repoResponse);
  const configKey = `${CONFIG_PREFIX}-${repository}`;
  const configReponse = await getAsync(configKey).catch(console.error);
  const config = JSON.parse(configReponse);
  return res.json({ tag: repo.tag, config: config.config });
});

app.use(function (req, res, next) {
  console.log("404:", req.originalUrl);
  res.status(404).send("404 - We don't have what you're asking");
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("500 - Sorry, we need to fix something");
});

// Start Service
const port = 5000;
app.listen(port, () => {
  console.log(`API server started: http://localhost:${port}`);
});

//curl --unix-socket /Users/willfong/.docker/run/docker-cli-api.sock -H "Content-Type: application/json" -d '{"Image": "redis:5-buster"}' -X POST http://localhost/v1.41/containers/create
//curl --unix-socket /private/var/run/docker.sock -H "Content-Type: application/json" -d '{"Image": "redis:5-buster"}' -X POST http://localhost/v1.41/containers/create
