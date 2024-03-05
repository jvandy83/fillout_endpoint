require("dotenv").config();

const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

const pageCount = (responses) => {
  if (responses > 0 && responses <= 20) {
    return 1;
  } else {
    return responses / 20;
  }
};

const apiKey = process.env.API_KEY;

const satisfiesCondition = (operand1, operand2, operator) => {
  switch (operator) {
    case "equals":
      return operand1 === operand2;
    case "does_not_equal":
      return operand1 != operand2;
    case "greater_than":
      return operand1 > operand2;
    case "less_than":
      return operand1 < operand2;
  }
};

/*
limit(optional) - the maximum number of responses to retrieve per request. Must be a number between 1 and 150. Default is 150.
afterDate (optional) - a date string to filter responses submitted after this date
beforeDate (optional) - a date string to filter responses submitted before this date
offset(optional) - the starting position from which to fetch the responses. Default is 0.
status(optional) - pass in_progress to get a list of in-progress (unfinished) submissions. By default, only finished submissions are returned.
includeEditLink (optional) - pass true to include a link to edit the submission as editLink
sort (optional) - can be asc or desc, defaults to asc
*/

// Define endpoint for fetching filtered responses
app.get("/:formId/filteredResponses", async (req, res) => {
  try {
    const formId = req.params.formId;

    // Parse and validate filters from query parameters
    const filters = req.query.filters ? JSON.parse(req.query.filters) : [];

    console.log("FILTERS: ", filters);

    // Fetch responses from Fillout.com's API
    const response = await axios.get(
      `https://api.fillout.com/v1/api/forms/${formId}/submissions`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        params: {
          filters: JSON.stringify(filters),
        },
      }
    );

    const { responses } = response.data;

    let filteredResponse = [];

    for (let response of responses) {
      const { questions } = response;

      questions.map((question) => {
        let passesFilters;

        const { id, value } = question;

        for (let filter of filters) {
          passesFilters = true;

          const {
            id: queryId,
            condition: queryCondition,
            value: queryValue,
          } = filter;

          const isValid = satisfiesCondition(queryValue, value, queryCondition);

          console.log("***IS_VALID***: ", isValid);

          if (id !== queryId || !isValid) {
            passesFilters = false;
          }
        }

        if (passesFilters) {
          console.log("QUESTION: ", question);

          filteredResponse.push(question);
        } else {
          return;
        }
      });
    }

    console.log("FILTERED RESPONSE: ", filteredResponse);

    const results = {
      responses: {
        questions: filteredResponse,
        totalResponses: filteredResponse.length,
        pageCount: pageCount(filteredResponse.length),
      },
    };

    // Send the filtered responses back to the client
    // res.send("ok");
    res.json(results);
  } catch (error) {
    console.error("Error fetching filtered responses:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
