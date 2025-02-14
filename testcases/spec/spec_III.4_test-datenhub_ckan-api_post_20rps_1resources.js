"use strict";

import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.1.0/index.js";
import { check } from 'k6';
import exec from 'k6/execution';
import http from 'k6/http';
import { CONFIG } from '../../config/config.js';
import { HTTP_OPTIONS } from '../../config/httpConfig.js';
import { deleteAllRessources, findOrCreateResource } from '../../util/resources.js';

export let options = CONFIG.options;

let scenarios = {
  spec_III_2: {
    executor: "constant-arrival-rate",
    duration: "1m",
    preAllocatedVUs: 30,
    maxVUs: 100,
    rate: 20,
    timeUnit: "1s",
    startTime: "10s"
  }
};
options.scenarios = scenarios;

const CKAN_API_URL = CONFIG.urlTest + CONFIG.ckanAPIPath;
const DATASET_NAME = CONFIG.datasetName;
const RESOURCE_NAME = CONFIG.resourceName;

let resourceData = open('../../example_data/dump.csv', 'b'); //jshint ignore: line

export function setup() {
  let resourceID = findOrCreateResource(CKAN_API_URL, DATASET_NAME, RESOURCE_NAME, resourceData);
  return resourceID;

}

export default function (data) {
  let resourceID = data;
  let url = `${CKAN_API_URL}/datastore_upsert`;
  let payload = JSON.stringify({
    force: "true",
    resource_id: resourceID,
    method: "insert",
    records: [{
      id: exec.vu.idInInstance,
      timestamp: new Date().toISOString(),
      value: randomIntBetween(36, 37)
    }]
  });

  let res = http.post(url, payload, HTTP_OPTIONS);
  check(res, {
    'is status 200 or 201': (r) => r.status === 200 || r.status === 201,
  });
  if (res.status !== 200 && res.status !== 201) {
    console.log(`Response check failed: ${res.status_text}`);
  }
}

export function teardown(data) {
  deleteAllRessources(CKAN_API_URL, DATASET_NAME);
}