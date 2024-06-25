
# Google Meet Clone

Experience real-time video calls with peer-to-peer connections and seamless communication!



## Features:

### &bull;  Peer-to-Peer Video Calls: Connect directly with participants for a smooth experience.

### &bull;  Screen Sharing: Share your screen effortlessly for enhanced collaboration.



### &bull;  Chat: Communicate through text while on a call.



### &bull;  Responsive Design: Works seamlessly across devices, from desktop to mobile.

### &bull;  Socket.IO Integration: Enables real-time data synchronization for a fluid experience.


#### Socket Routes
| Route Name      | Purpose                                      | Type        |
|-----------------|-------------------------------------------------|-------------|
| new-user-joined | Handles a new user joining a room             | **on**      |
| user-joined     | Broadcasts a user joining a room to other users | **emit**    |
| send            | Sends a chat message to all users in the room   | **emit**    |
| offer           | Sends a user's local media description to others | **emit**    |
| answer          | Sends a user's remote media description to others | **emit**    |
| new-ice-candidate     | Sends an ICE candidate to other users           | **emit**    |
| reply-new-ice-candidate | Sends an ICE candidate reply to other users     | **emit**    |
| disconnect      | Handles a user disconnecting from the socket      | **on**      |
### &bull;  Currently supports 2 participants: Stay tuned for expanded capacity in future updates!


## Getting Started:

### Clone the repository:

    git clone https://github.com/rahulrana701/GoogleMeetClone

### Start the backend:

     cd Backend 
     npm install 
     npm run dev

### Start the frontned:
    npm install
    npm run dev

Access the application:

  Open http://localhost:5173 in your browser.

## Contributing:

  
  &bull; Fork the repository
  
  &bull; Create a branch for your changes
  
  &bull; Commit your changes with clear and concise messages
  
  &bull; Push your changes to your fork
  
  &bull; Create a pull request

## Roadmap:

  &bull; Support for multi-participant calls

  &bull; Enhanced chat features

  &bull; Recording capabilities

  &bull; Performance optimization

## Tech Used:

    &bull; React
    
    &bull; Express Js

    &bull; typescript

    &bull; Webrtc

    &bull; Websockets

    &bull; 

Stay connected for updates and advancements!

