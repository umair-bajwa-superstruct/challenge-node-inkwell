// Currency conversion utility

// For tests, stub conversion to avoid live API calls
async function convertToTTD ({ amount }) {
  // Return a fixed conversion rate for tests
  return amount * 7
}

module.exports = { convertToTTD }
