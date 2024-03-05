require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

const apiKey = process.env.API_KEY;

// Define endpoint for fetching filtered responses
app.get("/:formId/filteredResponses", async (req, res) => {
  try {
    const formId = req.params.formId;
    console.log(formId);

    // Parse and validate filters from query parameters
    const filters = req.query.filters ? JSON.parse(req.query.filters) : [];
    console.log(filters);

    // Fetch responses from Fillout.com's API
    const response = await axios.get(
      `https://api.fillout.com/v1/api/forms/${formId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        params: {
          filters: JSON.stringify(filters),
        },
      }
    );

    // Send the filtered responses back to the client
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching filtered responses:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
