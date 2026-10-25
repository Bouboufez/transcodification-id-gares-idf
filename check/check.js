import { readFileSync } from "fs";
import proj4 from "proj4";

console.log("Downloading IDFM data (main)...");
const idfmReq1 = await fetch(
  "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/zones-de-correspondance/exports/json?lang=fr&timezone=Europe%2FBerlin",
);

if (!idfmReq1.ok) {
  throw new Error(
    idfmReq1.status +
      " " +
      idfmReq1.statusText +
      ": " +
      (await idfmReq1.text()),
  );
}

const idfmRes1 = await idfmReq1.json();

/* Format
 ** [{
 **  "zdcid": "71359",
 **  "zdcversion": "1113509",
 **  "zdccreated": "2014-12-29T01:00:00+01:00",
 **  "zdcchanged": "2026-10-13T14:26:18+02:00",
 **  "zdcname": "Gare de l'Est",
 **  "zdcxepsg2154": 652960,
 **  "zdcyepsg2154": 6864323,
 **  "zdctown": "Paris 10e",
 **  "zdcpostalregion": "75110",
 **  "zdctype": "railStation"
 ** }]
 */

console.log("Downloading IDFM data (areas)...");
const idfmReq2 = await fetch(
  "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/zones-d-arrets/exports/json?lang=fr&timezone=Europe%2FBerlin",
);

if (!idfmReq2.ok) {
  throw new Error(
    idfmReq2.status +
      " " +
      idfmReq2.statusText +
      ": " +
      (await idfmReq2.text()),
  );
}

const idfmRes2 = await idfmReq2.json();

console.log("Downloading IDFM data (stops)...");
const idfmReq3 = await fetch(
  "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/arrets/exports/json?lang=fr&timezone=Europe%2FBerlin",
);

if (!idfmReq3.ok) {
  throw new Error(
    idfmReq3.status +
      " " +
      idfmReq3.statusText +
      ": " +
      (await idfmReq3.text()),
  );
}

const idfmRes3 = await idfmReq3.json();

console.log("Downloading IDFM data (lines)...");
const idfmReq4 = await fetch(
  "https://data.iledefrance-mobilites.fr/api/explore/v2.1/catalog/datasets/arrets-lignes/exports/json?lang=fr&timezone=Europe%2FBerlin",
);

if (!idfmReq4.ok) {
  throw new Error(
    idfmReq4.status +
      " " +
      idfmReq4.statusText +
      ": " +
      (await idfmReq4.text()),
  );
}

const idfmRes4 = await idfmReq4.json();

console.log("Downloading SNCF data...");
const sncfReq = await fetch(
  "https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/liste-des-gares/exports/json?lang=fr&timezone=Europe%2FParis",
);

if (!sncfReq.ok) {
  throw new Error(
    sncfReq.status + " " + sncfReq.statusText + ": " + (await sncfReq.text()),
  );
}

const sncfRes = await sncfReq.json();

// We download both SNCF Réseau and Trainline data, since each source is missing some stops... (SNCF tends to ignore RATP RER stops data, Trainline tends to ignore some tram-train or recent stops)
console.log("Downloading Trainline data...");
const trainlineReq = await fetch(
  "https://raw.githubusercontent.com/trainline-eu/stations/refs/heads/master/stations.csv",
);

if (!trainlineReq.ok) {
  throw new Error(
    trainlineReq.status +
      " " +
      trainlineReq.statusText +
      ": " +
      (await trainlineReq.text()),
  );
}

const trainlineRes = await trainlineReq.text();

// Contains surprisingly enriched data about IDF stations!
console.log("Fetching TER data...");
// /!\ WARNING /!\ : file must be downloaded manually first in this directory!
// https://www.ter.sncf.com/_next/data/DtFt70D_mtuFYZsfhU2D0/normandie/se-deplacer/gares/liste-des-gares.json,
// The website has strong mechanisms to prevent bots and scripts to access its files 
const terFile = readFileSync("./liste-des-gares.json", "utf8");

const terData = JSON.parse(terFile);

