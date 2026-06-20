import { BrowserRouter, Routes, Route } from "react-router-dom";
import Shell from "./components/Shell";
import SessionsPage from "./pages/SessionsPage";
import HeatmapPage from "./pages/HeatmapPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/" element={<SessionsPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
