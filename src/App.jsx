import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import PracticeSetup from './pages/PracticeSetup';
import Practice from './pages/Practice';
import WrongQuestions from './pages/WrongQuestions';

function App() {
    return (
        <Router>
            <div className="min-h-screen">
                <Navigation />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/practice-setup" element={<PracticeSetup />} />
                    <Route path="/practice/:bankId" element={<Practice />} />
                    <Route path="/wrong-questions" element={<WrongQuestions />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