console.log("Indexing data...");
function csvTojson(csv) {
  const keys = csv.split("\n")[0].split(";");
  const res = [];

  for (const line of csv.split("\n").slice(1)) {
    const elts = line.split(";");
    if (elts.length < 2) {
      continue;
    }
    const obj = {};
    for (let i = 0; i < keys.length; i++) {
      obj[keys[i]] = elts[i];
    }
    res.push(obj);
  }
  return res;
}

function indexBy(list, key) {
  const res = {};

  for (const elt of list) {
    if (elt[key] == undefined) {
      throw new Error("No key " + key + " in object " + JSON.stringify(elt));
    }
    if (elt[key] == "") {
      continue;
    }
    res[elt[key]] = elt;
  }

  return res;
}

// FIRST STEP: check that the current data is valid
const idfmData = indexBy(idfmRes1, "zdcid");
const idfmAreaData = indexBy(idfmRes2, "zdaid");
const idfmStopData = indexBy(idfmRes3, "arrid");
const idfmLineData = idfmRes4;
const sncfData = indexBy(sncfRes, "code_uic");
const trainlineData = indexBy(csvTojson(trainlineRes), "uic8_sncf");

// IDs manually checked by hand that are officially ok even of they appear nowhere in datasources
const safe_uic = [
  87733089, 87745091, 87746032, 87697359, 87723171, 87732735, 87732743,
  87744359, 87754853, 87754861, 87754879, 87766634, 87694240, 87716860,
  87716878, 87765230,
];

console.log("Opening transcodification file...");
const file = readFileSync("../transcodification.csv", "utf8");
const indexByUic = {};
const indexByZdc = {};

for (const line of file.split("\n").slice(1)) {
  const elts = line.split(";");

  const uic8 = elts[0];
  const zdc = elts[1];
  const name = elts[2];

  // Index for future checks
  indexByUic[uic8] = line;
  indexByZdc[zdc] = line;

  // Check if these IDs are known
  if (idfmData[zdc] == undefined) {
    console.error("Transcodification " + line.trim() + " has unknown zdc!");
  }
  if (
    sncfData[uic8] == undefined &&
    trainlineData[uic8] == undefined &&
    safe_uic.includes(parseInt(uic8)) == false
  ) {
    // This should complain about TramTrain stops that are tram stops and not train stops
    console.error("Transcodification " + line.trim() + " has unknown uic8!");
  }

  // Check if coordinates are close
  if (idfmData[zdc] && (sncfData[uic8] || trainlineData[uic8] == undefined)) {
    const lambert93 =
      "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";
    const wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";

    const [idfmLon, idfmLat] = proj4(lambert93, wgs84, [
      idfmData[zdc].zdcxepsg2154,
      idfmData[zdc].zdcyepsg2154,
    ]);

    const sncfLon = sncfData[uic8]?.x_wgs84 ?? trainlineData[uic8]?.longitude;
    const sncfLat = sncfData[uic8]?.y_wgs84 ?? trainlineData[uic8]?.latitude;

    // 2 digits after the comma, precision of ~1.1km
    if (
      Math.abs(idfmLon - sncfLon) * 100 >= 1 ||
      Math.abs(idfmLat - sncfLat) * 100 >= 1
    ) {
      console.warn(
        "Different coordinates for transcodification " +
          line.trim() +
          "! IDFM: " +
          idfmLon +
          "," +
          idfmLat +
          " vs SNCF/Trainline: " +
          sncfLon +
          "," +
          sncfLat,
      );
      // Acceptable warnings
      // - Auneau and Rungis (multiples entries on SNCF data, this script doesn't take the right one :/)
      // - Mouroux (train and bus station not close at all, it's okay)
    }
  }
}

