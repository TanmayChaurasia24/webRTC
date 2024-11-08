import { WebSocketServer, WebSocket } from "ws"; // Import WebSocketServer and WebSocket types from the 'ws' library

// Initialize a new WebSocket server on port 8080
const wss = new WebSocketServer({
  port: 8080,
});

// Define variables for the sender and receiver WebSocket connections
let senderSocket: WebSocket | null = null;
let receiverSocket: WebSocket | null = null;

// Set up an event listener for new client connections to the WebSocket server
wss.on("connection", (ws: WebSocket) => {
  // Log and handle any errors that occur on the WebSocket connection
  ws.on("error", console.error);

  // Send a confirmation message to the client when they first connect
  ws.send("connected to the server");

  // Set up an event listener to handle incoming messages from the client
  ws.on("message", (data: any) => {
    try {
      // Parse the incoming message as JSON
      const message = JSON.parse(data);

      // Assign WebSocket connections for sender and receiver based on the 'type' property in the message
      if (message.type === "sender") {
        console.log("sender added");
        senderSocket = ws; // Set senderSocket to this WebSocket connection
      } else if (message.type === "receiver") {
        console.log("receiver added");
        receiverSocket = ws; // Set receiverSocket to this WebSocket connection
      }
      
      // Handle offer creation for WebRTC connections
      else if (message.type === "createOffer") {
        // Only allow the designated sender to send the offer
        if (ws !== senderSocket) {
          return; // Exit if this WebSocket is not the sender
        }
        console.log("sending offer");
        // Send the offer to the receiver
        receiverSocket?.send(
          JSON.stringify({
            type: "createOffer",
            sdp: message.sdp, // Include the SDP (Session Description Protocol) of the offer
          })
        );
      }
      
      // Handle answer creation for WebRTC connections
      else if (message.type === "createAnswer") {
        // Only allow the designated receiver to send the answer
        if (ws !== receiverSocket) {
          return; // Exit if this WebSocket is not the receiver
        }
        console.log("sending answer");
        // Send the answer back to the sender
        senderSocket?.send(
          JSON.stringify({
            type: "createAnswer",
            sdp: message.sdp, // Include the SDP of the answer
          })
        );
      }
      
      // Handle the exchange of ICE candidates
      else if (message.type === "iceCandidate") {
        console.log("sending ice candidate");
        // Check if the message is from the sender, and forward the candidate to the receiver
        if (ws === senderSocket) {
          receiverSocket?.send(
            JSON.stringify({
              type: "iceCandidate",
              candidate: message.candidate, // Include ICE candidate information
            })
          );
        }
        // Otherwise, check if the message is from the receiver, and forward it to the sender
        else if (ws === receiverSocket) {
          senderSocket?.send(
            JSON.stringify({
              type: "iceCandidate",
              candidate: message.candidate,
            })
          );
        }
      }
    } catch (error) {
      // Log any errors that occur during message parsing or handling
      console.error("Error parsing message:", error);
    }
  });
});

// Log a message indicating that the server is successfully running
console.log("WebSocket server is running on ws://localhost:8080");
