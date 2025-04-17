import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ResetPassword from "./ResetPassword";

// Define a Home component for the root route
function Home() {
  return <h1>Welcome to the Home Page!</h1>;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Route for the home page */}
        <Route path="/" element={<Home />} />

        {/* Route for reset password with token */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
