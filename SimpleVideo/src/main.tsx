import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import SocketProvider from "./context/SocketProvider.tsx";
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from "recoil";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RecoilRoot>
    <SocketProvider>
      <App />
    </SocketProvider>
  </RecoilRoot>
);