// SECOND STEP: check that IDFM data is exhaustive
console.log("Checking for missing ZDC...");
const linesToCheck = [
  "IDFM:C01742", // RER A
  "IDFM:C01743", // RER B
  "IDFM:C01727", // RER C
  "IDFM:C01728", // RER D
  "IDFM:C01729", // RER E

  "IDFM:C01737", // Transilien H
  "IDFM:C01739", // Transilien J
  "IDFM:C01738", // Transilien K
  "IDFM:C01740", // Transilien L
  "IDFM:C01736", // Transilien N
  "IDFM:C01730", // Transilien P
  "IDFM:C01731", // Transilien R
  "IDFM:C01741", // Transilien U
  "IDFM:C02711", // Transilien V

  "IDFM:C01843", // T4
  "IDFM:C01999", // T11
  "IDFM:C02529", // T12
  "IDFM:C02344", // T13
  "IDFM:C02732", // T14

  "IDFM:C01849",
  "IDFM:C02442", // Bus RER A
  "IDFM:C01850", // Bus RER B
  "IDFM:C01851", // Bus RER C
  "IDFM:C01852", // Bus RER D
  "IDFM:C01853", // Bus RER E

  "IDFM:C01842", // Bus Transilien H
  "IDFM:C01846", // Bus Transilien J
  "IDFM:C01844", // Bus Transilien K
  "IDFM:C01847", // Bus Transilien L
  "IDFM:C01845", // Bus Transilien N
  "IDFM:C01841", // Bus Transilien P
  "IDFM:C01848", // Bus Transilien R
  "IDFM:C01840", // Bus Transilien U

  "IDFM:C01683", // Bus T4
  "IDFM:C02469", // Bus T13
  "IDFM:C02733", // Bus T14

  "IDFM:C01745",
  "IDFM:C01744",
  "IDFM:C02368",
  "IDFM:C01857",
  "IDFM:C01747",
  "IDFM:C01746",
  "IDFM:C01863",
  "IDFM:C01748",
  "IDFM:C02370",
  "IDFM:C02375", // TER
];

for (const lineItem of idfmLineData) {
  if (linesToCheck.includes(lineItem.id)) {
    let stop = lineItem.stop_id.slice(5); // slice(5) to remove "IDFM:" prefix

    if (stop.includes("monomodalStopPlace")) {
      // monomodalStopPlace is directly a ZDA, do nothing
      stop = stop.slice(stop.lastIndexOf(":") + 1);
    } else {
      // Retrieve ZDA for stop id
      if (idfmStopData[stop]) {
        stop = idfmStopData[stop].zdaid;
      } else {
        console.error(
          "Stop ID " + stop + " not found in IDFM static datasets!",
        );
      }
    }

    if (idfmAreaData[stop]) {
      stop = idfmAreaData[stop].zdcid;
    } else {
      console.error(
        "Stop Area ID " + stop + " not found in IDFM static datasets!",
      );
    }

    // Now we found the zdc, check if we have it
    if (indexByZdc[stop] == undefined) {
      console.error(
        "IDFM stop not found: zdc '" +
          stop +
          "', name '" +
          lineItem.stop_name +
          "', line '" +
          lineItem.route_long_name +
          "'",
      );
    }
  }
}

// THIRD STEP: check that SNCF data is exhaustive

// 1st part: check that all stations open to voyagers in a IDF departement is listed, from SNCF data already downloaded
console.log("Checking for missing UIC8: SNCF Réseau data...");
for (const item of sncfRes) {
  if (
    item.voyageurs == "N" ||
    [
      "YVELINES",
      "SEINE-ET-MARNE",
      "VAL-DE-MARNE",
      "SEINE-SAINT-DENIS",
      "HAUTS-DE-SEINE",
      "ESSONNE",
      "VAL-D'OISE",
      "PARIS",
    ].includes(item.departemen) == false
  ) {
    continue;
  }

  if (indexByUic[item.code_uic] == undefined) {
    console.error(
      "UIC8 stop not found in SNCF R data: " +
        item.code_uic +
        " for stop " +
        item.libelle,
    );
  }
}

// 2nd part: check against TER data of IDF stations (will be more complete in some areas, like substitution bus stops for instance)
console.log("Checking for missing UIC8: TER data...");

for (const letter of terData.pageProps.IDFStationsList) {
  for (const stop of letter.stopPlaces) {
    if (indexByUic[stop.id] == undefined) {
      console.error(
        "UIC8 stop not found in TER data: " +
          stop.id +
          " for stop " +
          stop.name,
      );
    }
  }
}
