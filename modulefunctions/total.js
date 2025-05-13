const axios = require('axios');
require('dotenv').config();
const { getAccessToken } = require('./refresh');

const USERNAME = process.env.ZOHO_USERNAME;
const PASSWORD = process.env.PASSWORD;



const apis = require("../apifunctions");



//Calculation for Total bills
function calculateEncounterTotals(encounters) {
   /*  console.log(encounters); */
  
    const locationTotals = {
      90: { ip: 0, op: 0, total: 0 },
      91: { ip: 0, op: 0, total: 0 },
      92: { ip: 0, op: 0, total: 0 }
    };
  
    encounters.forEach(enc => {
      const amount = parseFloat(enc['Total price']) || 0;
      const patientType = enc['Patient type'];
      const location = enc['Location name'];
  
      const locationMap = {
        "CHETPET": 90,
        "VELACHERY": 91,
        "KOLATHUR": 92
      };
  
      const locCode = locationMap[location];
      if (!locCode || !locationTotals[locCode]) return;
  
      locationTotals[locCode].total += amount;
      if (patientType === "IP") {
        locationTotals[locCode].ip += amount;
      } else if (patientType === "OP") {
        locationTotals[locCode].op += amount;
      }
    });

    
  
    return locationTotals;
  }



//=========================================================================MAIN FUNCTION==============================================

async function zohototal() {
    const clientId = await apis.getKranClientId(USERNAME, PASSWORD);
    if (!clientId) return;
  
    const token = await apis.getKranBearerToken(clientId);
    if (!token) return;
  
    

    const accessToken = getAccessToken();
    
    console.log("fff",accessToken)
       const contacts = (await apis.getZohoContacts(accessToken)) || [];  

    /*  const missingUHIDs = [  "910107144","920023169",  "910106956", "910105370", "920042176", "900029149", "900029046", "910032600", "910032600", "900029046", "900030640", "910087786", "910108403", "920023079", "910037314", "910091716", "910101925","910106956", "900031768", "900031770", "920043295", "900031753","900031774", "900031731", "910107380","900031789", "910108552", "900031826", "900031841", "900031731", "910022792", "910107700","910107715","910000884", "910107882", "910108190", "910108051", "910107765", "920043305", "910108478", "900031953", "910109153", "10104104" ]; 

     const contacts = missingUHIDs.map((uhid, index) => ({
      UHID: uhid,
      Last_Name: `Missing${index + 1}`,
    })); */
    
 

    const accounts = (await apis.getZohoAccounts(accessToken)) || [];
    let processedCount = 0;
    let upsertedCount = 0;
    for (const contact of contacts) {
        const uhid = contact.UHID;
        if (!uhid) {
          console.warn(`Contact without UHID:`, contact);
          continue;
      }
      processedCount++;
      
        const totalsByLocation = {
          90: { ip: 0, op: 0, total: 0 },
          91: { ip: 0, op: 0, total: 0 },
          92: { ip: 0, op: 0, total: 0 },
          all: { ip: 0, op: 0, total: 0 }
        };
      
        for (const location of [90, 91, 92]) {
          const encounters = await apis.getEncounters(token, uhid, location);
          /* console.log(`Encounters for UHID ${uhid} at location ${location}:`, encounters); */
          if (!Array.isArray(encounters)) continue;
      
          const locationTotals = calculateEncounterTotals(encounters);
          totalsByLocation[location].ip += locationTotals[location].ip;
          totalsByLocation[location].op += locationTotals[location].op;
          totalsByLocation[location].total += locationTotals[location].total;

        


          totalsByLocation.all.ip += locationTotals[location].ip;
          totalsByLocation.all.op += locationTotals[location].op;
          totalsByLocation.all.total += locationTotals[location].total;
      
          console.log(`Location ${location} -> IP: ${totalsByLocation[location].ip}, OP: ${totalsByLocation[location].op}, Total: ${totalsByLocation[location].total}`);
        }
      
        const existingAccount = accounts.find(acc => acc.UHID === uhid);
        console.log("UhID", contact.UHID)
        console.log("UhID", contact['Last_Name'])
        const accountData = [{
          Name: uhid.toString(),
          UHID: uhid.toString(),
          Patient_Last_Name : contact['Last_Name'],
          Chetpet_Total: Math.ceil(totalsByLocation[90]?.total || 0),
          Chetpet_IP: Math.ceil(totalsByLocation[90]?.ip || 0),
          Chetpet_OP: Math.ceil(totalsByLocation[90]?.op || 0),
          Velachery_Total: Math.ceil(totalsByLocation[91]?.total || 0),
          Velachery_OP: Math.ceil(totalsByLocation[91]?.op || 0),   
          Velachery_IP: Math.ceil(totalsByLocation[91]?.ip || 0),
          Kolathur_Total: Math.ceil(totalsByLocation[92]?.total || 0),
          Kolathur_IP: Math.ceil(totalsByLocation[92]?.ip || 0),
          Kolathur_OP: Math.ceil(totalsByLocation[92]?.op || 0),
          Total_Amount: Math.ceil(totalsByLocation.all?.total || 0),
          IP_Total: Math.ceil(totalsByLocation.all?.ip || 0),
          OP_Total: Math.ceil(totalsByLocation.all?.op || 0),
          Lead_Source_Details : contact['Lead_Source_Details'],
          Lead_Source: contact['Lead_Source'],
          Lead_Source_Category : contact['Lead_Source_Category'],
          Brand: contact['Type_of_Lead'],
          Campaign_Name : contact?.['Campaign_Name1']?.['name'] || 'No data' /* contact['Campaign_Name'] */

        }];
      
        if (existingAccount) accountData[0].id = existingAccount.id;
        /* console.log("📤 Sending account data to Zoho:", JSON.stringify(accountData, null, 2)); */
        
        try {
          if(totalsByLocation.all?.total !== existingAccount?.Total_Amount){
            const result = await apis.upsertZohoAccount(accessToken, accountData);
            if (result && result.success) upsertedCount++;
          }
         
      } catch (error) {
          console.error(`Upsert failed for UHID ${uhid}:`, error.message);
      }
      }
      
}


module.exports = { zohototal }