const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const axios = require('axios');

const app = express();
app.use(express.static("public"));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.render("landing");
});

// Route to delete DNS records
app.post("/delete-dns-records", async (req, res) => {
    const CLOUDFLARE_API_TOKEN = req.body.CLOUDFLARE_API_TOKEN;
    const ZONE_ID = req.body.ZONE_ID;

    // Function to get all DNS records for the zone
    async function getDNSRecords() {
        try {
            const response = await axios.get(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`, {
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data.result;
        } catch (error) {
            console.error('Error fetching DNS records:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // Function to delete a DNS record by ID
    async function deleteDNSRecord(recordId) {
        try {
            await axios.delete(`https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${recordId}`, {
                headers: {
                    'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`Deleted record ID: ${recordId}`);
            return recordId;
        } catch (error) {
            console.error(`Error deleting record ID ${recordId}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // Function to delete all DNS records
    async function deleteAllDNSRecords() {
        try {
            const records = await getDNSRecords();
            let deletedRecords = [];
            for (const record of records) {
                const deletedId = await deleteDNSRecord(record.id);
                deletedRecords.push(deletedId);
            }
            console.log('All DNS records have been deleted.');
            return { success: true, deletedRecords };
        } catch (error) {
            console.error('Error in deleting DNS records:', error.message);
            return { success: false, message: 'Error in deleting DNS records.' };
        }
    }

    try {
        const result = await deleteAllDNSRecords();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: "An error occurred while deleting DNS records." });
    }
});

// 404 error handler
app.use((req, res, next) => {
    res.status(404).render('404', {
        url: req.originalUrl
    });
});

// 500 error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500', {
        error: err,
        showError: true
    });
});

// Start the server
app.listen("3000", () => {
    console.log("server running on port 3000");
});
