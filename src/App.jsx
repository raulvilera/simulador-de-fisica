import { Routes, Route } from "react-router-dom";
import Hub from "./components/Hub.jsx";
import LessonPage from "./components/LessonPage.jsx";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub />} />
      <Route path="/aula/:slug" element={<LessonPage />} />
    </Routes>
  );
}
