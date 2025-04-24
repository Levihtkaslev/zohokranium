const cron = require('node-cron');
const { scheduleTokenRefresh } = require("./modulefunctions/refresh")
const { zohocontact } = require("./modulefunctions/contacts");
const { zohobreakup } = require("./modulefunctions/breakup");
const { zohototal } = require("./modulefunctions/total");

const main = async () => {
    try {
        await scheduleTokenRefresh();
        await Promise.all([ 
             await zohocontact(),    
             await zohototal(),   
            await zohobreakup(),      
        ])
        
    } catch (error) {
        console.log("Error while executing zoho :", error)
    }
};

 console.log("Current date:", new Date().toISOString().split('T')[0])

 console.log("Will start at 01:00 AM") 

 cron.schedule('0 1 * * *', async () => {
    console.log('Runs Dayfirst 1st minute');
    try {
       
        await main(); 
        console.log("Process Finished at :", new Date().toLocaleString());
        console.log("Again Runs at 01:00 AM")

    } catch (error) {
      console.error('Error during scheduled task:', error);
    }
  },
  {
    timezone: "Asia/Kolkata"
  }
);        