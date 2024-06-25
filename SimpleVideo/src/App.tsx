import Lobby from "./components/Lobby";
import Room from "./components/Room";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Lobby />}></Route>
          <Route path="/room/:roomid" element={<Room />}></Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
