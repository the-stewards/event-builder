import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import DesktopNav from "./components/DesktopNav";
import BottomNav from "./components/BottomNav";
import EventHeader from "./components/EventHeader";
import WarningFlags from "./components/WarningFlags";
import RSVPs from "./screens/RSVPs";
import Budget from "./screens/Budget";
import RunOfShow from "./screens/RunOfShow";
import Debrief from "./screens/Debrief";
import { useEventStore } from "./store/useEventStore";
import { colors } from "./components/brand/tokens";

function AppShell() {
  const { loadEvents, events, setActiveEvent, activeEvent } = useEventStore();

  useEffect(() => {
    loadEvents().catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeEvent && events.length > 0) {
      setActiveEvent(events[0].id).catch(() => {});
    }
  }, [events]);

  return (
    <div style={{ minHeight: "100vh", background: colors.cream }}>
      <NavBar />
      <DesktopNav />
      <EventHeader />
      <WarningFlags />
      <Routes>
        <Route path="/" element={<RSVPs />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/runofshow" element={<RunOfShow />} />
        <Route path="/debrief" element={<Debrief />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
