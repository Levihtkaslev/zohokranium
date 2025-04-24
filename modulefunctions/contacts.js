const axios = require('axios');
require('dotenv').config();
const USERNAME = process.env.ZOHO_USERNAME;
const PASSWORD = process.env.PASSWORD;
const { getAccessToken } = require('./refresh');

const apis = require("../apifunctions");


async function zohocontact() {
   console.log("Touched Contacts function")
    const clientId = await apis.getKranClientId(USERNAME, PASSWORD);
    if (!clientId) return;
  
    const token = await apis.getKranBearerToken(clientId);
    if (!token) return;
  
    const accessToken = getAccessToken();
    console.log("fff",accessToken)
    const contacts = await apis.getZohoContacts(accessToken);
    /* const existinguhid = new Set(contacts.map(contact => contact.UHID || "")); */
  
    if (!contacts || contacts.length === 0) {
      console.log('No contacts found in Zoho.');
      return;
    }
  
    for (const contact of contacts) {
  
      const uhid = contact.UHID; 
      const contactId = contact.id; 
  
      if (!uhid) continue; 
  
      const thirdPartyDetails = await apis.getKranPersonal(token, uhid );
      if (!thirdPartyDetails) continue;
  
      
  
      const updatedData = {
        Last_Name: thirdPartyDetails.name,
        Referred_Type: thirdPartyDetails.reftype,
        Referred_By:thirdPartyDetails.refby,
        Address:thirdPartyDetails.address,
        KGender:thirdPartyDetails.gender,
        Date_of_Birth:thirdPartyDetails.dob,
        Contact:thirdPartyDetails['mob no'],
        Marital_status:thirdPartyDetails['marital status'],
        KAge:thirdPartyDetails.age,
        Nationality:thirdPartyDetails.nationality,
        Kranium_registered: thirdPartyDetails['reg date/time'],
        Email:thirdPartyDetails['email id']
      };
  
      await apis.updateZohoContact(accessToken, contactId, updatedData);
    }
  }

  module.exports = { zohocontact }