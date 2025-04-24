const axios = require('axios');
require('dotenv').config();
const USERNAME = process.env.ZOHO_USERNAME;
const PASSWORD = process.env.PASSWORD;
const { getAccessToken } = require('./refresh');

const apis = require("../apifunctions");

async function calculateEncounterTotals(encounters) {
    const encounterTotals = new Map();
    encounters.forEach(enc => {
      const encounterId = enc.Encno;
      const totalPrice = parseFloat(enc['Total price']) || 0;
      encounterTotals.set(encounterId, (encounterTotals.get(encounterId) || 0) + totalPrice);
    });
    return encounterTotals;
  }


async function zohobreakup() {
    
    const clientId = await apis.getKranClientId(USERNAME, PASSWORD);
    if (!clientId) return;
  
    const token = await apis.getKranBearerToken(clientId);
    if (!token) return;

    const accessToken = getAccessToken();
    console.log("fff",accessToken)
  
  
    const contacts = await apis.getZohoContacts(accessToken);
    const existingDeals = (await apis.getZohoDeals(accessToken)) || [];
    const existingEncounters = new Set(existingDeals.map(deal => deal.Encounter || ""));
  
    const locations = [91, 92, 90];
  
    for (const contact of contacts) {
      const uhid = contact.UHID;
      if (!uhid) continue;
  
      for (const locationId of locations) {
        const encounters = await apis.getEncounters(token, uhid, locationId);
        if (!Array.isArray(encounters)) {
          /* console.log(`No encounters found for UHID: ${uhid} at location: ${locationId}`); */
          continue;
        }
  
        const encounterTotals = await calculateEncounterTotals(encounters);
  
        for (const [encounterId, totalPrice] of encounterTotals) {
          const encounterData = encounters.find(enc => enc.Encno === encounterId);
          if (!existingEncounters.has(encounterId)) {
            await apis.createZohoDeal(accessToken, {
              Patient_Name: encounterData['Patient name'],
              BreakUP_Revenue_Name : uhid.toString(),
              UHID: encounterData['UHID'].toString(),
              Encounter: encounterData.Encno,
              Doctor_Name: encounterData['Doctor name'],
              Speciality: encounterData['Speciality name'],
              Bill_Type: encounterData['Billing type'],
              Location: encounterData['Location name'],
              Patient_Type: encounterData['Patient type'],
              Total_Amount: Number(totalPrice.toFixed(2)),
              Bill_Date : encounterData['Fromdate'],
              Lead_Source_Details : contact['Lead_Source_Details'],
              Lead_Source: contact['Lead_Source'],
              Lead_Source_Category : contact['Lead_Source_Category'],
              BRAND: contact['Type_of_Lead'],
              BillDate : encounterData['Fromdate'],
              Campaign_Name:contact?.['Campaign_Name1']?.['name'] || 'No data'
            });
            existingEncounters.add(encounterId);
          }
        }
      }
    }
  }

  module.exports = { zohobreakup };