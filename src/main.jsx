import React from "react";
import ReactDOM from "react-dom/client";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom"; 
import App from "./App";
import "./index.css";
import BeronyUserIDCard from "./BeronyUserIDCard";

ReactDOM.createRoot(document.getElementById("root")).render(
    <Router> 
      <Routes>
      <Route path="/" element={<App />}/>

      <Route path="/:userId" element={<App />}/>
      <Route path="threedprofile/:userId" element={<BeronyUserIDCard />}/>

      </Routes>
    </Router>
);
