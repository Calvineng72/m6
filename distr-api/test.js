// Define the URL of the localhost endpoint you want to send the request to
const url = 'http://localhost:3000/store/put'; // Change the port number if your server is running on a different port

const distribution = require('../distribution');

// Define the data you want to send (optional)

let func = () => {
  console.log('hi');
};

const data = {
  key: 'funnc',
  value: func,
};

// Define options for the fetch request (optional)
const options = {
  method: 'POST', // HTTP method, can be GET, POST, PUT, DELETE, etc.
  headers: {
    'Content-Type': 'application/json',
  },
  body: distribution.util.serialize(data), // Convert JS object to JSON string
};

// Send the request using fetch
fetch(url, options)
    .then((response) => {
      console.log(response);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json(); // Parse the JSON response
    })
    .then((data) => {
      console.log('Response:', data); // Output the response data
    })
    .catch((error) => {
      console.error('There was a problem with the fetch operation:', error);
    });
