const axios = require('axios');
require('dotenv').config();


async function getKranClientId(USERNAME, PASSWORD) {
  console.log("Touched kranium 1st gate - client id")
    try {
      const response = await axios.get('http://192.168.2.15/prashanth_api/integrate.php', {
        headers: {
          USERNAME: USERNAME,
          PASSWORD: PASSWORD
        }
      });
      console.log("Kranium client id obtained")
      /* console.log('Client ID:', response.data); */ // Debugging
      return response.data.ClientId; // Ensure correct key
    } catch (error) {
      console.error('Error fetching Client ID:', error?.response?.data || error.message);
    }
  }

  async function getKranBearerToken(clientId) {
    console.log("Touched kranium 2nd gate - token")
    try {
      const response = await axios.get('http://192.168.2.15/prashanth_api/login.php', {
        headers: {
          clientID: clientId
        }
      });
      /* console.log('Bearer Token:', response.data);  */// Debugging
      console.log("Kranium token obtained")
      return response.data.Accesstoken;
    } catch (error) {
      console.error('Error fetching Bearer Token:', error?.response?.data || error.message);
    }
  }

  async function getKranPersonal(token, uhid) {
    try {
      const response = await axios({
        method: 'get',
        url: 'http://192.168.2.15/prashanth_api/',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { 
            uhid, 
            request_type : "getregisterdata" 
        }
      });
      /* console.log('UHID Details:', response.data); */
      return response.data;
    } catch (error) {
      console.error('Error fetching UHID details:', error?.response?.data || error.message);
    }
  }

  async function getEncounters(token, uhid, locationId) {
    
    try {
      const response = await axios.get('http://192.168.2.15/prashanth_api/', {
        headers: { Authorization: `Bearer ${token}` },
        data: { uhid, locationid: locationId, request_type: 'getbillingdata', fromdate : "2024-05-01", /* todate : new Date().toISOString().split('T')[0]  */}
      });
      
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching encounters for UHID ${uhid} at location ${locationId}:`, error?.response?.data || error.message);
    }
  }

  const refreshAccessToken = async () => {
    console.log("Refresh token area touched")
    try {
      const response = await axios.post('https://accounts.zoho.in/oauth/v2/token', null, {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token',
        },
      });
  
      console.log('Access Token:', response.data.access_token);
      return response.data.access_token
    } catch (error) {
      console.error('Error refreshing token:', error.response ? error.response.data : error.message);
    }
  };

  async function getZohoContacts(accessToken) {
    console.log("ZOHO Contact data fetching area touched")
    try {
      let allContacts = [];
      let page = 1;
      const perPage = 200; // Max limit per page
  
      while (true) {
        const response = await axios.get('https://www.zohoapis.in/crm/v2/Contacts', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { page, per_page: perPage } // Pagination params
        });
  
        const contacts = response.data.data || [];
        allContacts = allContacts.concat(contacts);
  
        /*   console.log(contacts)   */
        console.log(`Fetched ${contacts.length} contacts from page ${page}`);
  
        if (contacts.length < perPage) break; 
  
        page++;
      }
       /* console.log(allContacts)  */
      console.log(`Total contacts fetched: ${allContacts.length}`);
      return allContacts;
  
    } catch (error) {
      console.error('Error fetching Zoho contacts:', error?.response?.data || error.message);
    }
  }

  async function getZohoDeals(accessToken) {
    console.log("ZOHO Breakup data fetching area touched")
    try {
      let allDeals = [];
      let page = 1;
      const perPage = 200; // Max limit per page
  
      while (true) {
        const response = await axios.get('https://www.zohoapis.in/crm/v2/BreakUP_Revenue', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { page, per_page: perPage } // Pagination params
        });
        /*  console.log( response.data.data)  */
        const deals = response.data.data || [];
        allDeals = allDeals.concat(deals);
        
        console.log(`Fetched ${deals.length} deals from page ${page}`);
  
        if (deals.length < perPage) break; // Stop if fewer than 200 deals are returned
  
        page++;
      }
  
      console.log(`Total deals fetched: ${allDeals.length}`);
      return allDeals;
  
    } catch (error) {
      console.error('Error fetching Zoho deals:', error?.response?.data || error.message);
    }
  }

  async function getZohoAccounts(accessToken) {
    console.log("ZOHO total data fetching area touched")
    try {
      let allAccounts = [];
      let page = 1;
      const perPage = 200; 
  
      while (true) {
        const response = await axios.get('https://www.zohoapis.in/crm/v2/Total_Revenue', {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { page, per_page: perPage } 
        });
  
        const accounts = response.data.data || [];
        allAccounts = allAccounts.concat(accounts);
  
        console.log(`Fetched ${accounts.length} accounts from page ${page}`);
  
        if (accounts.length < perPage) break; 
  
        page++;
      }
  
      console.log(`Total accounts fetched: ${allAccounts.length}`);
      return allAccounts;
  
    } catch (error) {
      console.error('Error fetching Zoho accounts:', error?.response?.data || error.message);
    }
  }


  let = contactcount = 0
  async function updateZohoContact(accessToken, contactId, updatedData ) {
    
    try {
      const response = await axios.put(
        `https://www.zohoapis.in/crm/v2/Contacts/${contactId}`,
        { data: [updatedData] },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`, 
            'Content-Type': 'application/json'
          }
        }
      );
      contactcount++
      console.log(`updating contact data count :${contactcount}`, `uhid :, ${contactId}`  )


      console.log('Contact updated:', response.data);  
    } catch (error) {
      console.error('Error updating Zoho contact:', error?.response?.data || error.message);
    }
  }

  let dealcreated = 0;
async function createZohoDeal(accessToken, dealData) {
      /* console.log("api area",dealData)   */
    /* console.log('Total_Amount value:', dealData.Total_Amount); */
    try {
      const response = await axios.post(
        'https://www.zohoapis.in/crm/v2/BreakUP_Revenue',
        {
          data: [{
            Name: dealData.Patient_Name, 
            BreakUP_Revenue_Name: dealData.Patient_Name, 
            UHID: dealData.UHID,
            Encounter: dealData['Encounter'],
            Doctor_Name: dealData.Doctor_Name,
            Speciality: dealData.Speciality,
            Bill_Type: dealData.Bill_Type,
            Location: dealData.Location,
            Patient_Type: dealData.Patient_Type,
            Total_Amount: Math.floor(Number(dealData.Total_Amount)) || 0, 
            Bill_Date : dealData.Bill_Date,
            Lead_Source_Details : dealData.Lead_Source_Details,
            Lead_Source: dealData.Lead_Source,
            Lead_Source_Category : dealData.Lead_Source_Category,
            BRAND : dealData.BRAND,
            BillDate: dealData.BillDate,
            Campaign_Name:dealData['Campaign_Name']
          }]
        },
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      
      /*   console.log("response:", response.data.data) */
        /* console.log('Zoho API response:', JSON.stringify(response.data, null, 2)); */
      /*  console.log(JSON.stringify(response.data.data))  */  
      dealcreated++;
      console.log(`Breakup created: ${dealcreated}`);
    } catch (error) {
      console.error('Error creating Zoho deal:', error?.response?.data || error.message);
    }
  }

  let dealscount = 0;
  let failedDeals = 0;
  
  async function upsertZohoAccount(accessToken, accountData) {
    try {
      const response = await axios.post(
        'https://www.zohoapis.in/crm/v2/Total_Revenue/upsert',
        { data: accountData },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Count successful deals
      dealscount++;
      console.log(`✅ Total revenue created/updated: ${dealscount}`);
     /*  console.log('Account upserted:', JSON.stringify(response.data)); */
  
      // Check for errors in the response
      /* console.log('🔍 Zoho API Response:', JSON.stringify(response.data, null, 2)); */

      if (response.data && response.data.data) {
        const errors = response.data.data.filter(item => item.status === "error");
        if (errors.length > 0) {
          failedDeals += errors.length;
          errors.forEach(err => {
            console.error('❌ Zoho Error details:', JSON.stringify(err, null, 2));
          });
        } else {
          console.log('✅ Successful Zoho upsert:'/* , response.data.data */);
        }
      }
      
    } catch (error) {
      failedDeals++;
      console.error(`❌ Error upserting Zoho account (Deal #${failedDeals}):`, error?.response?.data || error.message);
    }
  }
  


  module.exports = { 
                        getKranClientId, getKranBearerToken, getKranPersonal, getEncounters, 
                        refreshAccessToken, getZohoContacts, getZohoDeals, getZohoAccounts, 
                        updateZohoContact, createZohoDeal, upsertZohoAccount
                    };
